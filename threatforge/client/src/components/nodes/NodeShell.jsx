import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { STRIDE, NODE_TYPE_LABEL, classifyColor } from '../../lib/constants.js';

/**
 * Shared body for DFD element nodes: name, type · technology, and one STRIDE
 * dot per documented category (dimmed when every threat in it is mitigated).
 */
export default function NodeShell({ kind, data, selected }) {
  const threats = data.threats || [];
  const cats = STRIDE.filter((s) => threats.some((t) => t.stride === s.key)).map((s) => ({
    ...s,
    mitigated: threats.filter((t) => t.stride === s.key).every((t) => t.mitigation === 'Mitigated'),
  }));

  return (
    <div className={`tm-node tm-node--${kind} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <div className="tm-node__name">{data.label || 'Unnamed'}</div>
      <div className="tm-node__meta">
        {NODE_TYPE_LABEL[kind]}{data.technology ? ` · ${data.technology}` : ''}
      </div>
      <div className="tm-node__foot">
        <span className="tm-node__tags">
          {cats.map((s) => (
            <span key={s.key} className={`stride-dot ${s.mitigated ? 'is-mitigated' : ''}`}
              style={{ background: s.bg, color: s.color }} title={s.name}>{s.key}</span>
          ))}
        </span>
        {data.classification && (
          <span className="tm-node__class" style={{ color: classifyColor(data.classification) }}>{data.classification}</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
