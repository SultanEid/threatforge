import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';

import { api } from './api/client.js';
import { useProject } from './hooks/useProject.js';
import { nodeTypes } from './components/nodes/index.js';
import Sidebar from './components/Sidebar.jsx';
import TopBar from './components/TopBar.jsx';
import Inspector from './components/Inspector.jsx';
import StatusBar from './components/StatusBar.jsx';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [bootError, setBootError] = useState(null);

  const [syncState, setSyncState] = useState('idle'); // idle | syncing | error
  const [toast, setToast] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const rfWrapperRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const handleError = useCallback((e) => {
    console.error(e);
    showToast(e.message || 'Request failed', true);
  }, [showToast]);

  // -------------- BOOT: load projects --------------
  useEffect(() => {
    (async () => {
      try {
        const list = await api.listProjects();
        setProjects(list);
        if (list.length > 0) setCurrentProjectId(list[0].id);
      } catch (e) {
        setBootError(e);
        handleError(e);
      }
    })();
  }, [handleError]);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  // -------------- PROJECT HOOK --------------
  const proj = useProject(currentProjectId, {
    onError: handleError,
    onSync: setSyncState,
  });

  const selectedNode = useMemo(
    () => proj.nodes.find((n) => n.id === selectedNodeId) || null,
    [proj.nodes, selectedNodeId]
  );
  const selectedEdge = useMemo(
    () => proj.edges.find((e) => e.id === selectedEdgeId) || null,
    [proj.edges, selectedEdgeId]
  );

  // -------------- PROJECT MANAGEMENT --------------
  const handleNewProject = async (name) => {
    try {
      const p = await api.createProject({ name, description: '' });
      setProjects((ps) => [{ ...p, node_count: 0, edge_count: 0, threat_count: 0 }, ...ps]);
      setCurrentProjectId(p.id);
      showToast(`Created "${name}"`);
    } catch (e) { handleError(e); }
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      setCurrentProjectId(remaining[0]?.id || null);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      showToast('Project deleted');
    } catch (e) { handleError(e); }
  };

  const handleRenameProject = async (newName) => {
    if (!currentProject) return;
    try {
      const updated = await api.updateProject(currentProject.id, { name: newName });
      setProjects((ps) => ps.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
    } catch (e) { handleError(e); }
  };

  const handleExportReport = async () => {
    if (!currentProject) return;
    try {
      const md = await api.getReport(currentProject.id);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_report.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report exported');
    } catch (e) { handleError(e); }
  };

  // -------------- CANVAS HANDLERS --------------
  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('application/threatforge');
    if (!type || !currentProjectId) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    try {
      await proj.createNode(type, position);
      showToast(`Added ${type}`);
    } catch (err) { /* already surfaced */ }
  }, [currentProjectId, proj, screenToFlowPosition, showToast]);

  const onNodeClick = useCallback((_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }, []);
  const onEdgeClick = useCallback((_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }, []);
  const onPaneClick = useCallback(() => { setSelectedNodeId(null); setSelectedEdgeId(null); }, []);

  // -------------- RENDER --------------
  if (bootError && projects.length === 0) {
    return (
      <div className="splash">
        <div>THREATFORGE</div>
        <div className="splash-sub" style={{ color: 'var(--red)' }}>
          Cannot reach API · is the server running on :4000?
        </div>
        <div className="splash-sub">{bootError.message}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar
        syncState={syncState}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(id) => { setCurrentProjectId(id); setSelectedNodeId(null); setSelectedEdgeId(null); }}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onExportReport={handleExportReport}
      />

      <div className="main">
        <Sidebar />

        <div
          className={`canvas-wrap ${isDragOver ? 'is-dragover' : ''}`}
          ref={rfWrapperRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {currentProject ? (
            <>
              <div className="canvas-overlay">
                <span>Canvas · <strong>{proj.stats.elements}</strong> elements</span>
                <span>·</span>
                <span><strong>{proj.stats.flows}</strong> flows</span>
                <span>·</span>
                <span><strong>{proj.stats.open}</strong> open threats</span>
              </div>
              <div className="scan-overlay" />
              <ReactFlow
                nodes={proj.nodes}
                edges={proj.edges}
                onNodesChange={proj.onNodesChange}
                onEdgesChange={proj.onEdgesChange}
                onConnect={proj.onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#7c8590' },
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e2632" />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(n) => ({
                    external: '#ffb454', process: '#59c2ff', datastore: '#aad94c', boundary: '#d2a6ff',
                  })[n.type] || '#7c8590'}
                  maskColor="rgba(7, 9, 13, 0.7)"
                  pannable zoomable
                />
              </ReactFlow>
            </>
          ) : (
            <div className="inspector-empty" style={{ height: '100%' }}>
              <div className="inspector-empty-mark">[ ◆ ]</div>
              <div className="inspector-empty-text">
                No project selected.<br />Create one in the top bar.
              </div>
            </div>
          )}
        </div>

        <Inspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodePatch={proj.patchNode}
          onNodeDelete={async (id) => { await proj.deleteNode(id); setSelectedNodeId(null); }}
          onEdgePatch={proj.patchEdge}
          onEdgeDelete={async (id) => { await proj.deleteEdge(id); setSelectedEdgeId(null); }}
          onThreatCreate={proj.createThreat}
          onThreatPatch={proj.patchThreat}
          onThreatDelete={proj.deleteThreat}
        />
      </div>

      <StatusBar stats={proj.stats} />

      {toast && (
        <div className={`toast ${toast.isError ? 'is-error' : ''}`}>{toast.message}</div>
      )}
    </div>
  );
}
