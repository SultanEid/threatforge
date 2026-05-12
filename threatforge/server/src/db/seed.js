import { db, runSchema } from './index.js';
import { idFor } from '../lib/uid.js';

runSchema();

const existing = db.prepare("SELECT id FROM projects WHERE name = ?").get('E-Commerce Platform v1.0');
if (existing) {
  console.log('[seed] Example project already exists →', existing.id);
  process.exit(0);
}

const projectId = idFor('proj');
const tx = db.transaction(() => {
  db.prepare(`INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`)
    .run(projectId, 'E-Commerce Platform v1.0', 'Reference example: customer → API gateway → service → DB.');

  const nodes = [
    {
      id: idFor('node'), type: 'boundary',
      position_x: -20, position_y: -20,
      label: 'Public Internet', zone: 'UNTRUSTED',
      width: 280, height: 220, z_index: -1,
    },
    {
      id: idFor('node'), type: 'boundary',
      position_x: 320, position_y: -20,
      label: 'DMZ', zone: 'SEMI-TRUSTED',
      width: 280, height: 220, z_index: -1,
    },
    {
      id: idFor('node'), type: 'boundary',
      position_x: 660, position_y: -20,
      label: 'Internal Network', zone: 'TRUSTED',
      width: 320, height: 360, z_index: -1,
    },
    {
      id: idFor('node'), type: 'external',
      position_x: 30, position_y: 70,
      label: 'End User', classification: 'Public', technology: 'Web Browser',
      description: 'Authenticated customers accessing the platform.',
    },
    {
      id: idFor('node'), type: 'process',
      position_x: 370, position_y: 60,
      label: 'API Gateway', classification: 'Internal', technology: 'Kong + JWT',
      description: 'Edge proxy: TLS termination, auth, rate limiting.',
    },
    {
      id: idFor('node'), type: 'process',
      position_x: 720, position_y: 60,
      label: 'Orders Service', classification: 'Confidential', technology: 'Node.js',
      description: 'Business logic for order lifecycle.',
    },
    {
      id: idFor('node'), type: 'datastore',
      position_x: 720, position_y: 230,
      label: 'Orders DB', classification: 'Secret', technology: 'PostgreSQL 16',
      description: 'Primary OLTP store for orders and customer PII.',
    },
  ];

  const insNode = db.prepare(`INSERT INTO nodes
    (id, project_id, type, position_x, position_y, label, classification, technology, description, zone, width, height, z_index)
    VALUES (@id, @project_id, @type, @position_x, @position_y, @label, @classification, @technology, @description, @zone, @width, @height, @z_index)`);
  nodes.forEach((n) => insNode.run({
    project_id: projectId,
    label: null, classification: null, technology: null, description: null,
    zone: null, width: null, height: null, z_index: 0,
    ...n,
  }));

  // Find IDs by label for edge wiring
  const byLabel = (lbl) => nodes.find((n) => n.label === lbl).id;

  const edges = [
    { id: idFor('edge'), source_id: byLabel('End User'),     target_id: byLabel('API Gateway'),   label: 'HTTPS', payload: 'Auth, order requests', auth: 'OAuth 2.0 / OIDC' },
    { id: idFor('edge'), source_id: byLabel('API Gateway'),  target_id: byLabel('Orders Service'),label: 'gRPC',  payload: 'Order operations',     auth: 'mTLS' },
    { id: idFor('edge'), source_id: byLabel('Orders Service'),target_id: byLabel('Orders DB'),    label: 'SQL/TLS', payload: 'PII, orders',         auth: 'mTLS' },
  ];
  const insEdge = db.prepare(`INSERT INTO edges
    (id, project_id, source_id, target_id, label, payload, auth)
    VALUES (@id, @project_id, @source_id, @target_id, @label, @payload, @auth)`);
  edges.forEach((e) => insEdge.run({ project_id: projectId, ...e }));

  const insThreat = db.prepare(`INSERT INTO threats
    (id, node_id, stride, severity, description, control, mitigation)
    VALUES (@id, @node_id, @stride, @severity, @description, @control, @mitigation)`);

  const threats = [
    { node_id: byLabel('End User'),       stride: 'S', severity: 'High',     description: 'Credential phishing via lookalike domain.',                control: 'WebAuthn / MFA enforcement',          mitigation: 'Open' },
    { node_id: byLabel('API Gateway'),    stride: 'D', severity: 'Critical', description: 'Volumetric DDoS exhausting upstream connections.',         control: 'CloudFront + WAF, per-IP token bucket', mitigation: 'Mitigated' },
    { node_id: byLabel('API Gateway'),    stride: 'T', severity: 'Medium',   description: 'JWT replay if signing key is exposed.',                    control: 'Short-lived tokens, key rotation',     mitigation: 'Open' },
    { node_id: byLabel('Orders Service'), stride: 'E', severity: 'High',     description: 'IDOR on /orders/:id allows cross-tenant read.',            control: 'Tenant-scoped authorization middleware', mitigation: 'Open' },
    { node_id: byLabel('Orders Service'), stride: 'R', severity: 'Medium',   description: 'Lack of structured audit log for refund actions.',         control: 'Append-only event log with operator ID', mitigation: 'Open' },
    { node_id: byLabel('Orders DB'),      stride: 'I', severity: 'Critical', description: 'Unencrypted backups in S3 with weak ACL.',                 control: 'KMS-encrypted snapshots, bucket policy', mitigation: 'Open' },
  ];
  threats.forEach((t) => insThreat.run({ id: idFor('thr'), ...t }));
});

tx();

console.log('[seed] Example project created →', projectId);
