import React from 'react';
import { ReactFlow, ReactFlowProvider, MarkerType, nodeTypes } from '@threatforge/client';

function Canvas({ nodes, edges = [], width = 300, height = 180 }: { nodes: any[]; edges?: any[]; width?: number; height?: number }) {
  return (
    <div style={{ width, height, background: 'var(--bg-deep)' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          panOnDrag={false}
          zoomOnScroll={false}
        />
      </ReactFlowProvider>
    </div>
  );
}

const boundary = (id: string, x: number, label: string, zone: string, width = 280, height = 220) =>
  ({ id, type: 'boundary', position: { x, y: -20 }, zIndex: -1, data: { label, zone, width, height } });

export const Untrusted = () => <Canvas nodes={[boundary('b1', 0, 'Public Internet', 'UNTRUSTED')]} />;

export const Restricted = () => <Canvas nodes={[boundary('b1', 0, 'Cardholder Data Env', 'RESTRICTED')]} />;

export const ZonesWithFlow = () => (
  <Canvas
    width={560}
    height={220}
    nodes={[
      boundary('b1', -20, 'Public Internet', 'UNTRUSTED'),
      boundary('b2', 320, 'DMZ', 'SEMI-TRUSTED'),
      { id: 'u', type: 'external', position: { x: 30, y: 70 }, data: { label: 'End User', classification: 'Public', technology: 'Web Browser', threats: [] } },
      { id: 'g', type: 'process', position: { x: 370, y: 60 }, data: { label: 'API Gateway', classification: 'Internal', technology: 'Kong + JWT', threats: [
        { id: 't1', stride: 'D', severity: 'Critical', description: 'Volumetric DDoS', mitigation: 'Mitigated' },
        { id: 't2', stride: 'T', severity: 'Medium', description: 'JWT replay', mitigation: 'Open' },
      ] } },
    ]}
    edges={[{ id: 'e1', source: 'u', target: 'g', label: 'HTTPS', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: '#7c8590' } }]}
  />
);
