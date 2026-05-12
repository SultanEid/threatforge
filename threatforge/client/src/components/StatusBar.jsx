import React from 'react';

export default function StatusBar({ stats }) {
  return (
    <div className="statusbar">
      <div className="status-item"><strong>ELEMENTS</strong> {stats.elements}</div>
      <div className="status-divider" />
      <div className="status-item"><strong>BOUNDARIES</strong> {stats.boundaries}</div>
      <div className="status-divider" />
      <div className="status-item"><strong>FLOWS</strong> {stats.flows}</div>
      <div className="status-divider" />
      <div className="status-item"><strong>THREATS</strong> {stats.open}/{stats.threats}</div>
      <div style={{ flex: 1 }} />
      <div className="sev-counter critical"><strong style={{ color: 'inherit' }}>{stats.critical}</strong> CRITICAL</div>
      <div className="sev-counter high"><strong style={{ color: 'inherit' }}>{stats.high}</strong> HIGH</div>
      <div className="sev-counter medium"><strong style={{ color: 'inherit' }}>{stats.medium}</strong> MEDIUM</div>
      <div className="sev-counter low"><strong style={{ color: 'inherit' }}>{stats.low}</strong> LOW</div>
    </div>
  );
}
