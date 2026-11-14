'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStreak, nextMilestone } from '../lib/streak';

interface StreakPopupProps {
  user: User;
  language: 'en' | 'ko';
  onClose: () => void;
}

interface StreakData {
  currentStreak: number;
  totalDays: number;
  weekDays: {
    day: string;
    date: string;
    completed: boolean;
  }[];
}

const translations = {
  en: {
    title: 'Your streak',
    totalDays: (n: number) => `${n} morning${n === 1 ? '' : 's'} in total`,
    days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    share: 'Share',
    close: 'Close',
    shareMessage: (streak: number) => `${streak} morning${streak > 1 ? 's' : ''} in a row with Novakitz.`,
    linkCopied: 'Link copied!'
  },
  ko: {
    title: 'Your streak',
    totalDays: (n: number) => `누적 ${n}일`,
    days: ['일', '월', '화', '수', '목', '금', '토'],
    share: 'Share',
    close: 'Close',
    shareMessage: (streak: number) => `연속 ${streak}일 아침을 기록했어요.`,
    linkCopied: '링크가 복사되었어요!'
  }
};

export default function StreakPopup({ user, language, onClose }: StreakPopupProps) {
  const t = translations[language];
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  const loadStreakData = useCallback(async () => {
    // Counting lives in src/lib/streak.ts so the badge on the home screen and
    // this popup can never disagree about what a streak is.
    const streak = await loadStreak(user.id);
    setStreakData({
      currentStreak: streak.current,
      totalDays: streak.total,
      weekDays: streak.week.map((d) => ({
        day: t.days[new Date(d.date + 'T00:00:00').getDay()],
        date: d.date,
        completed: d.completed,
      })),
    });
    setLoading(false);
  }, [user.id, t.days]);

  useEffect(() => {
    loadStreakData();
  }, [user.id, loadStreakData]);

  const handleShare = () => {
    if (!streakData) return;

    const message = t.shareMessage(streakData.currentStreak);
    const url = window.location.origin;
    const shareText = `${message}\n\nNovakitz - Inner Journal\n${url}`;

    // Try native share API first
    if (navigator.share) {
      navigator.share({
        title: 'Novakitz Dream Streak',
        text: shareText
      }).catch(err => console.log('Share cancelled', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      });
    }
  };

  /*
   * The home screen's sky, full screen, like the screens that come before it in
   * the morning. It used to be a white card on a dark scrim with a bright green
   * button; it was the one place left that still looked like a different app.
   */
  const INK = '#2E3C33';
  const PINK = '#EDA3BC';
  const ko = language === 'ko';
  const displayFont = ko ? "'KoDisplay', 'Pretendard', serif" : 'var(--font-display), Georgia, serif';
  /*
   * A window, not a page: a dimmed backdrop and a framed card that carries the
   * same sky as the screens around it, so what is inside is the full-screen
   * design in a frame. Tapping outside closes it.
   */
  const shell = (children: React.ReactNode) => (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20500,
        background: 'rgba(60,50,70,0.32)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: ko ? "'Pretendard', sans-serif" : "'Roboto', sans-serif",
        color: INK,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', overflow: 'hidden',
          width: '100%', maxWidth: 400, maxHeight: '100%', overflowY: 'auto',
          boxSizing: 'border-box',
          borderRadius: 36,
          backgroundImage: 'var(--home-sky-day)',
          backgroundColor: '#F4EEE5',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 24px 60px rgba(40,30,60,0.28), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <div className="home-scene__grain" aria-hidden="true" />
        {children}
      </div>
    </div>
  );

  if (loading || !streakData) {
    return shell(
      <p style={{ position: 'relative', zIndex: 2, margin: 0, padding: '60px 20px', textAlign: 'center', fontSize: 15, opacity: 0.6 }}>
        {language === 'ko' ? '로딩 중...' : 'Loading...'}
      </p>
    );
  }

  const target = nextMilestone(streakData.currentStreak);
  const RING = 148;
  const R = 65;
  const CIRC = 2 * Math.PI * R;

  return shell(
    <div style={{
      position: 'relative', zIndex: 2,
      width: '100%', boxSizing: 'border-box',
      padding: '68px 20px 32px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Share and close: white round controls, top right, like the gear. */}
      <button
        onClick={handleShare}
        aria-label={t.share}
        style={{
          position: 'absolute', top: 14, right: 64,
          width: 40, height: 40, padding: 0, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 10px rgba(40,60,45,0.16)', color: INK, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
          <polyline points="16 6 12 2 8 6"></polyline>
          <line x1="12" y1="2" x2="12" y2="15"></line>
        </svg>
      </button>

      <button
        onClick={onClose}
        aria-label={t.close}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 40, height: 40, padding: 0, borderRadius: '50%',
          background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 10px rgba(40,60,45,0.16)', color: INK, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      {showCopied && (
        <div style={{
          position: 'absolute', top: 62, right: 14, zIndex: 3,
          background: 'rgba(255,255,255,0.94)', color: INK, padding: '8px 16px', borderRadius: 16,
          fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(40,60,45,0.16)',
        }}>
          {t.linkCopied}
        </div>
      )}

      <p style={{ margin: 0, textAlign: 'center', lineHeight: 1.25, fontFamily: displayFont, fontSize: ko ? 22 : 36, fontWeight: ko ? 500 : 400, letterSpacing: ko ? '-0.5px' : 0 }}>
        {t.title}
      </p>

      {/*
        Lifetime total, under the streak rather than instead of it. The streak
        is what a missed day costs; this is what it cannot take away, so a
        broken streak does not read as starting from nothing.
      */}
      <p style={{ margin: '10px 0 0', fontSize: 14, color: '#7d8f82', textAlign: 'center' }}>
        {t.totalDays(streakData.totalDays)}
      </p>

      {/* Ring */}
      <div style={{ position: 'relative', width: RING, height: RING, marginTop: 30 }}>
        <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="10" />
          <circle
            cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={PINK} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${Math.min(streakData.currentStreak / target, 1) * CIRC} ${CIRC}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: displayFont, fontSize: 52, fontWeight: 400, lineHeight: 1 }}>{streakData.currentStreak}</div>
          <div style={{ fontSize: 13, color: '#7d8f82', marginTop: 6 }}>/ {target}</div>
        </div>
      </div>

      {/* Week */}
      <div style={{
        width: '100%', marginTop: 34,
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
      }}>
        {streakData.weekDays.map((day, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: day.completed ? INK : '#8e9a92', marginBottom: 8 }}>
              {day.day}
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', margin: '0 auto',
              background: day.completed ? PINK : 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: day.completed ? '0 4px 12px rgba(237,163,188,0.35)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {day.completed && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
