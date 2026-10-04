import React from 'react';
import { Handle, Position } from '@xyflow/react';
import NodeShell from './NodeShell.jsx';
import { classifyColor } from '../../lib/constants.js';

/**
 * DFD process node (service, app, computation) for a React Flow canvas. Register via nodeTypes and render inside <ReactFlow>; data = {label, classification, technology, threats}.
 */
export default function ProcessNode({ data, selected }) {
  return (
    <NodeShell kind="process" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <div className="tm-node__head">
        <span>● PROCESS</span>
        <span style={{ color: classifyColor(data.classification) }}>{data.classification || '—'}</span>
      </div>
      <div className="tm-node__body">
        <div className="tm-node__title">{data.label || 'Unnamed Process'}</div>
        <div className="tm-node__meta">{data.technology && <span>{data.technology}</span>}</div>
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
    </NodeShell>
  );
}
