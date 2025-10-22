'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface StreakPopupProps {
  user: User;
  language: 'en' | 'ko';
  onClose: () => void;
}

interface StreakData {
  currentStreak: number;
  weekDays: {
    day: string;
    date: string;
    completed: boolean;
  }[];
}

const translations = {
  en: {
    title: 'Your streak',
    days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    share: 'Share',
    close: 'Close',
    shareMessage: (streak: number) => `I've been recording my dreams for ${streak} day${streak > 1 ? 's' : ''} straight! 🌙✨`,
    linkCopied: 'Link copied!'
  },
  ko: {
    title: 'Your streak',
    days: ['일', '월', '화', '수', '목', '금', '토'],
    share: 'Share',
    close: 'Close',
    shareMessage: (streak: number) => `나는 연속 ${streak}일 꿈을 기록했어요! 🌙✨`,
    linkCopied: '링크가 복사되었어요!'
  }
};

export default function StreakPopup({ user, language, onClose }: StreakPopupProps) {
  const t = translations[language];
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    loadStreakData();
  }, [user.id]);

  const loadStreakData = async () => {
    try {
      // Fetch dreams for the last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: dreamsData, error } = await supabase
        .from('dreams')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique dates with dreams
      const dreamDates = new Set(
        dreamsData?.map(d => new Date(d.created_at).toDateString()) || []
      );

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      if (dreamDates.has(today) || dreamDates.has(yesterday)) {
        currentStreak = 1;
        let checkDate = dreamDates.has(today) ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000);

        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const dateStr = checkDate.toDateString();
          if (dreamDates.has(dateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Build week days array (last 7 days, starting from today going back)
      const weekDays = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayIndex = date.getDay();
        const dateStr = date.toDateString();

        weekDays.push({
          day: t.days[dayIndex],
          date: dateStr,
          completed: dreamDates.has(dateStr)
        });
      }

      setStreakData({
        currentStreak,
        weekDays
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading streak data:', error);
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!streakData) return;

    const message = t.shareMessage(streakData.currentStreak);
    const url = window.location.origin;
    const shareText = `${message}\n\nNovakitz - Dream Journal\n${url}`;

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
          padding: '2.5rem 2rem',
          maxWidth: '600px',
          width: '90%',
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
          fontSize: '1.75rem',
          fontWeight: '600',
          color: '#2c3e50',
          textAlign: 'center'
        }}>
          {t.title}
        </h2>

        {/* Streak Circle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3rem',
          marginBottom: '2.5rem'
        }}>
          {/* Circle with number */}
          <div style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            flexShrink: 0
          }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
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
                strokeDasharray={`${(streakData.currentStreak / 7) * 339} 339`}
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
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#5A8449',
                lineHeight: 1
              }}>
                {streakData.currentStreak}
              </div>
              <div style={{
                fontSize: '1.5rem',
                color: '#7FB069',
                marginTop: '4px'
              }}>
                ✨
              </div>
            </div>
          </div>

          {/* Week Calendar */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}>
              {streakData.weekDays.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: day.completed ? '#5A8449' : '#9ca3af',
                    marginBottom: '6px'
                  }}>
                    {day.day}
                  </div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: day.completed ? '#7FB069' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    margin: '0 auto'
                  }}>
                    {day.completed && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
            padding: '14px',
            background: 'linear-gradient(135deg, #7FB069 0%, #5A8449 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 176, 105, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
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
