import React from 'react';
import NodeShell from './NodeShell.jsx';

/**
 * DFD process node (service, app, computation) for a React Flow canvas. Register via nodeTypes and render inside <ReactFlow>; data = {label, classification, technology, threats}.
 */
export default function ProcessNode({ data, selected }) {
  return <NodeShell kind="process" data={data} selected={selected} />;
}
