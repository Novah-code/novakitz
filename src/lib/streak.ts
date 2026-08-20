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
  /**
   * Missed days inside the current streak that were forgiven — one per calendar
   * month. Surfaced rather than hidden: a streak that survives a gap silently
   * reads as a bug, and the allowance only changes behaviour if people know
   * they have it.
   */
  forgiven: number;
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
  forgiven: 0,
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

  // Today being unfinished is not a miss — it is still in progress, and showing
  // the count while it is open is the whole point. So the walk starts at
  // yesterday and today only adds to the total once it is actually done.
  //
  // One missed day per calendar month is forgiven. Without that, a single
  // missed morning takes a sixty-day streak to zero, and that is the moment
  // people stop altogether rather than start again — which is the opposite of
  // what a gentle morning app should do to someone who overslept once.
  let current = doneToday ? 1 : 0;
  const forgivenMonths = new Set<string>();

  // Terminates regardless of data: `current` can never exceed dates.size, and
  // forgiven days are at most one per month, so this bound is never binding on
  // a real streak.
  const limit = dates.size * 2 + 10;
  for (let i = 1; i <= limit; i++) {
    const day = daysAgo(i);
    if (dates.has(day)) {
      current++;
      continue;
    }
    const month = day.slice(0, 7);
    if (!forgivenMonths.has(month)) {
      forgivenMonths.add(month);
      continue;
    }
    break;
  }

  // A streak of nothing is not a streak; without this a brand new user whose
  // first missed day is forgiven would show a streak of zero that still claims
  // to have spent its grace.
  if (current === 0) forgivenMonths.clear();

  const week: StreakDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    return { date, completed: dates.has(date) };
  });

  return { current, total: dates.size, doneToday, forgiven: forgivenMonths.size, week };
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
