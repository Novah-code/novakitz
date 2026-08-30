'use client';

import { useState } from 'react';
import { G } from '../lib/uiTokens';

/*
 * One question that opens. Shared by the pricing page and the support page so
 * the two read as the same document — someone who arrives at support from the
 * App Store and then goes looking at prices should not feel handed off.
 *
 * `maxHeight` animates rather than `height: auto`, which cannot transition. It
 * is generous enough for the longest answer here; a taller one would clip, so
 * keep answers to a paragraph or two.
 */
export default function FAQItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: 12,
      background: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${open ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: open ? '0 10px 20px rgba(0,0,0,0.02)' : 'none',
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '20px 24px', background: 'none', border: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: G.textDark, paddingRight: '1rem' }}>{q}</span>
        <span aria-hidden="true" style={{
          fontFamily: 'monospace', fontSize: 20, color: G.green, flexShrink: 0,
          transition: 'transform 0.3s', display: 'inline-block',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 480 : 0, overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        padding: open ? '0 24px 20px' : '0 24px 0',
      }}>
        <div style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: G.textBase, whiteSpace: 'pre-line' }}>{a}</div>
      </div>
    </div>
  );
}
