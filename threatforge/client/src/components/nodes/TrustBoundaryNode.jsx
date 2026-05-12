import React from 'react';

export default function TrustBoundaryNode({ data, selected }) {
  return (
    <div
      className={`tm-node tm-node--boundary ${selected ? 'is-selected' : ''}`}
      style={{ width: data.width || 320, height: data.height || 200 }}
    >
      <div className="tm-node__head">
        <span>┄ TRUST BOUNDARY</span>
        <span>{data.zone || 'ZONE'}</span>
      </div>
      <div className="tm-node__body" style={{ opacity: 0.7 }}>
        <div className="tm-node__title" style={{ fontSize: 11 }}>{data.label || 'Untitled Boundary'}</div>
      </div>
    </div>
  );
}
