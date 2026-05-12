// Tiny debounce that returns a function with a .flush() method.
export function debounce(fn, ms = 300) {
  let timer = null;
  let lastArgs = null;
  const wrapped = (...args) => {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn(...lastArgs); }, ms);
  };
  wrapped.flush = () => {
    if (timer) { clearTimeout(timer); timer = null; fn(...lastArgs); }
  };
  wrapped.cancel = () => { clearTimeout(timer); timer = null; };
  return wrapped;
}

// Convert a server node row → a React Flow node object.
export function rowToFlowNode(row) {
  const {
    id, type, position_x, position_y,
    label, classification, technology, description,
    zone, width, height, z_index,
    threats = [],
  } = row;

  return {
    id,
    type,
    position: { x: position_x ?? 0, y: position_y ?? 0 },
    data: {
      label, classification, technology, description,
      zone, width, height,
      threats,
    },
    ...(type === 'boundary' ? { style: { zIndex: z_index ?? -1 } } : {}),
  };
}

// Convert a server edge row → a React Flow edge object.
export function rowToFlowEdge(row) {
  return {
    id: row.id,
    source: row.source_id,
    target: row.target_id,
    sourceHandle: row.source_handle || undefined,
    targetHandle: row.target_handle || undefined,
    label: row.label || undefined,
    type: 'smoothstep',
    markerEnd: { type: 'arrowclosed', color: '#7c8590' },
    data: { payload: row.payload || '', auth: row.auth || 'None' },
  };
}
