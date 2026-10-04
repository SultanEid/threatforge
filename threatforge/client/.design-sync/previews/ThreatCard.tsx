import React from 'react';
import { ThreatCard } from '@threatforge/client';

const noop = () => {};
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 300, padding: 12, background: 'var(--bg-0)' }}>{children}</div>
);

export const CriticalOpen = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_1', stride: 'I', severity: 'Critical', mitigation: 'Open',
        description: 'Unencrypted backups in S3 with weak ACL.',
        control: 'KMS-encrypted snapshots, bucket policy' }}
      onStatusChange={noop}
      onDelete={noop}
    />
  </Panel>
);

export const HighOpen = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_2', stride: 'E', severity: 'High', mitigation: 'Open',
        description: 'IDOR on /orders/:id allows cross-tenant read.',
        control: 'Tenant-scoped authorization middleware' }}
      onStatusChange={noop}
      onDelete={noop}
    />
  </Panel>
);

export const MediumOpen = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_3', stride: 'R', severity: 'Medium', mitigation: 'Open',
        description: 'Lack of structured audit log for refund actions.',
        control: 'Append-only event log with operator ID' }}
      onStatusChange={noop}
      onDelete={noop}
    />
  </Panel>
);

export const LowNoControl = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_4', stride: 'S', severity: 'Low', mitigation: 'Open',
        description: 'Verbose login error reveals whether an account exists.' }}
      onStatusChange={noop}
      onDelete={noop}
    />
  </Panel>
);

export const Mitigated = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_5', stride: 'D', severity: 'Critical', mitigation: 'Mitigated',
        description: 'Volumetric DDoS exhausting upstream connections.',
        control: 'CloudFront + WAF, per-IP token bucket' }}
      onStatusChange={noop}
      onDelete={noop}
    />
  </Panel>
);

export const ReadOnly = () => (
  <Panel>
    <ThreatCard
      threat={{ id: 'thr_6', stride: 'T', severity: 'Medium', mitigation: 'Open',
        description: 'JWT replay if signing key is exposed.',
        control: 'Short-lived tokens, key rotation' }}
    />
  </Panel>
);
