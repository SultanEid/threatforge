import React from 'react';
import { StrideGrid } from '@threatforge/client';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 280, padding: 12, background: 'var(--bg-0)' }}>{children}</div>
);

export const Mixed = () => (
  <Panel>
    <StrideGrid threats={[
      { stride: 'S', mitigation: 'Open' },
      { stride: 'T', mitigation: 'Open' },
      { stride: 'T', mitigation: 'Mitigated' },
      { stride: 'D', mitigation: 'Mitigated' },
      { stride: 'E', mitigation: 'Open' },
    ]} />
  </Panel>
);

export const AllMitigated = () => (
  <Panel>
    <StrideGrid threats={['S', 'T', 'R', 'I', 'D', 'E'].map((stride) => ({ stride, mitigation: 'Mitigated' }))} />
  </Panel>
);

export const Empty = () => (
  <Panel>
    <StrideGrid threats={[]} />
  </Panel>
);
