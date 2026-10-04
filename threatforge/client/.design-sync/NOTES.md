# design-sync notes: ThreatForge client

## How this repo syncs
- ThreatForge is an app, not a published DS: no dist, no .d.ts, JSX source. The DS entry is `src/ds/index.js` (re-exports the reusable components + React Flow primitives + constants, and imports `src/styles.css`). Always pass `--entry ./src/ds/index.js`.
- Run from `client/`. Deps are hoisted to the workspace root: `--node-modules ../node_modules`.
- Full command: `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ../node_modules --entry ./src/ds/index.js --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`
- Components are pinned via `componentSrcMap` (no .d.ts to discover from). Adding a component = export it from `src/ds/index.js` + add a `componentSrcMap` entry + `dtsPropsFor` entry + a preview in `previews/`.
- Props are hand-written in `dtsPropsFor` because the source is untyped JSX (`[DTS_REACT]` warning about @types/react is expected and harmless here).
- `ThreatCard` and `StrideGrid` were extracted from `src/components/Inspector.jsx` for this sync; the Inspector now renders them.
- Node components need a React Flow canvas: previews render a real `<ReactFlow nodeTypes={nodeTypes}>` in a fixed-size div. Import React Flow from `@threatforge/client` in previews (not `@xyflow/react`) so there's a single store instance.
- Fonts: the app loads JetBrains Mono + Major Mono Display from Google Fonts via `<link>` in index.html. Latin + latin-ext woff2 files (OFL) were downloaded into `.design-sync/fonts/` and wired with `extraFonts`.
- Playwright + chromium are installed in `.ds-sync/node_modules` (gitignored), so re-copying the scripts keeps them only if `.ds-sync/node_modules` is left in place.

## Known render warns
- `[GRID_OVERFLOW]` on StatusBar and TrustBoundaryNode: resolved with `cardMode: "column"` overrides.
- Node headers: a long classification (`CONFIDENTIAL`) runs into the type label ("PROCESSCONFIDENTIAL"), and the threat-count pip overlaps the classification text. This is the app's real CSS (`.tm-node__head`, `.threat-pip` in `src/styles.css`), faithfully reproduced; graded good. Fix in the app CSS, not in previews.

## Re-sync risks
- `dtsPropsFor` is hand-maintained: if component props change in the JSX, these contracts go stale silently. Update them with any component API change.
- `.design-sync/fonts/` is a snapshot of Google Fonts files; if the app changes fonts/weights in index.html, re-fetch.
- `.prompt.md` summaries are generic ("X from @threatforge/client") because JSDoc isn't picked up in this mode; the conventions header carries the usage guidance. Per-component `.md` docs via `docsDir` would improve them.
- `src/styles.css` mixes app-shell rules (`html, body { overflow: hidden }`, `.app`, `.topbar`) with component styles; all of it ships. Documented in conventions.md.
