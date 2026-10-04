import React from 'react';
import { Download, Workflow } from 'lucide-react';
import { Button, Card, KPI, Label, PageHeader, SeverityBadge, StridePill, timeAgo } from '../components/ui.jsx';
import { STRIDE, SEV_RANK } from '../lib/constants.js';
import { allThreats } from '../lib/utils.js';

export default function DashboardScreen({ project, proj, onNavigate, onSelectNode, onExportReport }) {
  const threats = allThreats(proj.nodes);
  const { stats } = proj;
  const covered = STRIDE.filter((s) => threats.some((t) => t.stride === s.key));
  const missing = STRIDE.filter((s) => !covered.includes(s));
  const recent = threats
    .filter((t) => t.mitigation === 'Open')
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity])
    .slice(0, 5);
  const maxS = Math.max(1, ...STRIDE.map((s) => threats.filter((t) => t.stride === s.key).length));

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={`${project.id} · updated ${timeAgo(project.updated_at)} · ${threats.length} threats documented`}
        actions={<>
          <Button variant="ghost" icon={Download} onClick={onExportReport}>Export report</Button>
          <Button variant="primary" icon={Workflow} onClick={() => onNavigate('diagram')}>Open diagram</Button>
        </>}
      />
      <div className="page-body">
        <div className="kpi-grid">
          <KPI label="Open threats" value={stats.open} sub={`${stats.critical} critical`} tone={stats.critical ? 'var(--critical)' : undefined} />
          <KPI label="Mitigated" value={threats.filter((t) => t.mitigation === 'Mitigated').length} sub={`of ${threats.length} total`} />
          <KPI label="STRIDE coverage" value={`${covered.length}/6`}
            sub={missing.length ? `no ${missing.map((s) => s.name).join(', ')}` : 'all categories covered'} />
          <KPI label="Elements" value={stats.elements} sub={`${stats.flows} flows · ${stats.boundaries} boundaries`} />
        </div>

        <div className="split">
          <Card flush>
            <div className="card-head">
              <Label>Highest open threats</Label>
              <button className="link" onClick={() => onNavigate('threats')}>view all →</button>
            </div>
            {recent.length === 0 && (
              <p style={{ margin: 0, padding: 18, font: '400 13px var(--font-sans)', color: 'var(--fg-3)' }}>
                {threats.length ? 'No open threats — everything documented is mitigated or accepted.' : 'No threats documented yet. Select an element in the diagram to add some.'}
              </p>
            )}
            {recent.map((t) => (
              <div key={t.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: 'minmax(0,1fr) 150px 90px' }} onClick={() => onSelectNode(t.node.id)}>
                <div style={{ minWidth: 0 }}>
                  <div className="cell-title">{t.description}</div>
                  <div className="cell-sub">{t.node.data.label || t.node.id}</div>
                </div>
                <StridePill letter={t.stride} />
                <SeverityBadge level={t.severity} />
              </div>
            ))}
          </Card>
          <Card>
            <Label>STRIDE breakdown</Label>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {STRIDE.map((s) => {
                const c = threats.filter((t) => t.stride === s.key).length;
                return (
                  <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 24px', alignItems: 'center', gap: 10 }} title={s.name}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 11, color: s.color }}>{s.key}</span>
                    <div className="meter"><div style={{ width: `${Math.max(4, (c / maxS) * 100)}%`, background: s.color, opacity: c ? 1 : 0.15 }} /></div>
                    <span className="cell-mono" style={{ textAlign: 'right', color: c ? undefined : 'var(--fg-5)' }}>{c}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
