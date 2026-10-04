import React from 'react';
import { ReactFlow, ReactFlowProvider, nodeTypes } from '@threatforge/client';

const threat = (id: string, stride: string, severity: string, description: string, mitigation = 'Open') =>
  ({ id, stride, severity, description, mitigation, control: null });

function Canvas({ data }: { data: any }) {
  return (
    <div style={{ width: 300, height: 150, background: 'var(--bg-deep)' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={[{ id: 'n1', type: 'external', position: { x: 0, y: 0 }, data }]}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          panOnDrag={false}
          zoomOnScroll={false}
        />
      </ReactFlowProvider>
    </div>
  );
}

export const OpenThreats = () => (
  <Canvas data={{ label: 'End User', classification: 'Public', technology: 'Web Browser', threats: [
    threat('t1', 'S', 'Critical', 'Primary threat'),
    threat('t2', 'T', 'Medium', 'Secondary threat'),
    threat('t3', 'R', 'Low', 'Logged', 'Mitigated'),
  ] }} />
);

export const AllMitigated = () => (
  <Canvas data={{ label: 'End User', classification: 'Public', technology: 'Web Browser', threats: [
    threat('t1', 'S', 'High', 'Primary threat', 'Mitigated'),
  ] }} />
);

export const NoThreats = () => (
  <Canvas data={{ label: 'Payment Provider', classification: 'Confidential', technology: 'Stripe API', threats: [] }} />
);
