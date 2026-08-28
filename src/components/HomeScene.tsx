'use client';

import { useState } from 'react';
import SceneArt from './SceneArt';
import { useTimeOfDay } from '../lib/useTimeOfDay';
import '../styles/home-scene.css';

// Drop the painted artwork at these paths to replace the vector fallback.
// See public/scenes/README.md for the expected dimensions.
const SCENE_SOURCES = {
  day: '/scenes/scene-day.png',
  night: '/scenes/scene-night.png',
} as const;

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

  return (
    <div className={`home-scene home-scene--${scene}`}>

      <div className="home-scene__glow" aria-hidden="true" />

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
        </span>
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
