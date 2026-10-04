import React from 'react';
import { ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { Button, Card, KPI, Label, PageHeader, SeverityBadge, StrideChips, timeAgo } from '../components/ui.jsx';
import { STRIDE, STRIDE_BY_KEY, SEVERITIES, SEV_COLOR } from '../lib/constants.js';

const COLS = 'minmax(0,1.5fr) 70px 70px minmax(0,1fr) 120px 80px 90px 16px';

function SevBar({ stats }) {
  return (
    <div className="sev-bar" title={SEVERITIES.map((s) => `${s} ${stats.bySeverity[s]}`).join(' · ')}>
      {stats.total > 0 && SEVERITIES.map((s) => stats.bySeverity[s]
        ? <span key={s} style={{ width: `${(stats.bySeverity[s] / stats.total) * 100}%`, background: SEV_COLOR[s] }} />
        : null)}
    </div>
  );
}

export default function OverviewScreen({ user, projects, attention, onOpen, onFiles }) {
  const tot = projects.reduce((a, p) => ({
    threats: a.threats + p.stats.total,
    open: a.open + p.stats.open,
    crit: a.crit + p.stats.openCritical,
    mit: a.mit + p.stats.mitigated,
    els: a.els + p.node_count,
  }), { threats: 0, open: 0, crit: 0, mit: 0, els: 0 });
  const rate = tot.threats ? Math.round((tot.mit / tot.threats) * 100) : 0;
  const strideTot = STRIDE.map((s) => ({ ...s, n: projects.reduce((a, p) => a + p.stats.byStride[s.key], 0) }));
  const maxS = Math.max(1, ...strideTot.map((s) => s.n));

  return (
    <>
      <PageHeader
        title="All models"
        subtitle={`${projects.length} model${projects.length === 1 ? '' : 's'} · ${tot.threats} threats enumerated · ${user.email}`}
        actions={<Button variant="secondary" icon={FolderOpen} onClick={onFiles}>Manage model files</Button>}
      />
      {projects.length === 0 ? (
        <div className="empty">
          <FolderOpen size={28} />
          <p>No threat models yet. Create a model or upload a <span className="mono">.stm.json</span> file to see a summary here.</p>
          <Button variant="primary" icon={Plus} onClick={onFiles}>New threat model</Button>
        </div>
      ) : (
        <div className="page-body">
          <div className="kpi-grid">
            <KPI label="Models" value={projects.length} sub={`${tot.els} elements in total`} />
            <KPI label="Open threats" value={tot.open} sub={`${tot.crit} critical, across all models`} tone={tot.crit ? 'var(--critical)' : undefined} />
            <KPI label="Mitigation rate" value={`${rate}%`} sub={`${tot.mit} of ${tot.threats} mitigated`} />
            <KPI label="Enumerated" value={tot.threats} sub="threats, all statuses" />
          </div>

          <Card flush className="tbl">
            <div style={{ minWidth: 760 }}>
              <div className="tbl__head" style={{ gridTemplateColumns: COLS }}>
                {['Model', 'Elements', 'Threats', 'Severity mix', 'STRIDE', 'Mitigated', 'Updated', ''].map((h) => <Label key={h}>{h}</Label>)}
              </div>
              {projects.map((p) => {
                const pct = p.stats.total ? Math.round((p.stats.mitigated / p.stats.total) * 100) : 0;
                const cats = new Set(Object.keys(p.stats.byStride).filter((k) => p.stats.byStride[k]));
                return (
                  <div key={p.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: COLS }} onClick={() => onOpen(p.id)}>
                    <div style={{ minWidth: 0 }}>
                      <div className="cell-title">{p.name}</div>
                      <div className="cell-sub">{p.id}</div>
                    </div>
                    <span className="cell-mono">{p.node_count}</span>
                    <span className="cell-mono" style={{ color: 'var(--fg-1)' }}>
                      {p.stats.total}{p.stats.openCritical > 0 && <span style={{ color: 'var(--critical)' }}> · {p.stats.openCritical}c</span>}
                    </span>
                    <SevBar stats={p.stats} />
                    <StrideChips present={cats} />
                    <span className="cell-mono" style={{ color: pct >= 60 ? 'var(--success)' : undefined }}>{pct}%</span>
                    <span className="cell-dim">{timeAgo(p.updated_at)}</span>
                    <ChevronRight size={14} color="var(--fg-4)" />
                  </div>
                );
              })}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            <Card>
              <Label>STRIDE across models</Label>
              <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                {strideTot.map((s) => (
                  <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 28px', alignItems: 'center', gap: 10 }}>
                    <span style={{ font: '500 12px var(--font-sans)', color: 'var(--fg-2)' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 11, color: s.color, marginRight: 8 }}>{s.key}</span>{s.name}
                    </span>
                    <div className="meter"><div style={{ width: `${(s.n / maxS) * 100}%`, background: s.color }} /></div>
                    <span className="cell-mono" style={{ textAlign: 'right', color: s.n ? undefined : 'var(--fg-5)' }}>{s.n}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card flush>
              <div className="card-head"><Label>Needs attention</Label></div>
              {attention.length === 0 && (
                <p style={{ margin: 0, padding: 18, font: '400 13px var(--font-sans)', color: 'var(--fg-3)' }}>
                  No open threats. Every documented threat is mitigated or accepted.
                </p>
              )}
              {attention.map((t) => (
                <div key={t.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => onOpen(t.project_id, t.node_id)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="cell-title">{t.description}</div>
                    <div className="cell-sub">
                      {t.project_name} · {t.node_label || t.node_id} · <span style={{ color: STRIDE_BY_KEY[t.stride].color }}>{t.stride}</span>
                    </div>
                  </div>
                  <SeverityBadge level={t.severity} />
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
