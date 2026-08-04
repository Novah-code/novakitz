export type TimeOfDay = 'day' | 'night';

const OVERRIDE_KEY = 'novakitz.sceneOverride';

// Visual dusk/dawn. Deliberately not the same boundary as the morning/evening
// ritual split (noon) — a noon switch to the night scene reads as broken.
const DAY_STARTS_AT = 6;
const NIGHT_STARTS_AT = 19;

export function timeOfDayFor(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  return hour >= DAY_STARTS_AT && hour < NIGHT_STARTS_AT ? 'day' : 'night';
}

export function readOverride(): TimeOfDay | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(OVERRIDE_KEY);
    return stored === 'day' || stored === 'night' ? stored : null;
  } catch {
    // Private browsing and locked-down WebViews can throw on access.
    return null;
  }
}

export function writeOverride(value: TimeOfDay | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(OVERRIDE_KEY);
    } else {
      window.localStorage.setItem(OVERRIDE_KEY, value);
    }
  } catch {
    // Preference is cosmetic; losing it is not worth surfacing an error.
  }
}

/** Milliseconds until the scene would next change on its own. */
export function msUntilNextChange(date: Date = new Date()): number {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  const hour = date.getHours();
  next.setHours(hour < DAY_STARTS_AT ? DAY_STARTS_AT : hour < NIGHT_STARTS_AT ? NIGHT_STARTS_AT : 24);
  return next.getTime() - date.getTime();
}
