import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Card, Label, PageHeader, StrideChips } from '../components/ui.jsx';
import { NODE_TYPE_LABEL, classifyColor } from '../lib/constants.js';

const COLS = 'minmax(0,1fr) 90px 130px minmax(0,140px) 80px 150px';

export default function AssetsScreen({ proj, onNavigate, onSelectNode }) {
  const elements = proj.nodes.filter((n) => n.type !== 'boundary');
  return (
    <>
      <PageHeader
        title="Assets"
        subtitle={`${elements.length} elements pulled from the diagram`}
        actions={<Button variant="secondary" icon={Plus} onClick={() => onNavigate('diagram')}>Add element</Button>}
      />
      <div className="page-body">
        <Card flush className="tbl">
          <div style={{ minWidth: 760 }}>
            <div className="tbl__head" style={{ gridTemplateColumns: COLS }}>
              {['Name', 'Type', 'Classification', 'Technology', 'Threats', 'STRIDE coverage'].map((h) => <Label key={h}>{h}</Label>)}
            </div>
            {elements.length === 0 && (
              <p style={{ margin: 0, padding: 18, font: '400 13px var(--font-sans)', color: 'var(--fg-3)' }}>
                No elements yet. Add processes, data stores and external entities in the diagram.
              </p>
            )}
            {elements.map((n) => {
              const threats = n.data.threats || [];
              const open = threats.filter((t) => t.mitigation === 'Open').length;
              return (
                <div key={n.id} className="tbl__row tbl__row--click" style={{ gridTemplateColumns: COLS }} onClick={() => onSelectNode(n.id)} title="Open in diagram">
                  <div style={{ minWidth: 0 }}>
                    <div className="cell-title">{n.data.label || 'Unnamed'}</div>
                    <div className="cell-sub">{n.id}</div>
                  </div>
                  <span className="cell-mono">{NODE_TYPE_LABEL[n.type]}</span>
                  <span className="cell-mono" style={{ color: classifyColor(n.data.classification) }}>{n.data.classification || '—'}</span>
                  <span className="cell-dim" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.data.technology || '—'}</span>
                  <span className="cell-mono" style={{ color: threats.length ? 'var(--fg-1)' : 'var(--fg-5)' }}>
                    {threats.length}{open > 0 && <span style={{ color: 'var(--critical)' }}> · {open} open</span>}
                  </span>
                  <StrideChips present={new Set(threats.map((t) => t.stride))} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
