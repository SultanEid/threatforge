# ThreatForge conventions

ThreatForge is a dark, monospace "SOC console" UI for STRIDE threat modeling. Everything is exported on `window.ThreatForge`.

## Setup

- No provider is needed for `ThreatCard`, `StrideGrid`, `StatusBar`.
- The four DFD node components (`ExternalEntityNode`, `ProcessNode`, `DataStoreNode`, `TrustBoundaryNode`) are **React Flow custom nodes**. Never render them standalone. Render a `ReactFlow` (re-exported from this bundle, inside `ReactFlowProvider`) and pass `nodeTypes={nodeTypes}`; node `type` is `'external' | 'process' | 'datastore' | 'boundary'`. The `ReactFlow` parent element must have an explicit width and height.
- Boundary nodes take `zIndex: -1` and `data.width`/`data.height`; place element nodes inside their area by position.
- Edges: `type: 'smoothstep'`, `markerEnd: { type: MarkerType.ArrowClosed, color: '#7c8590' }`, `label` = protocol (e.g. `HTTPS`, `gRPC`, `SQL/TLS`).
- The stylesheet sets `html, body` to `height: 100%`, `overflow: hidden`, `font-size: 12px` and dark background `var(--bg-deep)`. Build full-viewport layouts; put scrollable regions in their own `overflow: auto` container.

## Styling idiom: CSS variables + plain classes

Use `var(--*)` tokens in inline styles for layout glue; never hardcode hex values except the edge stroke above.

| Family | Tokens |
|---|---|
| Surfaces (dark → light) | `--bg-deep`, `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-overlay` |
| Borders | `--border`, `--border-strong`, `--border-glow` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-mute` |
| Accent | `--accent` (amber, primary action), `--accent-soft` (hover fill), `--warm` |
| Hues | `--cool`, `--green`, `--red`, `--purple`, `--pink` |
| Severity | `--sev-critical`, `--sev-high`, `--sev-medium`, `--sev-low` |
| Fonts | `--mono` (JetBrains Mono, all UI text), `--display` (Major Mono Display, brand wordmark only) |

Native controls are pre-styled. Write plain `<button>`, `<input>`, `<select>`, `<textarea>`. Button variants are classes: `primary` (filled amber), `ghost` (borderless), `icon-btn` (compact × style). Buttons are uppercase with letter-spacing by default.

Panel classes for inspector-style side panels: `panel-section`, `panel-header`, `field-group`, `field`, `field-label`, `field-row`, `inspector-head`, `inspector-tag`, `inspector-title`. Severity pills: `sev-counter critical|high|medium|low`. Legend rows: `legend`, `legend-row`, `legend-dot`.

Domain vocab (use exact values): STRIDE letters `S T R I D E`; severities `Critical High Medium Low`; mitigation `Open Mitigated Accepted`; classifications `Public Internal Confidential Secret`; zones `UNTRUSTED SEMI-TRUSTED TRUSTED RESTRICTED`. These are also exported as `STRIDE`, `SEVERITIES`, `MITIGATIONS`, `CLASSIFICATIONS`, `AUTH_METHODS`.

## Where the truth lives

Read `styles.css` and its imported `_ds_bundle.css` before styling anything; each component's `.prompt.md` and `.d.ts` define its props.

## Example

```jsx
const { ThreatCard, StrideGrid } = window.ThreatForge;
const threats = [
  { id: 't1', stride: 'I', severity: 'Critical', mitigation: 'Open',
    description: 'Unencrypted backups in S3 with weak ACL.', control: 'KMS-encrypted snapshots' },
  { id: 't2', stride: 'D', severity: 'High', mitigation: 'Mitigated',
    description: 'Volumetric DDoS on the gateway.', control: 'WAF + rate limiting' },
];
<div className="panel-section" style={{ width: 320, background: 'var(--bg-surface)' }}>
  <div className="panel-header">Orders DB · Threats</div>
  <StrideGrid threats={threats} />
  {threats.map((t) => <ThreatCard key={t.id} threat={t} onToggleMitigation={() => {}} />)}
  <button className="primary" style={{ width: '100%', marginTop: 8 }}>Add Threat</button>
</div>
```
