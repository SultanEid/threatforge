// Design-system entry for Claude Design (claude.ai/design) syncs.
// Re-exports ThreatForge's reusable UI pieces plus the React Flow primitives
// they are composed with, and pulls in the app stylesheet (tokens + classes).
import '../styles.css';

export { default as ExternalEntityNode } from '../components/nodes/ExternalEntityNode.jsx';
export { default as ProcessNode } from '../components/nodes/ProcessNode.jsx';
export { default as DataStoreNode } from '../components/nodes/DataStoreNode.jsx';
export { default as TrustBoundaryNode } from '../components/nodes/TrustBoundaryNode.jsx';
export { nodeTypes } from '../components/nodes/index.js';
export { default as ThreatCard } from '../components/ThreatCard.jsx';
export { default as StrideGrid } from '../components/StrideGrid.jsx';
export {
  STRIDE, STRIDE_BY_KEY, CLASSIFICATIONS, SEVERITIES, MITIGATIONS, AUTH_METHODS, ZONES, classifyColor,
} from '../lib/constants.js';
export {
  ReactFlow, ReactFlowProvider, Background, BackgroundVariant, Controls, MiniMap, MarkerType, Handle, Position,
} from '@xyflow/react';
