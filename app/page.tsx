'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic import for heavy component - bundle-dynamic-imports rule
const SimpleDreamInterfaceWithAuth = dynamic(
  () => import('../src/components/SimpleDreamInterfaceWithAuth'),
  {
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
            color: '#4a6741',
            fontSize: '1.1rem'
          }}>Loading...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default function Home() {
  return <SimpleDreamInterfaceWithAuth />;
}