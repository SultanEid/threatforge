export const STRIDE = [
  { key: 'S', name: 'Spoofing',           short: 'Spoofing',           color: 'var(--stride-s)', bg: 'var(--stride-s-bg)', desc: 'Authentication' },
  { key: 'T', name: 'Tampering',          short: 'Tampering',          color: 'var(--stride-t)', bg: 'var(--stride-t-bg)', desc: 'Integrity' },
  { key: 'R', name: 'Repudiation',        short: 'Repudiation',        color: 'var(--stride-r)', bg: 'var(--stride-r-bg)', desc: 'Non-repudiation' },
  { key: 'I', name: 'Info disclosure',    short: 'Info disclosure',    color: 'var(--stride-i)', bg: 'var(--stride-i-bg)', desc: 'Confidentiality' },
  { key: 'D', name: 'Denial of service',  short: 'Denial of service',  color: 'var(--stride-d)', bg: 'var(--stride-d-bg)', desc: 'Availability' },
  { key: 'E', name: 'Elev. of privilege', short: 'Elev. of privilege', color: 'var(--stride-e)', bg: 'var(--stride-e-bg)', desc: 'Authorization' },
];

export const STRIDE_BY_KEY = Object.fromEntries(STRIDE.map((s) => [s.key, s]));

export const CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Secret'];
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
export const SEV_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export const SEV_COLOR = { Critical: 'var(--critical)', High: 'var(--high)', Medium: 'var(--medium)', Low: 'var(--low)' };
export const MITIGATIONS = ['Open', 'Mitigated', 'Accepted'];
export const STATUS_COLOR = { Open: 'var(--critical)', Mitigated: 'var(--success)', Accepted: 'var(--fg-4)' };
export const ZONES = ['UNTRUSTED', 'SEMI-TRUSTED', 'TRUSTED', 'RESTRICTED'];

export const AUTH_METHODS = [
  'None', 'Anonymous', 'API Key', 'OAuth 2.0 / OIDC', 'mTLS', 'Session Cookie', 'SAML',
];

export const NODE_TYPE_LABEL = { external: 'external', process: 'process', datastore: 'store', boundary: 'boundary' };

export const NODE_DEFAULTS = {
  external:  { label: 'External Entity', classification: 'Public',       technology: '' },
  process:   { label: 'New Process',     classification: 'Internal',     technology: '' },
  datastore: { label: 'New Data Store',  classification: 'Confidential', technology: '' },
  boundary:  { label: 'New Boundary',    zone: 'TRUSTED', width: 320, height: 220, z_index: -1 },
};

export const classifyColor = (c) =>
  ({ Public: 'var(--success)', Internal: 'var(--info)', Confidential: 'var(--high)', Secret: 'var(--critical)' })[c] || 'var(--fg-4)';
