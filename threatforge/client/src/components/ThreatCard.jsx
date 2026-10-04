import React from 'react';
import { Trash2 } from 'lucide-react';
import { StridePill, SeverityBadge, StatusDot, IconButton } from './ui.jsx';
import { MITIGATIONS } from '../lib/constants.js';

/**
 * A single documented threat: STRIDE pill, severity badge, description,
 * proposed control and status. Pass onStatusChange to make the status
 * editable and onDelete to show a delete button; mitigated threats dim.
 */
export default function ThreatCard({ threat, onStatusChange, onDelete }) {
  const t = threat;
  return (
    <div className={`threat-card ${t.mitigation === 'Mitigated' ? 'is-mitigated' : ''}`}>
      <div className="threat-card__head">
        <span className="threat-card__tags">
          <StridePill letter={t.stride} />
          <SeverityBadge level={t.severity} />
        </span>
        {onDelete && <IconButton icon={Trash2} title="Delete threat" danger onClick={() => onDelete(t.id)} />}
      </div>
      <div className="threat-card__title">{t.description}</div>
      {t.control && <div className="threat-card__control">{t.control}</div>}
      <div className="threat-card__actions">
        {onStatusChange ? (
          <select
            className="select select--sm"
            style={{ width: 'auto' }}
            value={t.mitigation}
            onChange={(e) => onStatusChange(t.id, e.target.value)}
            aria-label="Threat status"
          >
            {MITIGATIONS.map((m) => <option key={m}>{m}</option>)}
          </select>
        ) : (
          <StatusDot status={t.mitigation} />
        )}
      </div>
    </div>
  );
}
