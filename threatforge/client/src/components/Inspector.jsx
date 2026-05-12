import React, { useState, useEffect } from 'react';
import { STRIDE, STRIDE_BY_KEY, CLASSIFICATIONS, SEVERITIES, AUTH_METHODS } from '../lib/constants.js';

export default function Inspector({
  selectedNode, selectedEdge,
  onNodePatch, onNodeDelete,
  onEdgePatch, onEdgeDelete,
  onThreatCreate, onThreatPatch, onThreatDelete,
}) {
  const [showAddThreat, setShowAddThreat] = useState(false);
  const [draft, setDraft] = useState({ stride: 'S', severity: 'Medium', description: '', control: '' });

  useEffect(() => {
    setShowAddThreat(false);
    setDraft({ stride: 'S', severity: 'Medium', description: '', control: '' });
  }, [selectedNode?.id, selectedEdge?.id]);

  // ----- EDGE INSPECTOR -----
  if (selectedEdge) {
    const d = selectedEdge.data || {};
    return (
      <div className="inspector">
        <div className="inspector-head">
          <div className="inspector-tag">DATA FLOW</div>
          <div className="inspector-title">{selectedEdge.label || 'Unlabeled flow'}</div>
          <div className="inspector-id">{selectedEdge.id}</div>
        </div>
        <div className="field-group">
          <div className="field">
            <div className="field-label">Label / Protocol</div>
            <input
              defaultValue={selectedEdge.label || ''}
              onBlur={(e) => onEdgePatch(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g. HTTPS · gRPC · SQL"
            />
          </div>
          <div className="field">
            <div className="field-label">Data Carried</div>
            <input
              defaultValue={d.payload || ''}
              onBlur={(e) => onEdgePatch(selectedEdge.id, { payload: e.target.value })}
              placeholder="e.g. PII, JWT, order data"
            />
          </div>
          <div className="field">
            <div className="field-label">Authentication</div>
            <select
              defaultValue={d.auth || 'None'}
              onChange={(e) => onEdgePatch(selectedEdge.id, { auth: e.target.value })}
            >
              {AUTH_METHODS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="field-group">
          <button onClick={() => onEdgeDelete(selectedEdge.id)} style={{ width: '100%' }}>Delete Flow</button>
        </div>
      </div>
    );
  }

  // ----- EMPTY -----
  if (!selectedNode) {
    return (
      <div className="inspector">
        <div className="inspector-empty">
          <div className="inspector-empty-mark">[ ◆ ]</div>
          <div className="inspector-empty-text">
            Select an element<br />or data flow<br />to inspect threats
          </div>
        </div>
      </div>
    );
  }

  // ----- NODE INSPECTOR -----
  const data = selectedNode.data || {};
  const threats = data.threats || [];
  const isBoundary = selectedNode.type === 'boundary';

  const strideCounts = STRIDE.reduce((acc, s) => {
    const list = threats.filter((t) => t.stride === s.key);
    acc[s.key] = {
      total: list.length,
      open: list.filter((t) => t.mitigation !== 'Mitigated').length,
    };
    return acc;
  }, {});

  const addThreat = () => {
    if (!draft.description.trim()) return;
    onThreatCreate(selectedNode.id, { ...draft, mitigation: 'Open' });
    setDraft({ stride: 'S', severity: 'Medium', description: '', control: '' });
    setShowAddThreat(false);
  };

  return (
    <div className="inspector">
      <div className="inspector-head">
        <div className="inspector-tag">{selectedNode.type.toUpperCase()}</div>
        <div className="inspector-title">{data.label || 'Unnamed'}</div>
        <div className="inspector-id">ID · {selectedNode.id}</div>
      </div>

      <div className="field-group">
        <div className="field">
          <div className="field-label">Label</div>
          <input
            key={selectedNode.id + ':label'}
            defaultValue={data.label || ''}
            onBlur={(e) => onNodePatch(selectedNode.id, { label: e.target.value })}
          />
        </div>

        {!isBoundary && (
          <div className="field-row" style={{ marginTop: 12 }}>
            <div className="field" style={{ marginTop: 0 }}>
              <div className="field-label">Classification</div>
              <select
                value={data.classification || 'Internal'}
                onChange={(e) => onNodePatch(selectedNode.id, { classification: e.target.value })}
              >
                {CLASSIFICATIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginTop: 0 }}>
              <div className="field-label">Technology</div>
              <input
                key={selectedNode.id + ':tech'}
                defaultValue={data.technology || ''}
                onBlur={(e) => onNodePatch(selectedNode.id, { technology: e.target.value })}
                placeholder="e.g. Node, PostgreSQL"
              />
            </div>
          </div>
        )}

        {isBoundary && (
          <div className="field">
            <div className="field-label">Zone Type</div>
            <select
              value={data.zone || 'TRUSTED'}
              onChange={(e) => onNodePatch(selectedNode.id, { zone: e.target.value })}
            >
              <option>UNTRUSTED</option>
              <option>SEMI-TRUSTED</option>
              <option>TRUSTED</option>
              <option>RESTRICTED</option>
            </select>
          </div>
        )}

        <div className="field">
          <div className="field-label">Description</div>
          <textarea
            key={selectedNode.id + ':desc'}
            defaultValue={data.description || ''}
            onBlur={(e) => onNodePatch(selectedNode.id, { description: e.target.value })}
            placeholder="What is this component? What does it do?"
          />
        </div>
      </div>

      {!isBoundary && (
        <>
          <div className="field-group">
            <div className="field-label">STRIDE Coverage Matrix</div>
            <div className="stride-grid">
              {STRIDE.map((s) => {
                const c = strideCounts[s.key];
                const cls = c.open > 0 ? 'has-threats' : c.total > 0 ? 'all-mitigated' : '';
                return (
                  <div
                    key={s.key}
                    className={`stride-cell ${cls}`}
                    title={`${s.name} — ${s.desc}\n${c.total} threat(s), ${c.open} open`}
                  >
                    <div className="stride-letter" style={{ color: s.color }}>{s.key}</div>
                    {c.total > 0 && <div className="stride-count">{c.open}/{c.total}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">
              <span>Threats · {threats.length}</span>
              <button
                className="ghost"
                style={{ padding: '2px 6px', fontSize: 10 }}
                onClick={() => setShowAddThreat((s) => !s)}
              >
                {showAddThreat ? '× close' : '+ add'}
              </button>
            </div>

            {showAddThreat && (
              <div className="add-threat-form">
                <div className="field-row">
                  <select value={draft.stride} onChange={(e) => setDraft({ ...draft, stride: e.target.value })}>
                    {STRIDE.map((s) => <option key={s.key} value={s.key}>{s.key} — {s.name}</option>)}
                  </select>
                  <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })}>
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Threat description…"
                />
                <input
                  value={draft.control}
                  onChange={(e) => setDraft({ ...draft, control: e.target.value })}
                  placeholder="Proposed control / mitigation"
                />
                <button className="primary" onClick={addThreat}>Add Threat</button>
              </div>
            )}

            <div className="threat-list" style={{ marginTop: showAddThreat ? 10 : 0 }}>
              {threats.length === 0 && !showAddThreat && (
                <div style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '0.1em', padding: '8px 0', textAlign: 'center' }}>
                  NO THREATS DOCUMENTED
                </div>
              )}
              {threats.map((t) => {
                const isMit = t.mitigation === 'Mitigated';
                return (
                  <div key={t.id} className={`threat-card sev-${String(t.severity).toLowerCase()} ${isMit ? 'is-mitigated' : ''}`}>
                    <div className="threat-head">
                      <div className="threat-head-tags">
                        <span className="threat-stride">{t.stride} · {STRIDE_BY_KEY[t.stride]?.name}</span>
                        <span className={`threat-sev sev-${String(t.severity).toLowerCase()}`}>{t.severity}</span>
                        {isMit && <span className="threat-mit">✓ Mitigated</span>}
                      </div>
                      <button className="icon-btn" onClick={() => onThreatDelete(t.id)} title="Delete">×</button>
                    </div>
                    <div className="threat-desc">{t.description}</div>
                    {t.control && (
                      <div className="threat-desc" style={{ color: 'var(--text-tertiary)', marginTop: 4, fontSize: 10 }}>
                        ↳ {t.control}
                      </div>
                    )}
                    <div className="threat-actions">
                      <button onClick={() => onThreatPatch(t.id, { mitigation: isMit ? 'Open' : 'Mitigated' })}>
                        {isMit ? 'Reopen' : 'Mark Mitigated'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="field-group">
        <button onClick={() => onNodeDelete(selectedNode.id)} style={{ width: '100%' }}>Delete Element</button>
      </div>
    </div>
  );
}
