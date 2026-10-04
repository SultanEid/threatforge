import React, { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Controls, MiniMap, MarkerType, useReactFlow } from '@xyflow/react';
import { Circle, Database, Square, SquareDashed } from 'lucide-react';
import { PageHeader } from '../components/ui.jsx';
import { nodeTypes } from '../components/nodes/index.js';
import Inspector from '../components/Inspector.jsx';

const TOOLS = [
  { type: 'process', icon: Square, label: 'Process' },
  { type: 'datastore', icon: Database, label: 'Data store' },
  { type: 'external', icon: Circle, label: 'External entity' },
  { type: 'boundary', icon: SquareDashed, label: 'Trust boundary' },
];

const MINIMAP_COLOR = { external: '#7d8b9e', process: '#7CE3D8', datastore: '#6e9bff', boundary: 'rgba(255, 157, 58, 0.08)' };

export default function DiagramScreen({ project, proj, selection, setSelection, notify }) {
  const { screenToFlowPosition } = useReactFlow();
  const [isDragOver, setIsDragOver] = useState(false);
  const { nodeId: selectedNodeId, edgeId: selectedEdgeId } = selection;

  const selectedNode = useMemo(() => proj.nodes.find((n) => n.id === selectedNodeId) || null, [proj.nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => proj.edges.find((e) => e.id === selectedEdgeId) || null, [proj.edges, selectedEdgeId]);

  // React Flow drives `selected` from its own state; mirror our selection into it.
  const nodes = useMemo(() => proj.nodes.map((n) => (n.selected === (n.id === selectedNodeId) ? n : { ...n, selected: n.id === selectedNodeId })), [proj.nodes, selectedNodeId]);

  const addNode = useCallback(async (type, position) => {
    try {
      const row = await proj.createNode(type, position);
      setSelection({ nodeId: row.id, edgeId: null });
      notify(`Added ${type === 'datastore' ? 'data store' : type}`);
    } catch { /* surfaced by the sync layer */ }
  }, [proj, setSelection, notify]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('application/threatforge');
    if (type) addNode(type, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [addNode, screenToFlowPosition]);

  // Clicking a tool drops the element in the middle of the visible canvas.
  const addAtCenter = (type, e) => {
    const rect = e.currentTarget.closest('.canvas').getBoundingClientRect();
    const pos = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    addNode(type, { x: pos.x - 75, y: pos.y - 30 });
  };

  const elements = proj.stats.elements;

  return (
    <>
      <PageHeader
        title="Diagram"
        subtitle={`${project.name} · ${elements} elements · ${proj.stats.flows} flows · ${proj.stats.open} open threats`}
      />
      <div className="diagram">
        <div
          className={`canvas grid-bg ${isDragOver ? 'is-dragover' : ''}`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <div className="canvas-toolbar">
            {TOOLS.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                className="tool-btn"
                title={`${label} — click or drag onto the canvas`}
                aria-label={`Add ${label}`}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('application/threatforge', type); e.dataTransfer.effectAllowed = 'move'; }}
                onClick={(e) => addAtCenter(type, e)}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
          {proj.nodes.length === 0 && !proj.loading && (
            <div className="canvas-hint">
              <p>No elements yet. Use the toolbar to place a process, data store or external entity, then drag between handles to add data flows.</p>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={proj.edges}
            onNodesChange={proj.onNodesChange}
            onEdgesChange={proj.onEdgesChange}
            onConnect={proj.onConnect}
            onBeforeDelete={proj.onBeforeDelete}
            onNodeClick={(_, n) => setSelection({ nodeId: n.id, edgeId: null })}
            onEdgeClick={(_, e) => setSelection({ nodeId: null, edgeId: e.id })}
            onPaneClick={() => setSelection({ nodeId: null, edgeId: null })}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#7CE3D8' } }}
            proOptions={{ hideAttribution: true }}
          >
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(n) => MINIMAP_COLOR[n.type] || '#5a6678'}
              nodeStrokeColor={(n) => (n.type === 'boundary' ? '#ff9d3a' : 'transparent')}
              nodeStrokeWidth={2}
              maskColor="rgba(5, 7, 9, 0.7)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
        <Inspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={proj.nodes}
          edges={proj.edges}
          onNodePatch={proj.patchNode}
          onNodeDelete={(id) => proj.deleteNode(id).then(() => setSelection({ nodeId: null, edgeId: null }), () => {})}
          onEdgePatch={proj.patchEdge}
          onEdgeDelete={(id) => proj.deleteEdge(id).then(() => setSelection({ nodeId: null, edgeId: null }), () => {})}
          onThreatCreate={proj.createThreat}
          onThreatPatch={proj.patchThreat}
          onThreatDelete={proj.deleteThreat}
        />
      </div>
    </>
  );
}
