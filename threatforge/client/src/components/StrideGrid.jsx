import React from 'react';
import { STRIDE } from '../lib/constants.js';

/**
 * STRIDE coverage matrix: one cell per category (S, T, R, I, D, E) showing
 * open/total threat counts. Cells with open threats take the category color;
 * cells whose threats are all mitigated render in the success color.
 */
export default function StrideGrid({ threats = [] }) {
  return (
    <div className="stride-grid">
      {STRIDE.map((s) => {
        const list = threats.filter((t) => t.stride === s.key);
        const open = list.filter((t) => t.mitigation !== 'Mitigated').length;
        const style = open > 0
          ? { background: s.bg, borderColor: 'transparent' }
          : list.length > 0 ? { background: 'var(--success-bg)', borderColor: 'transparent' } : undefined;
        const letterColor = open > 0 ? s.color : list.length > 0 ? 'var(--success)' : undefined;
        return (
          <div
            key={s.key}
            className="stride-cell"
            style={style}
            title={`${s.name} — ${s.desc}\n${list.length} threat(s), ${open} open`}
          >
            <span className="stride-cell__letter" style={letterColor ? { color: letterColor } : undefined}>{s.key}</span>
            {list.length > 0 && <span className="stride-cell__count">{open}/{list.length}</span>}
          </div>
        );
      })}
    </div>
  );
}
