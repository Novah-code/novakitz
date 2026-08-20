'use client';

import { supabase } from './supabase';

/**
 * Daily ritual streak.
 *
 * A day counts when the person did any part of the morning ritual — the mood
 * check-in or a dream. Counting dreams alone, as this used to, made the streak
 * impossible to keep: you do not remember a dream every night, so the one
 * activity the streak depended on was the one that could not be daily. The
 * check-in is the smallest unit of the ritual, so it is the bar.
 */

export interface StreakDay {
  /** Local date, YYYY-MM-DD. */
  date: string;
  completed: boolean;
}

export interface Streak {
  /** Consecutive days up to today, or up to yesterday when today is still open. */
  current: number;
  /**
   * Every day ever completed. Never resets, so a broken streak does not erase
   * the record of showing up — the streak carries the pressure, this carries
   * the credit.
   */
  total: number;
  /** Whether the ritual has already been done today. */
  doneToday: boolean;
  /** The last seven days, oldest first. */
  week: StreakDay[];
}

/** Local calendar date as YYYY-MM-DD. Not UTC — a streak is about the user's day. */
function localDate(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

export const emptyStreak = (): Streak => ({
  current: 0,
  total: 0,
  doneToday: false,
  week: Array.from({ length: 7 }, (_, i) => ({ date: daysAgo(6 - i), completed: false })),
});

/** Every local date on which the user did any part of the ritual. */
async function activeDates(userId: string): Promise<Set<string>> {
  const [dreams, checkins] = await Promise.all([
    supabase.from('dreams').select('created_at').eq('user_id', userId),
    supabase.from('checkins').select('check_date').eq('user_id', userId),
  ]);

  if (dreams.error) throw dreams.error;
  if (checkins.error) throw checkins.error;

  const dates = new Set<string>();
  // created_at is a timestamp, so it has to be converted to the user's local day.
  for (const d of dreams.data ?? []) dates.add(localDate(new Date(d.created_at)));
  // check_date is already a DATE column — it is a local day, not an instant.
  for (const c of checkins.data ?? []) if (c.check_date) dates.add(String(c.check_date));
  return dates;
}

export async function loadStreak(userId: string): Promise<Streak> {
  let dates: Set<string>;
  try {
    dates = await activeDates(userId);
  } catch {
    // A streak is decoration; it must never take the screen down with it.
    return emptyStreak();
  }

  const today = daysAgo(0);
  const doneToday = dates.has(today);

  // An unfinished today does not break a streak — it is still in progress, and
  // showing yesterday's count is the whole point of the mechanic. Anchor on
  // today when it is done, otherwise on yesterday.
  let current = 0;
  const anchor = doneToday ? 0 : dates.has(daysAgo(1)) ? 1 : -1;
  if (anchor >= 0) {
    current = 1;
    // No fixed ceiling — a streak should be able to run as long as the person
    // does. The bound is dates.size because a streak cannot be longer than the
    // number of days ever completed, which also guarantees this terminates.
    for (let i = anchor + 1; i <= dates.size; i++) {
      if (!dates.has(daysAgo(i))) break;
      current++;
    }
  }

  const week: StreakDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    return { date, completed: dates.has(date) };
  });

  return { current, total: dates.size, doneToday, week };
}

/**
 * The next round number worth reaching.
 *
 * A ring that fills toward a fixed seven days is finished after a week and has
 * nothing left to say. Milestones give it something to aim at no matter how
 * long the streak runs, and the gap between them widens so the ring never
 * crawls.
 */
export function nextMilestone(streak: number): number {
  const marks = [7, 14, 30, 60, 100, 180, 365];
  for (const m of marks) if (streak < m) return m;
  // Past a year, aim at each further year.
  return Math.ceil((streak + 1) / 365) * 365;
}
