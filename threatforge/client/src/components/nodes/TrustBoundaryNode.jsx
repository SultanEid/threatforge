import React from 'react';
import { NodeResizer } from '@xyflow/react';

/**
 * Dashed trust-boundary zone drawn behind other nodes on a React Flow canvas; data = {label, zone}. Size comes from the node's width/height (resizable when selected); give it zIndex -1.
 */
export default function TrustBoundaryNode({ data, selected }) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={100}
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{ width: 8, height: 8, background: 'var(--bg-1)', border: '1px solid var(--accent)', borderRadius: 2 }}
      />
      <div className={`tm-boundary ${selected ? 'is-selected' : ''}`} style={{ width: '100%', height: '100%' }}>
        <span className="tm-boundary__label">
          Trust boundary · {data.zone || 'ZONE'}{data.label ? ` · ${data.label}` : ''}
        </span>
      </div>
    </>
  );
}
