import React from 'react';
import { StatusBar } from '@threatforge/client';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 720, height: 32, display: 'grid' }}>{children}</div>
);

export const ActiveModel = () => (
  <Frame>
    <StatusBar stats={{ elements: 4, boundaries: 3, flows: 3, threats: 6, open: 5, critical: 1, high: 2, medium: 2, low: 0 }} />
  </Frame>
);

export const AllClear = () => (
  <Frame>
    <StatusBar stats={{ elements: 4, boundaries: 3, flows: 3, threats: 6, open: 0, critical: 0, high: 0, medium: 0, low: 0 }} />
  </Frame>
);

export const EmptyProject = () => (
  <Frame>
    <StatusBar stats={{ elements: 0, boundaries: 0, flows: 0, threats: 0, open: 0, critical: 0, high: 0, medium: 0, low: 0 }} />
  </Frame>
);
