import React from 'react';
import { STRIDE_BY_KEY } from '../lib/constants.js';

/**
 * A single documented threat: STRIDE category, severity, description,
 * proposed control, and a mitigation toggle. Severity drives the left accent
 * color; mitigated threats render dimmed with a check tag.
 */
export default function ThreatCard({ threat, onToggleMitigation, onDelete }) {
  const t = threat;
  const isMit = t.mitigation === 'Mitigated';
  const sev = String(t.severity).toLowerCase();
  return (
    <div className={`threat-card sev-${sev} ${isMit ? 'is-mitigated' : ''}`}>
      <div className="threat-head">
        <div className="threat-head-tags">
          <span className="threat-stride">{t.stride} · {STRIDE_BY_KEY[t.stride]?.name}</span>
          <span className={`threat-sev sev-${sev}`}>{t.severity}</span>
          {isMit && <span className="threat-mit">✓ Mitigated</span>}
        </div>
        {onDelete && <button className="icon-btn" onClick={() => onDelete(t.id)} title="Delete">×</button>}
      </div>
      <div className="threat-desc">{t.description}</div>
      {t.control && (
        <div className="threat-desc" style={{ color: 'var(--text-tertiary)', marginTop: 4, fontSize: 10 }}>
          ↳ {t.control}
        </div>
      )}
      {onToggleMitigation && (
        <div className="threat-actions">
          <button onClick={() => onToggleMitigation(t.id, isMit ? 'Open' : 'Mitigated')}>
            {isMit ? 'Reopen' : 'Mark Mitigated'}
          </button>
        </div>
      )}
    </div>
  );
}
