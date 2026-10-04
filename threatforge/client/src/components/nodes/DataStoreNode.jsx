import React from 'react';
import NodeShell from './NodeShell.jsx';

/**
 * DFD data store node (database, cache, queue, file store) for a React Flow canvas. Register via nodeTypes and render inside <ReactFlow>; data = {label, classification, technology, threats}.
 */
export default function DataStoreNode({ data, selected }) {
  return <NodeShell kind="datastore" data={data} selected={selected} />;
}
