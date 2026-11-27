'use client';

import React, { useState } from 'react';
import SceneArt from './SceneArt';
import { useTimeOfDay } from '../lib/useTimeOfDay';
import '../styles/home-scene.css';

// Drop the painted artwork at these paths to replace the vector fallback.
// See public/scenes/README.md for the expected dimensions.
const SCENE_SOURCES = {
  day: '/scenes/scene-day.png',
  night: '/scenes/scene-night.png',
} as const;

/*
 * The flower, on its own transparent layer above the landscape.
 *
 * Kept separate from the scene so it can open and turn without the hills
 * turning with it. Optional: if the file is not there the scene renders
 * exactly as before, so the landscape never depends on it.
 *
 * Expected as a square PNG with transparency, the flower centred and sized to
 * the same square as the scene behind it.
 */
const BLOOM_SOURCES = {
  day: '/scenes/bloom-day.png',
  night: '/scenes/bloom-night.png',
} as const;

/*
 * The tulip is the home screen now (2026-11-03). It is a transparent PNG cut
 * to the flower, not a square painting: no circle is cut around it, because a
 * circle slices the petal tips. It sits on the same bloom of light the
 * landscape did. If the file is missing the landscape disc below still draws,
 * so a bad deploy cannot leave the home screen empty.
 */
const TULIP_SOURCE = '/scenes/tulip-day.png';

/*
 * Petals drifting down behind the flower. Pastel only, soft, few. Each one is a
 * CSS animation on transform and opacity, nothing is measured or redrawn in
 * script. Negative delays so the screen is already mid-fall when it opens.
 */
const PETALS = [
  { x: '8%',  s: 16, d: 19, delay: -4,  drift: 46,  spin: 220, c: '#F4B7CB', o: 0.7 },
  { x: '22%', s: 11, d: 24, delay: -15, drift: -38, spin: -180, c: '#E6D7F5', o: 0.75 },
  { x: '35%', s: 20, d: 21, delay: -9,  drift: 60,  spin: 260, c: '#EDA3BC', o: 0.55 },
  { x: '52%', s: 13, d: 26, delay: -20, drift: -52, spin: -240, c: '#F6E2B3', o: 0.8 },
  { x: '66%', s: 18, d: 20, delay: -2,  drift: 40,  spin: 200, c: '#F6C9D6', o: 0.65 },
  { x: '78%', s: 12, d: 23, delay: -12, drift: -44, spin: -210, c: '#E6D7F5', o: 0.7 },
  { x: '90%', s: 17, d: 25, delay: -7,  drift: -58, spin: 240, c: '#F4B7CB', o: 0.6 },
  { x: '44%', s: 10, d: 28, delay: -22, drift: 36,  spin: -160, c: '#F6E2B3', o: 0.7 },
] as const;

interface HomeSceneProps {
  /**
   * The disc keeps the orb's press semantics: a short tap opens the emotion
   * check-in, a long press opens dream recording. The caller owns the timer, so
   * these map straight onto the existing orb handlers.
   */
  onPressStart: () => void;
  onPressEnd: () => void;
  onPressCancel: () => void;
  label: string;
}

export default function HomeScene({
  onPressStart,
  onPressEnd,
  onPressCancel,
  label,
}: HomeSceneProps) {
  const { scene, canToggle, toggle } = useTimeOfDay();
  const [artMissing, setArtMissing] = useState(false);
  const [bloomMissing, setBloomMissing] = useState(false);
  const [tulipMissing, setTulipMissing] = useState(false);

  return (
    <div className={`home-scene home-scene--${scene}`}>

      <div className="home-scene__glow" aria-hidden="true" />

      <div className="home-scene__petals" aria-hidden="true">
        {PETALS.map((p, i) => (
          <i
            key={i}
            className="home-scene__petal"
            style={{
              '--x': p.x, '--s': `${p.s}px`, '--d': `${p.d}s`, '--delay': `${p.delay}s`,
              '--drift': `${p.drift}px`, '--spin': `${p.spin}deg`, '--c': p.c, '--o': p.o,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <button
        type="button"
        className="home-scene__portal"
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onMouseLeave={onPressCancel}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        aria-label={label}
      >
        {!tulipMissing ? (
          <span className="home-scene__flower">
            {/* Opens (wrapper), sways from the stem (this), breathes and catches light (the image and its sheen). */}
            <span className="home-scene__sway">
              <img
                className="home-scene__flower-art"
                src={TULIP_SOURCE}
                alt=""
                onError={() => setTulipMissing(true)}
              />
              <span className="home-scene__sheen" aria-hidden="true" />
            </span>
          </span>
        ) : (
        <span className="home-scene__disc">
          {artMissing ? (
            <SceneArt className="home-scene__art" />
          ) : (
            <img
              className="home-scene__art"
              src={SCENE_SOURCES[scene]}
              alt=""
              onError={() => setArtMissing(true)}
            />
          )}

          {/*
            * Two elements, two transforms: the wrapper opens, the image turns.
            * Putting both animations on one element would have the second
            * overwrite the first's transform at the handoff.
            */}
          {!artMissing && !bloomMissing && (
            <span className="home-scene__bloom" aria-hidden="true">
              <img
                className="home-scene__bloom-art"
                src={BLOOM_SOURCES[scene]}
                alt=""
                onError={() => setBloomMissing(true)}
              />
            </span>
          )}
        </span>
        )}
      </button>

      {canToggle && (
        <button
          type="button"
          className="home-scene__toggle"
          onClick={toggle}
          aria-label={scene === 'day' ? 'Switch to night' : 'Switch to day'}
        >
          {scene === 'day' ? '☾' : '☀'}
        </button>
      )}

      <div className="home-scene__grain" aria-hidden="true" />
    </div>
  );
}
