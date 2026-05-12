import React from 'react';
import { PALETTE, STRIDE } from '../lib/constants.js';

export default function Sidebar() {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/threatforge', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar">
      <div className="panel-section">
        <div className="panel-header">Elements</div>
        {PALETTE.map((p) => (
          <div
            key={p.type}
            className={p.cls}
            draggable
            onDragStart={(e) => onDragStart(e, p.type)}
          >
            <div className="palette-name">{p.name}</div>
            <div className="palette-desc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="panel-section">
        <div className="panel-header">Legend</div>
        <div className="legend">
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--accent)' }} /> External Entity</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--cool)' }} /> Process</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--green)' }} /> Data Store</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--purple)' }} /> Trust Boundary</div>
          <div style={{ height: 6 }} />
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--red)' }} /> Open Threat</div>
          <div className="legend-row"><span className="legend-dot" style={{ background: 'var(--green)' }} /> Mitigated</div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-header">STRIDE Key</div>
        <div className="legend">
          {STRIDE.map((s) => (
            <div key={s.key} className="legend-row" style={{ marginBottom: 2 }}>
              <span style={{ color: s.color, fontWeight: 700, width: 14 }}>{s.key}</span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-header">Tips</div>
        <div className="legend">
          → Drag elements onto the canvas<br />
          → Connect handles to add flows<br />
          → Click any element to inspect<br />
          → All changes auto-save
        </div>
      </div>
    </div>
  );
}
