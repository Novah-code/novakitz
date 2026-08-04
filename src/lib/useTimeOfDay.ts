'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TimeOfDay,
  msUntilNextChange,
  readOverride,
  timeOfDayFor,
  writeOverride,
} from './timeOfDay';

/**
 * Flip to true once public/scenes/scene-night.* exists and the night palette is
 * settled. Until then the night scene is never shown and the manual toggle
 * stays hidden, so an unfinished scene can't reach users.
 */
export const NIGHT_SCENE_READY = false;

export interface TimeOfDayState {
  /** What to actually render. Always 'day' while NIGHT_SCENE_READY is false. */
  scene: TimeOfDay;
  /** True when following the clock rather than a manual choice. */
  isAuto: boolean;
  /** Whether the manual toggle should be offered at all. */
  canToggle: boolean;
  toggle: () => void;
  resetToAuto: () => void;
}

export function useTimeOfDay(): TimeOfDayState {
  // Start from the clock on both server and client so the markup matches, then
  // apply any stored override after mount.
  const [fromClock, setFromClock] = useState<TimeOfDay>(() => timeOfDayFor());
  const [override, setOverrideState] = useState<TimeOfDay | null>(null);

  useEffect(() => {
    setOverrideState(readOverride());
    setFromClock(timeOfDayFor());
  }, []);

  // Re-check when the boundary passes and whenever the app is brought forward,
  // which is how a backgrounded Capacitor app returns after dark.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      setFromClock(timeOfDayFor());
      timer = setTimeout(schedule, msUntilNextChange() + 1000);
    };
    schedule();

    const onVisible = () => {
      if (!document.hidden) setFromClock(timeOfDayFor());
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const resolved = override ?? fromClock;
  const scene: TimeOfDay = NIGHT_SCENE_READY ? resolved : 'day';

  const toggle = useCallback(() => {
    setOverrideState((current) => {
      const next: TimeOfDay = (current ?? timeOfDayFor()) === 'day' ? 'night' : 'day';
      // Choosing what the clock would have picked anyway means "follow the clock".
      const value = next === timeOfDayFor() ? null : next;
      writeOverride(value);
      return value;
    });
  }, []);

  const resetToAuto = useCallback(() => {
    writeOverride(null);
    setOverrideState(null);
  }, []);

  return {
    scene,
    isAuto: override === null,
    canToggle: NIGHT_SCENE_READY,
    toggle,
    resetToAuto,
  };
}
