'use client';

import { useEffect, useState } from 'react';
import { loadStreak, type Streak } from '../lib/streak';
import '../styles/streak-badge.css';

interface StreakBadgeProps {
  userId: string;
  language: 'en' | 'ko';
  onClick: () => void;
  /** Bump to recount after the user completes something. */
  refreshKey?: number;
}

/**
 * The streak, kept on screen.
 *
 * The popup this sits beside only appeared after a dream was saved, which made
 * the streak a reward rather than a reason. The number has to be visible while
 * today is still unfinished for it to pull anyone back — that is the whole
 * mechanic. So when today is not yet done the badge is deliberately unlit, and
 * it only fills in once the ritual is complete.
 */
export default function StreakBadge({ userId, language, onClick, refreshKey = 0 }: StreakBadgeProps) {
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadStreak(userId).then((s) => {
      if (!cancelled) setStreak(s);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  // Nothing to protect yet, and a zero would only advertise the emptiness.
  if (!streak || streak.current === 0) return null;

  const label =
    language === 'ko'
      ? `연속 ${streak.current}일${streak.doneToday ? '' : ' — 오늘 아직'}`
      : `${streak.current} day streak${streak.doneToday ? '' : ', today still open'}`;

  return (
    <button
      type="button"
      className={`streak-badge ${streak.doneToday ? 'is-done' : 'is-open'}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="streak-badge__flame" aria-hidden="true">
        {streak.doneToday ? '🔥' : '○'}
      </span>
      <span className="streak-badge__count">{streak.current}</span>
    </button>
  );
}
