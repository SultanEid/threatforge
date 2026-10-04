// Visual atoms from the SERG Threat Modeler design system.
import React from 'react';
import { Check, TriangleAlert, X } from 'lucide-react';
import { STRIDE_BY_KEY, STATUS_COLOR } from '../lib/constants.js';

export function Button({ variant = 'secondary', size, icon: Icon, block, children, className = '', ...rest }) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block', className].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, title, danger, onClick }) {
  return (
    <button
      className={`icon-btn ${danger ? 'icon-btn--danger' : ''}`}
      title={title}
      aria-label={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <Icon size={14} />
    </button>
  );
}

export const Label = ({ children, style }) => <span className="label" style={style}>{children}</span>;

export const Field = ({ label, children }) => (
  <label className="field">
    <span className="label">{label}</span>
    {children}
  </label>
);

export const Card = ({ children, flush, style, className = '' }) => (
  <div className={`card ${flush ? 'card--flush' : ''} ${className}`} style={style}>{children}</div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

export function StridePill({ letter, compact }) {
  const s = STRIDE_BY_KEY[letter];
  if (!s) return null;
  return (
    <span className={`stride-pill ${compact ? 'stride-pill--compact' : ''}`} style={{ background: s.bg, color: s.color }} title={s.name}>
      <span className="stride-pill__letter">{letter}</span>
      {!compact && s.short}
    </span>
  );
}

export const SeverityBadge = ({ level }) => (
  <span className={`sev-badge sev-badge--${String(level).toLowerCase()}`}>{level}</span>
);

export const StatusDot = ({ status }) => (
  <span className="status-dot" style={{ '--dot': STATUS_COLOR[status] || 'var(--fg-4)' }}>{status}</span>
);

// Six STRIDE squares; filled when the category is present.
export function StrideChips({ present }) {
  return (
    <span className="stride-chips">
      {Object.values(STRIDE_BY_KEY).map((s) => {
        const on = present.has(s.key);
        return (
          <span key={s.key} className="stride-chip" title={s.name}
            style={on ? { background: s.bg, color: s.color, borderColor: 'transparent' } : undefined}>
            {s.key}
          </span>
        );
      })}
    </span>
  );
}

export function KPI({ label, value, sub, tone }) {
  return (
    <Card>
      <Label>{label}</Label>
      <div className="kpi__value" style={tone ? { color: tone } : undefined}>{value}</div>
      <p className="kpi__sub">{sub}</p>
    </Card>
  );
}

export const FilterChip = ({ active, onClick, children }) => (
  <button className={`chip ${active ? 'is-active' : ''}`} onClick={onClick}>{children}</button>
);

export function Notice({ notice, onClose }) {
  if (!notice) return null;
  const err = notice.kind === 'err';
  return (
    <div className={`notice ${err ? 'notice--err' : ''}`} role={err ? 'alert' : 'status'}>
      {err ? <TriangleAlert size={14} /> : <Check size={14} />}
      <span>{notice.text}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><X size={12} /></button>}
    </div>
  );
}

export const initials = (n) => (n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export const Avatar = ({ name, large }) => (
  <span className={`avatar ${large ? 'avatar--lg' : ''}`}>{initials(name)}</span>
);

// SQLite datetime('now') strings are UTC without a zone marker.
export const parseTs = (s) => (s ? Date.parse(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z')) : null);

export function timeAgo(s) {
  const ts = parseTs(s);
  if (!ts) return 'never';
  const sec = Math.max(0, (Date.now() - ts) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
  if (sec < 30 * 86400) return `${Math.floor(sec / 86400)} d ago`;
  return new Date(ts).toISOString().slice(0, 10);
}
