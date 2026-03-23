'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic import for heavy component - bundle-dynamic-imports rule
const SimpleDreamInterfaceWithAuth = dynamic(
  () => import('../src/components/SimpleDreamInterfaceWithAuth'),
  {
    loading: () => (
      <div style={{ minHeight: '100dvh', background: '#e8f5e8' }} />
    ),
    ssr: false
  }
);

export default function Home() {
  return <SimpleDreamInterfaceWithAuth />;
}