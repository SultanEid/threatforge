import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNodesState, useEdgesState, addEdge as rfAddEdge, MarkerType } from '@xyflow/react';
import { api } from '../api/client.js';
import { rowToFlowNode, rowToFlowEdge, debounce } from '../lib/utils.js';
import { NODE_DEFAULTS } from '../lib/constants.js';

/**
 * Single source of truth for the active project: nodes, edges, threats,
 * plus the sync layer that pushes changes to the API.
 */
export function useProject(projectId, { onError, onSync } = {}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  // Position-update debouncers, keyed by node id, so concurrent drags don't collide.
  const posDebouncers = useRef(new Map());

  // ------------------------------------------------------------------------
  // LOAD project
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!projectId) { setNodes([]); setEdges([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.getProject(projectId);
        if (cancelled) return;
        setNodes(data.nodes.map(rowToFlowNode));
        setEdges(data.edges.map(rowToFlowEdge));
      } catch (e) {
        onError?.(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, setNodes, setEdges, onError]);

  // ------------------------------------------------------------------------
  // SYNC helper – wraps API calls with sync-state notifications
  // ------------------------------------------------------------------------
  const sync = useCallback(async (fn) => {
    onSync?.('syncing');
    try {
      const result = await fn();
      onSync?.('idle');
      return result;
    } catch (e) {
      onSync?.('error');
      onError?.(e);
      throw e;
    }
  }, [onSync, onError]);

  // ------------------------------------------------------------------------
  // NODE position auto-save (debounced per node)
  // ------------------------------------------------------------------------
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
        // Final position landed -> persist
        const { id, position } = change;
        let deb = posDebouncers.current.get(id);
        if (!deb) {
          deb = debounce((pos) => sync(() => api.updateNode(id, { position_x: pos.x, position_y: pos.y })), 250);
          posDebouncers.current.set(id, deb);
        }
        deb(position);
      }
    }
  }, [onNodesChange, sync]);

  // ------------------------------------------------------------------------
  // CREATE NODE
  // ------------------------------------------------------------------------
  const createNode = useCallback(async (type, position) => {
    const defaults = NODE_DEFAULTS[type] || {};
    const payload = { type, position_x: position.x, position_y: position.y, ...defaults };
    const row = await sync(() => api.createNode(projectId, payload));
    setNodes((nds) => nds.concat(rowToFlowNode(row)));
    return row;
  }, [projectId, setNodes, sync]);

  // ------------------------------------------------------------------------
  // PATCH NODE data (label, classification, ...)
  // ------------------------------------------------------------------------
  const patchNode = useCallback(async (id, patch) => {
    // Optimistic update first
    setNodes((nds) => nds.map((n) => n.id === id
      ? { ...n, data: { ...n.data, ...patch } }
      : n
    ));
    try {
      const row = await sync(() => api.updateNode(id, patch));
      // Reconcile (especially threats)
      setNodes((nds) => nds.map((n) => n.id === id ? rowToFlowNode(row) : n));
    } catch { /* error already surfaced via onError */ }
  }, [setNodes, sync]);

  // ------------------------------------------------------------------------
  // DELETE NODE
  // ------------------------------------------------------------------------
  const deleteNode = useCallback(async (id) => {
    await sync(() => api.deleteNode(id));
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges, sync]);

  // ------------------------------------------------------------------------
  // EDGES
  // ------------------------------------------------------------------------
  const handleConnect = useCallback(async (params) => {
    // Optimistic stub edge until the server returns the real ID
    const tempId = `tmp_${Date.now()}`;
    const stub = {
      ...params,
      id: tempId,
      type: 'smoothstep',
      label: 'data',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#7c8590' },
      data: { auth: 'None', payload: '' },
    };
    setEdges((eds) => rfAddEdge(stub, eds));

    try {
      const row = await sync(() => api.createEdge(projectId, {
        source_id: params.source,
        target_id: params.target,
        source_handle: params.sourceHandle || null,
        target_handle: params.targetHandle || null,
        label: 'data', auth: 'None', payload: '',
      }));
      setEdges((eds) => eds.map((e) => e.id === tempId ? rowToFlowEdge(row) : e));
    } catch {
      setEdges((eds) => eds.filter((e) => e.id !== tempId));
    }
  }, [projectId, setEdges, sync]);

  const patchEdge = useCallback(async (id, patch) => {
    setEdges((eds) => eds.map((e) => e.id === id
      ? {
          ...e,
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          data: { ...e.data, ...(patch.payload !== undefined ? { payload: patch.payload } : {}), ...(patch.auth !== undefined ? { auth: patch.auth } : {}) },
        }
      : e
    ));
    try { await sync(() => api.updateEdge(id, patch)); } catch {}
  }, [setEdges, sync]);

  const deleteEdge = useCallback(async (id) => {
    await sync(() => api.deleteEdge(id));
    setEdges((eds) => eds.filter((e) => e.id !== id));
  }, [setEdges, sync]);

  // ------------------------------------------------------------------------
  // THREATS
  // ------------------------------------------------------------------------
  const createThreat = useCallback(async (nodeId, threat) => {
    const row = await sync(() => api.createThreat(nodeId, threat));
    setNodes((nds) => nds.map((n) => n.id === nodeId
      ? { ...n, data: { ...n.data, threats: [...(n.data.threats || []), row] } }
      : n
    ));
  }, [setNodes, sync]);

  const patchThreat = useCallback(async (threatId, patch) => {
    // Optimistic update
    setNodes((nds) => nds.map((n) => ({
      ...n,
      data: {
        ...n.data,
        threats: (n.data.threats || []).map((t) => t.id === threatId ? { ...t, ...patch } : t),
      },
    })));
    try { await sync(() => api.updateThreat(threatId, patch)); } catch {}
  }, [setNodes, sync]);

  const deleteThreat = useCallback(async (threatId) => {
    await sync(() => api.deleteThreat(threatId));
    setNodes((nds) => nds.map((n) => ({
      ...n,
      data: { ...n.data, threats: (n.data.threats || []).filter((t) => t.id !== threatId) },
    })));
  }, [setNodes, sync]);

  // ------------------------------------------------------------------------
  // Aggregate stats
  // ------------------------------------------------------------------------
  const stats = useMemo(() => {
    const all = nodes.flatMap((n) => (n.data?.threats || []));
    const open = all.filter((t) => t.mitigation !== 'Mitigated');
    const sev = (l) => open.filter((t) => t.severity === l).length;
    return {
      elements:   nodes.filter((n) => n.type !== 'boundary').length,
      boundaries: nodes.filter((n) => n.type === 'boundary').length,
      flows:      edges.length,
      threats:    all.length,
      open:       open.length,
      critical:   sev('Critical'),
      high:       sev('High'),
      medium:     sev('Medium'),
      low:        sev('Low'),
    };
  }, [nodes, edges]);

  return {
    loading,
    nodes, edges,
    onNodesChange: handleNodesChange,
    onEdgesChange,
    onConnect: handleConnect,
    createNode, patchNode, deleteNode,
    patchEdge, deleteEdge,
    createThreat, patchThreat, deleteThreat,
    stats,
  };
}
