# ThreatForge conventions

ThreatForge uses the SERG Threat Modeler visual language: dark, terminal-inspired, academic-precise. IBM Plex Sans for UI text, JetBrains Mono for labels, IDs and numbers, mint `--accent` for primary actions. Everything is exported on `window.ThreatForge`.

## Setup

- `ThreatCard` and `StrideGrid` need no provider.
- The four DFD node components (`ExternalEntityNode`, `ProcessNode`, `DataStoreNode`, `TrustBoundaryNode`) are **React Flow custom nodes**. Never render them standalone. Render a `ReactFlow` (re-exported from this bundle, inside `ReactFlowProvider`) with `nodeTypes={nodeTypes}`; node `type` is `'external' | 'process' | 'datastore' | 'boundary'`. The `ReactFlow` parent must have an explicit width and height.
- Boundary nodes are sized by the React Flow node's own `width`/`height` and take `zIndex: -1`; place element nodes inside their area by position.
- Edges: `type: 'smoothstep'`, `markerEnd: { type: MarkerType.ArrowClosed, color: '#7CE3D8' }`, `label` = protocol (e.g. `HTTPS`, `gRPC`, `SQL/TLS`). Put canvases on the `grid-bg` class.

## Styling idiom: CSS variables + plain classes

Use `var(--*)` tokens for layout glue; never hardcode hex values except the edge marker color above.

| Family | Tokens |
|---|---|
| Surfaces (dark → light) | `--bg-inset`, `--bg-0`, `--bg-1` (app), `--bg-2` (cards), `--bg-3`, `--bg-4` |
| Lines | `--line-1` (hairline), `--line-2` (default), `--line-3` (strong) |
| Text | `--fg-1` (primary) … `--fg-5` (disabled), `--fg-on-accent` |
| Brand | `--accent`, `--accent-strong`, `--accent-soft`, `--accent-line` |
| Signal | `--critical`, `--high`, `--medium`, `--low`, `--info`, `--success`, each with a `-bg` variant |
| STRIDE | `--stride-s`, `--stride-t`, `--stride-r`, `--stride-i`, `--stride-d`, `--stride-e`, each with a `-bg` variant |
| Fonts | `--font-sans` (IBM Plex Sans), `--font-mono` (JetBrains Mono) |

Classes:
- Buttons: `btn` plus `btn--primary` (mint fill), `btn--secondary`, `btn--ghost`, `btn--danger`; modifiers `btn--sm`, `btn--block`. Compact icon button: `icon-btn`.
- Form controls: `input`, `select`, `textarea` (`input--sm`, `select--sm`); wrap with `field` and a `label` span for the mono caps label.
- Surfaces: `card` (`card--flush` for tables), `card-head`, `page-header` (an `h1` + `p` subtitle, actions in `page-header__actions`), `page-body`, `kpi-grid`, `split` (2:1 columns).
- Tables: `tbl__head` / `tbl__row` (set `gridTemplateColumns` inline), `tbl__row--click`, `cell-title`, `cell-sub`, `cell-mono`, `cell-dim`.
- Threat atoms: `sev-badge sev-badge--critical|high|medium|low`, `stride-pill` (+ `stride-pill__letter`), `stride-chip`, `status-dot` (set `--dot`), `chip` / `chip is-active` for filters, `notice` / `notice--err`.

Domain vocab (use exact values): STRIDE letters `S T R I D E`; severities `Critical High Medium Low`; status `Open Mitigated Accepted`; classifications `Public Internal Confidential Secret`; zones `UNTRUSTED SEMI-TRUSTED TRUSTED RESTRICTED`. These are exported as `STRIDE`, `SEVERITIES`, `MITIGATIONS`, `CLASSIFICATIONS`, `ZONES`, `AUTH_METHODS`.

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
<div className="card" style={{ width: 340, display: 'grid', gap: 10 }}>
  <span className="label">Orders DB · STRIDE threats</span>
  <StrideGrid threats={threats} />
  {threats.map((t) => <ThreatCard key={t.id} threat={t} onStatusChange={() => {}} />)}
  <button className="btn btn--primary btn--block">Add threat</button>
</div>
```
