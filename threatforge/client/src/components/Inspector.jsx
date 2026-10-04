import React, { useState, useEffect } from 'react';
import { MousePointer2, Plus, Trash2, X } from 'lucide-react';
import { STRIDE, CLASSIFICATIONS, SEVERITIES, AUTH_METHODS, ZONES, NODE_TYPE_LABEL } from '../lib/constants.js';
import { Button, Field, Label } from './ui.jsx';
import ThreatCard from './ThreatCard.jsx';
import StrideGrid from './StrideGrid.jsx';

const EMPTY_DRAFT = { stride: 'S', severity: 'Medium', description: '', control: '' };

export default function Inspector({
  selectedNode, selectedEdge, nodes, edges,
  onNodePatch, onNodeDelete,
  onEdgePatch, onEdgeDelete,
  onThreatCreate, onThreatPatch, onThreatDelete,
}) {
  const [showAddThreat, setShowAddThreat] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  useEffect(() => {
    setShowAddThreat(false);
    setDraft(EMPTY_DRAFT);
  }, [selectedNode?.id, selectedEdge?.id]);

  const labelOf = (id) => nodes.find((n) => n.id === id)?.data.label || id;

  // ----- EDGE INSPECTOR -----
  if (selectedEdge) {
    const d = selectedEdge.data || {};
    return (
      <div className="inspector">
        <div>
          <Label>Data flow</Label>
          <h3 className="inspector__title">{selectedEdge.label || 'Unlabeled flow'}</h3>
          <p className="inspector__id">{labelOf(selectedEdge.source)} → {labelOf(selectedEdge.target)}</p>
        </div>
        <div className="inspector__section">
          <Field label="Label / protocol">
            <input
              className="input"
              key={selectedEdge.id + ':label'}
              defaultValue={selectedEdge.label || ''}
              onBlur={(e) => onEdgePatch(selectedEdge.id, { label: e.target.value })}
              placeholder="e.g. HTTPS · gRPC · SQL"
            />
          </Field>
          <Field label="Data carried">
            <input
              className="input"
              key={selectedEdge.id + ':payload'}
              defaultValue={d.payload || ''}
              onBlur={(e) => onEdgePatch(selectedEdge.id, { payload: e.target.value })}
              placeholder="e.g. PII, JWT, order data"
            />
          </Field>
          <Field label="Authentication">
            <select
              className="select"
              value={d.auth || 'None'}
              onChange={(e) => onEdgePatch(selectedEdge.id, { auth: e.target.value })}
            >
              {AUTH_METHODS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
        </div>
        <Button variant="danger" icon={Trash2} block onClick={() => onEdgeDelete(selectedEdge.id)}>Delete flow</Button>
      </div>
    );
  }

  // ----- EMPTY -----
  if (!selectedNode) {
    return (
      <div className="inspector">
        <div className="inspector__empty">
          <MousePointer2 size={22} />
          Select an element or data flow<br />to inspect its threats.
        </div>
      </div>
    );
  }

  // ----- NODE INSPECTOR -----
  const data = selectedNode.data || {};
  const threats = data.threats || [];
  const isBoundary = selectedNode.type === 'boundary';
  const flows = edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id);

  const addThreat = () => {
    if (!draft.description.trim()) return;
    onThreatCreate(selectedNode.id, { ...draft, mitigation: 'Open' }).catch(() => {});
    setDraft(EMPTY_DRAFT);
    setShowAddThreat(false);
  };

  return (
    <div className="inspector">
      <div>
        <Label>{NODE_TYPE_LABEL[selectedNode.type]}</Label>
        <h3 className="inspector__title">{data.label || 'Unnamed'}</h3>
        <p className="inspector__id">{selectedNode.id}</p>
      </div>

      <div className="inspector__section">
        <Field label="Label">
          <input
            className="input"
            key={selectedNode.id + ':label'}
            defaultValue={data.label || ''}
            onBlur={(e) => onNodePatch(selectedNode.id, { label: e.target.value })}
          />
        </Field>

        {!isBoundary && (
          <div className="field-row">
            <Field label="Classification">
              <select
                className="select"
                value={data.classification || 'Internal'}
                onChange={(e) => onNodePatch(selectedNode.id, { classification: e.target.value })}
              >
                {CLASSIFICATIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Technology">
              <input
                className="input"
                key={selectedNode.id + ':tech'}
                defaultValue={data.technology || ''}
                onBlur={(e) => onNodePatch(selectedNode.id, { technology: e.target.value })}
                placeholder="e.g. Node, PostgreSQL"
              />
            </Field>
          </div>
        )}

        {isBoundary && (
          <Field label="Zone type">
            <select
              className="select"
              value={data.zone || 'TRUSTED'}
              onChange={(e) => onNodePatch(selectedNode.id, { zone: e.target.value })}
            >
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Field>
        )}

        <Field label="Description">
          <textarea
            className="textarea"
            key={selectedNode.id + ':desc'}
            defaultValue={data.description || ''}
            onBlur={(e) => onNodePatch(selectedNode.id, { description: e.target.value })}
            placeholder="What is this component? What does it do?"
          />
        </Field>
      </div>

      {!isBoundary && (
        <>
          <div className="inspector__section">
            <Label>STRIDE coverage</Label>
            <StrideGrid threats={threats} />
          </div>

          <div className="inspector__section">
            <div className="inspector__section-head">
              <Label>STRIDE threats · {threats.length}</Label>
              <Button variant="ghost" size="sm" icon={showAddThreat ? X : Plus} onClick={() => setShowAddThreat((s) => !s)}>
                {showAddThreat ? 'Close' : 'Add'}
              </Button>
            </div>

            {showAddThreat && (
              <div className="add-threat">
                <div className="field-row">
                  <select className="select select--sm" value={draft.stride} onChange={(e) => setDraft({ ...draft, stride: e.target.value })} aria-label="STRIDE category">
                    {STRIDE.map((s) => <option key={s.key} value={s.key}>{s.key} — {s.name}</option>)}
                  </select>
                  <select className="select select--sm" value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} aria-label="Severity">
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea
                  className="textarea"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Threat description…"
                />
                <input
                  className="input"
                  value={draft.control}
                  onChange={(e) => setDraft({ ...draft, control: e.target.value })}
                  placeholder="Proposed control / mitigation"
                />
                <Button variant="primary" size="sm" onClick={addThreat} disabled={!draft.description.trim()}>Add threat</Button>
              </div>
            )}

            {threats.length === 0 && !showAddThreat && (
              <p className="inspector__id">No threats documented.</p>
            )}
            {threats.map((t) => (
              <ThreatCard
                key={t.id}
                threat={t}
                onDelete={(id) => onThreatDelete(id).catch(() => {})}
                onStatusChange={(id, mitigation) => onThreatPatch(id, { mitigation })}
              />
            ))}
          </div>

          {flows.length > 0 && (
            <div className="inspector__section">
              <Label>Flows</Label>
              <div className="inspector__flows">
                {flows.map((f) => (
                  <div key={f.id}>
                    <span>{f.label || 'data'}</span>{' '}
                    {f.source === selectedNode.id ? '→' : '←'} {labelOf(f.source === selectedNode.id ? f.target : f.source)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Button variant="danger" icon={Trash2} block onClick={() => onNodeDelete(selectedNode.id)}>Delete element</Button>
    </div>
  );
}
