import React from 'react';

export default function NodeShell({ kind, data, selected, children }) {
  const threats = data.threats || [];
  const openThreats = threats.filter((t) => t.mitigation !== 'Mitigated');
  const total = threats.length;
  const allMitigated = total > 0 && openThreats.length === 0;

  return (
    <div className={`tm-node tm-node--${kind} ${selected ? 'is-selected' : ''}`}>
      {total > 0 && (
        <div className={`threat-pip ${allMitigated ? 'is-mitigated' : ''}`}>
          {allMitigated ? '✓' : `${openThreats.length}/${total}`}
        </div>
      )}
      {children}
    </div>
  );
}
