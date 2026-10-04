import React from 'react';
import NodeShell from './NodeShell.jsx';

/**
 * DFD external entity (user, partner, outside system) for a React Flow canvas. Register via nodeTypes and render inside <ReactFlow>; data = {label, classification, technology, threats}.
 */
export default function ExternalEntityNode({ data, selected }) {
  return <NodeShell kind="external" data={data} selected={selected} />;
}
