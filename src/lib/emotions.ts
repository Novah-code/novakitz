/**
 * The pebbles.
 *
 * Single source of truth for the morning check-in emotions — their colour,
 * their shape, and the mood value stored alongside them. The picker and the
 * month calendar both read from here rather than keeping their own copies, so
 * a pebble and the day it fills in can never drift apart.
 *
 * `key` is what goes in the database. `moodValue` deliberately does not
 * identify an emotion — several share one — which is why the key is stored too.
 */

export interface Emotion {
  key: string;
  en: string;
  ko: string;
  /** Fill, as used by both the pebble and its day in the calendar. */
  color: string;
  /** The pebble's silhouette. Days in the calendar wear the same one. */
  borderRadius: string;
  /** Coarse 1–5 scale kept for trend charts. Not unique per emotion. */
  moodValue: number;
}

export const EMOTIONS: Emotion[] = [
  { key: 'anxious',  en: 'Anxious',  ko: '불안',   color: 'rgba(217,210,233,0.7)', borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%', moodValue: 2 },
  { key: 'fear',     en: 'Fear',     ko: '두려움', color: 'rgba(205,224,230,0.7)', borderRadius: '50% 50% 60% 60% / 40% 40% 70% 70%', moodValue: 1 },
  { key: 'peaceful', en: 'Peaceful', ko: '평온',   color: 'rgba(181,218,185,0.7)', borderRadius: '50%',                               moodValue: 4 },
  { key: 'joyful',   en: 'Joyful',   ko: '기쁨',   color: 'rgba(253,232,181,0.7)', borderRadius: '45% 55% 45% 55% / 65% 55% 45% 35%', moodValue: 5 },
  { key: 'lonely',   en: 'Lonely',   ko: '외로움', color: 'rgba(214,221,229,0.7)', borderRadius: '50% 50% 40% 40% / 40% 40% 60% 60%', moodValue: 2 },
  { key: 'hopeful',  en: 'Hopeful',  ko: '희망',   color: 'rgba(214,241,208,0.7)', borderRadius: '50% 50% 50% 50% / 70% 70% 40% 40%', moodValue: 4 },
  { key: 'anger',    en: 'Anger',    ko: '분노',   color: 'rgba(250,209,196,0.7)', borderRadius: '15px 30px 15px 30px',               moodValue: 2 },
  { key: 'low',      en: 'Low',      ko: '무기력', color: 'rgba(226,232,240,0.7)', borderRadius: '16px',                              moodValue: 1 },
];

const BY_KEY = new Map(EMOTIONS.map((e) => [e.key, e]));

export function emotionByKey(key: string | null | undefined): Emotion | null {
  return key ? BY_KEY.get(key) ?? null : null;
}

export function emotionLabel(e: Emotion, language: 'en' | 'ko'): string {
  return language === 'ko' ? e.ko : e.en;
}

/**
 * Colour for a day recorded before the emotion key was stored.
 *
 * Those rows only carry a mood value, and several emotions share each one, so
 * the original pebble cannot be recovered. A neutral fill is honest about that
 * — guessing a colour would put a feeling in someone's calendar that they never
 * chose.
 */
export const LEGACY_FILL = 'rgba(226,232,240,0.55)';
