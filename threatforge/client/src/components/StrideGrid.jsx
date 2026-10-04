import React from 'react';
import { STRIDE } from '../lib/constants.js';

/**
 * STRIDE coverage matrix: one cell per category (S, T, R, I, D, E) showing
 * open/total threat counts. Cells with open threats are highlighted; cells
 * whose threats are all mitigated render as covered.
 */
export default function StrideGrid({ threats = [] }) {
  return (
    <div className="stride-grid">
      {STRIDE.map((s) => {
        const list = threats.filter((t) => t.stride === s.key);
        const open = list.filter((t) => t.mitigation !== 'Mitigated').length;
        const cls = open > 0 ? 'has-threats' : list.length > 0 ? 'all-mitigated' : '';
        return (
          <div
            key={s.key}
            className={`stride-cell ${cls}`}
            title={`${s.name} — ${s.desc}\n${list.length} threat(s), ${open} open`}
          >
            <div className="stride-letter" style={{ color: s.color }}>{s.key}</div>
            {list.length > 0 && <div className="stride-count">{open}/{list.length}</div>}
          </div>
        );
      })}
    </div>
  );
}
