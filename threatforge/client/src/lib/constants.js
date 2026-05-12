export const STRIDE = [
  { key: 'S', name: 'Spoofing',           color: 'var(--red)',    desc: 'Authentication' },
  { key: 'T', name: 'Tampering',          color: 'var(--warm)',   desc: 'Integrity' },
  { key: 'R', name: 'Repudiation',        color: 'var(--accent)', desc: 'Non-repudiation' },
  { key: 'I', name: 'Info Disclosure',    color: 'var(--cool)',   desc: 'Confidentiality' },
  { key: 'D', name: 'Denial of Service',  color: 'var(--purple)', desc: 'Availability' },
  { key: 'E', name: 'Elevation of Priv.', color: 'var(--pink)',   desc: 'Authorization' },
];

export const STRIDE_BY_KEY = Object.fromEntries(STRIDE.map((s) => [s.key, s]));

export const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Secret'];
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
export const MITIGATIONS = ['Open', 'Mitigated', 'Accepted'];

export const AUTH_METHODS = [
  'None', 'Anonymous', 'API Key', 'OAuth 2.0 / OIDC', 'mTLS', 'Session Cookie', 'SAML',
];

export const PALETTE = [
  { type: 'external',  name: 'External Entity', desc: 'User, partner, or external system outside the trust zone.',  cls: 'palette-item' },
  { type: 'process',   name: 'Process',         desc: 'Application, service, microservice, or computation.',        cls: 'palette-item palette-item--process' },
  { type: 'datastore', name: 'Data Store',      desc: 'Database, file system, cache, queue, or any storage.',       cls: 'palette-item palette-item--datastore' },
  { type: 'boundary',  name: 'Trust Boundary',  desc: 'Group elements; data crossing this edge requires scrutiny.', cls: 'palette-item palette-item--boundary' },
];

export const NODE_DEFAULTS = {
  external:  { label: 'External Entity', classification: 'Public',       technology: '' },
  process:   { label: 'New Process',     classification: 'Internal',     technology: '' },
  datastore: { label: 'New Data Store',  classification: 'Confidential', technology: '' },
  boundary:  { label: 'New Boundary',    zone: 'TRUSTED', width: 280, height: 200, z_index: -1 },
};

export const classifyColor = (c) =>
  ({ Public: 'var(--green)', Internal: 'var(--cool)', Confidential: 'var(--warm)', Secret: 'var(--red)' })[c] || 'var(--text-tertiary)';
