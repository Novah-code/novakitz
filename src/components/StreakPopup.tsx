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

  if (loading || !streakData) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '24px',
          textAlign: 'center'
        }}>
          <p>{language === 'ko' ? '로딩 중...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000
        }}
      />

      {/* Streak Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          borderRadius: '32px',
          padding: window.innerWidth < 480 ? '1.5rem 1rem' : '2.5rem 2rem',
          maxWidth: '600px',
          width: window.innerWidth < 480 ? '95%' : '90%',
          maxHeight: window.innerWidth < 480 ? '85vh' : '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 10001,
          fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
        }}
      >
        {/* Share Button */}
        <button
          onClick={handleShare}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: '#5A8449',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>

        {/* Copied notification */}
        {showCopied && (
          <div style={{
            position: 'absolute',
            top: '4rem',
            right: '1.5rem',
            background: '#7FB069',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.2s ease'
          }}>
            {t.linkCopied}
          </div>
        )}

        {/* Title */}
        <h2 style={{
          margin: '0 0 2rem 0',
          fontSize: window.innerWidth < 480 ? '1.4rem' : '1.75rem',
          fontWeight: '600',
          color: '#2c3e50',
          textAlign: 'center'
        }}>
          {t.title}
        </h2>

        {/*
          Lifetime total, under the streak rather than instead of it. The streak
          is what a missed day costs; this is what it cannot take away, so a
          broken streak does not read as starting from nothing.
        */}
        <p style={{
          margin: '-1.5rem 0 1.5rem 0',
          fontSize: '0.85rem',
          color: '#8FAF83',
          textAlign: 'center'
        }}>
          {t.totalDays(streakData.totalDays)}
        </p>

        {/* Streak Circle */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 480 ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: window.innerWidth < 480 ? '1.5rem' : '3rem',
          marginBottom: '2.5rem'
        }}>
          {/* Circle with number */}
          <div style={{
            position: 'relative',
            width: window.innerWidth < 480 ? '100px' : '120px',
            height: window.innerWidth < 480 ? '100px' : '120px',
            flexShrink: 0
          }}>
            <svg
              width={window.innerWidth < 480 ? "100" : "120"}
              height={window.innerWidth < 480 ? "100" : "120"}
              viewBox="0 0 120 120"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e8f5e8"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#7FB069"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(streakData.currentStreak / nextMilestone(streakData.currentStreak), 1) * 339} 339`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: window.innerWidth < 480 ? '2rem' : '2.5rem',
                fontWeight: 'bold',
                color: '#5A8449',
                lineHeight: 1
              }}>
                {streakData.currentStreak}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#8FAF83', marginTop: 4 }}>
                / {nextMilestone(streakData.currentStreak)}
              </div>
            </div>
          </div>

          {/* Week Calendar */}
          <div style={{ flex: 1, width: window.innerWidth < 480 ? '100%' : 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: window.innerWidth < 480 ? '6px' : '8px'
            }}>
              {streakData.weekDays.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: window.innerWidth < 480 ? '0.65rem' : '0.75rem',
                    fontWeight: '600',
                    color: day.completed ? '#5A8449' : '#9ca3af',
                    marginBottom: window.innerWidth < 480 ? '4px' : '6px'
                  }}>
                    {day.day}
                  </div>
                  <div style={{
                    width: window.innerWidth < 480 ? '36px' : '44px',
                    height: window.innerWidth < 480 ? '36px' : '44px',
                    borderRadius: '50%',
                    background: day.completed ? '#7FB069' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    margin: '0 auto'
                  }}>
                    {day.completed && (
                      <svg
                        width={window.innerWidth < 480 ? "16" : "20"}
                        height={window.innerWidth < 480 ? "16" : "20"}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: window.innerWidth < 480 ? '12px' : '14px',
            background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: window.innerWidth < 480 ? '0.95rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(127, 176, 105, 0.25)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.25)';
          }}
        >
          {t.close}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
