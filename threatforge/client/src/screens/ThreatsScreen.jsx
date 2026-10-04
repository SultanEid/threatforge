import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, Card, FilterChip, Label, PageHeader, SeverityBadge, StatusDot, StridePill } from '../components/ui.jsx';
import { STRIDE, SEVERITIES, SEV_RANK } from '../lib/constants.js';
import { allThreats } from '../lib/utils.js';

const COLS = 'minmax(0,1fr) 160px 100px 120px minmax(0,160px)';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function ThreatsScreen({ project, proj, onSelectNode }) {
  const [stride, setStride] = useState('all');
  const [severity, setSeverity] = useState('all');
  const threats = allThreats(proj.nodes).sort((a, b) =>
    SEV_RANK[a.severity] - SEV_RANK[b.severity] || (a.mitigation === 'Open' ? -1 : 1) - (b.mitigation === 'Open' ? -1 : 1));
  const filtered = threats.filter((t) => (stride === 'all' || t.stride === stride) && (severity === 'all' || t.severity === severity));

  const exportCsv = () => {
    const rows = [['ID', 'Element', 'STRIDE', 'Severity', 'Status', 'Threat', 'Control']]
      .concat(filtered.map((t) => [t.id, t.node.data.label, t.stride, t.severity, t.mitigation, t.description, t.control]));
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_threats.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <PageHeader
        title="Threats"
        subtitle={`${filtered.length} of ${threats.length} threats · sorted by severity`}
        actions={<Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!filtered.length}>Export CSV</Button>}
      />
      <div className="page-body">
        <div className="chips">
          <FilterChip active={stride === 'all'} onClick={() => setStride('all')}>All · {threats.length}</FilterChip>
          {STRIDE.map((s) => (
            <FilterChip key={s.key} active={stride === s.key} onClick={() => setStride(s.key)}>
              <span style={{ color: s.color, fontWeight: 700, marginRight: 4 }}>{s.key}</span>
              {threats.filter((t) => t.stride === s.key).length}
            </FilterChip>
          ))}
          <span style={{ width: 12 }} />
          <select className="select select--sm" style={{ width: 'auto' }} value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Filter by severity">
            <option value="all">All severities</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Card flush className="tbl">
          <div style={{ minWidth: 720 }}>
            <div className="tbl__head" style={{ gridTemplateColumns: COLS }}>
              {['Threat', 'STRIDE', 'Severity', 'Status', 'Element'].map((h) => <Label key={h}>{h}</Label>)}
            </div>
            {filtered.length === 0 && (
              <p style={{ margin: 0, padding: 18, font: '400 13px var(--font-sans)', color: 'var(--fg-3)' }}>
                {threats.length ? 'No threats match these filters.' : 'No threats documented yet. Select an element in the diagram to add some.'}
              </p>
            )}
            {filtered.map((t) => (
              <div key={t.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: COLS }} onClick={() => onSelectNode(t.node.id)} title="Open in diagram">
                <div style={{ minWidth: 0 }}>
                  <div className="cell-title">{t.description}</div>
                  <div className="cell-sub">{t.id}{t.control ? ` · ${t.control}` : ''}</div>
                </div>
                <span><StridePill letter={t.stride} /></span>
                <span><SeverityBadge level={t.severity} /></span>
                <span><StatusDot status={t.mitigation} /></span>
                <span className="cell-dim" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.node.data.label || t.node.id}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
