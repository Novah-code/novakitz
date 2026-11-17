import type { CSSProperties } from 'react';
import { PEBBLE_GLOW } from '../lib/emotions';

/*
 * A mood as a small glowing aura instead of a hard-edged pebble.
 *
 * Chosen by 윤아님 from mock-ups on 2026-11-05 (the "silhouette" one): each
 * emotion keeps a shape of its own — tall for hope, wide and low for joy and
 * flatness, a tilt for anxiety — but the edge is light rather than a line. A
 * bright core and a few specks of light sit inside, taken from the reference
 * she sent. Colours are the same `PEBBLE_GLOW` pair the rest of the app already
 * reads, so a mood is recognisably the same colour everywhere.
 *
 * `size` is the cell in px (default 80, the picker's). The glow reaches about 29%
 * of the size past the cell, so the parent needs room around it.
 */

/** Width, height (px) and tilt (deg) of the lit body, per emotion. */
const SILHOUETTE: Record<string, { w: number; h: number; rot: number }> = {
  anxious: { w: 84, h: 76, rot: -18 },
  fear: { w: 74, h: 92, rot: 0 },
  peaceful: { w: 84, h: 84, rot: 0 },
  joyful: { w: 98, h: 76, rot: 0 },
  lonely: { w: 88, h: 70, rot: 0 },
  hopeful: { w: 70, h: 98, rot: 0 },
  anger: { w: 80, h: 80, rot: 8 },
  low: { w: 100, h: 64, rot: 0 },
};

/** Specks of light: left %, top %, size px. Few, and the same every time. */
const SPECKS: Array<[number, number, number]> = [
  [28, 22, 3],
  [68, 30, 2.5],
  [52, 72, 3],
  [18, 58, 2],
];

const layer: CSSProperties = { position: 'absolute', left: '50%', top: '50%' };

export default function AuraOrb({ emotionKey, index = 0, size = 80 }: { emotionKey: string; index?: number; size?: number }) {
  const glow = PEBBLE_GLOW[emotionKey] ?? PEBBLE_GLOW.low;
  const { w, h, rot } = SILHOUETTE[emotionKey] ?? SILHOUETTE.peaceful;
  const turn = `translate(-50%, -50%) rotate(${rot}deg)`;

  const scale = size / 80;

  return (
    <div aria-hidden="true" style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Drawn once at 80px and scaled, so every size is the same picture. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 80, height: 80, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
      {/* The halo: the same shape, larger and fainter. */}
      <div
        style={{
          ...layer,
          width: w + 46,
          height: h + 46,
          transform: turn,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${glow.light}99 0%, ${glow.light}00 100%)`,
          filter: 'blur(5px)',
        }}
      />
      {/* The lit body, brightest at the core. */}
      <div
        style={{
          ...layer,
          width: w,
          height: h,
          transform: turn,
          borderRadius: '50%',
          background: `radial-gradient(closest-side at 50% 44%, #fff 0%, ${glow.body} 42%, ${glow.light}00 100%)`,
          filter: 'blur(3px)',
        }}
      />
      {SPECKS.map(([x, y, s], i) => (
        <i
          key={i}
          style={{
            position: 'absolute',
            // A small per-orb shift so eight orbs do not carry identical constellations.
            left: `${x + ((index * 5) % 9) * (i === 0 ? 1 : 0)}%`,
            top: `${y + (i === 1 ? (index % 4) * 3 : 0)}%`,
            width: s,
            height: s,
            borderRadius: '50%',
            background: '#fff',
            opacity: 0.85,
            filter: 'blur(0.4px)',
          }}
        />
      ))}
      </div>
    </div>
  );
}
