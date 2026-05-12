import ExternalEntityNode from './ExternalEntityNode.jsx';
import ProcessNode from './ProcessNode.jsx';
import DataStoreNode from './DataStoreNode.jsx';
import TrustBoundaryNode from './TrustBoundaryNode.jsx';

export const nodeTypes = {
  external:  ExternalEntityNode,
  process:   ProcessNode,
  datastore: DataStoreNode,
  boundary:  TrustBoundaryNode,
};
