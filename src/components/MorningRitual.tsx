'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Intention {
  intention_1: string;
  intention_2: string;
  intention_3: string;
  date: string;
  created_at: string;
}

interface MorningRitualProps {
  userId: string;
  language: 'en' | 'ko';
}

export default function MorningRitual({ userId, language }: MorningRitualProps) {
  const [intentions, setIntentions] = useState<Intention | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<{ [key: number]: boolean }>({
    1: false,
    2: false,
    3: false
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    if (!userId) return;

    const fetchTodayIntentions = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('daily_intentions')
          .select('intention_1, intention_2, intention_3, date, created_at')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (error) {
          console.error('Error fetching today\'s intentions:', error);
          setIntentions(null);
        } else if (data) {
          setIntentions(data as Intention);
          // Load completion state from localStorage
          const savedState = localStorage.getItem(`intentions_${today}`);
          if (savedState) {
            setCompleted(JSON.parse(savedState));
          }
        } else {
          setIntentions(null);
        }
      } catch (error) {
        console.error('Exception fetching intentions:', error);
        setIntentions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayIntentions();
  }, [userId]);

  const toggleCompletion = (intentionNum: number) => {
    const newCompleted = {
      ...completed,
      [intentionNum]: !completed[intentionNum as keyof typeof completed]
    };
    setCompleted(newCompleted);

    // Save to localStorage
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`intentions_${today}`, JSON.stringify(newCompleted));
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(0, 0, 0, 0.5)'
      }}>
        {language === 'ko' ? '오늘의 확언 로드 중...' : 'Loading today\'s affirmations...'}
      </div>
    );
  }

  if (!intentions) {
    return (
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 250, 245, 0.8) 100%)',
        borderRadius: '16px',
        textAlign: 'center',
        color: 'rgba(0, 0, 0, 0.6)',
        marginBottom: '20px'
      }}>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          {language === 'ko'
            ? '오늘의 의도가 아직 없습니다. 꿈을 기록하면 자동으로 생성됩니다.'
            : 'No intentions for today yet. Record a dream to generate them automatically.'}
        </p>
      </div>
    );
  }

  const intentionsList = [
    { num: 1, text: intentions.intention_1 },
    { num: 2, text: intentions.intention_2 },
    { num: 3, text: intentions.intention_3 }
  ];

  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <div style={{
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '1.3rem',
          fontWeight: 600,
          color: 'var(--matcha-dark)',
          fontFamily: "'Cormorant', serif"
        }}>
          {language === 'ko' ? '오늘의 확언' : 'Today\'s Affirmations'}
        </h2>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'rgba(0, 0, 0, 0.5)'
        }}>
          {language === 'ko'
            ? `${completedCount} / 3개 완료`
            : `${completedCount} / 3 completed`}
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '4px',
        background: 'rgba(127, 176, 105, 0.2)',
        borderRadius: '2px',
        marginBottom: '20px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #7FB069 0%, #8BC34A 100%)',
          width: `${(completedCount / 3) * 100}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Intentions List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {intentionsList.map((intention) => (
          <div
            key={intention.num}
            onClick={() => toggleCompletion(intention.num)}
            style={{
              padding: '16px',
              background: completed[intention.num as keyof typeof completed]
                ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 250, 245, 0.8) 100%)',
              border: `2px solid ${completed[intention.num as keyof typeof completed]
                ? '#7FB069'
                : 'rgba(127, 176, 105, 0.2)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!completed[intention.num as keyof typeof completed]) {
                e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.5)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.95) 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!completed[intention.num as keyof typeof completed]) {
                e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 250, 245, 0.8) 100%)';
              }
            }}
          >
            {/* Checkbox */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '20px',
              height: '20px',
              border: `2px solid ${completed[intention.num as keyof typeof completed]
                ? '#7FB069'
                : 'rgba(127, 176, 105, 0.3)'}`,
              borderRadius: '4px',
              background: completed[intention.num as keyof typeof completed]
                ? '#7FB069'
                : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              {completed[intention.num as keyof typeof completed] && (
                <span style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>✓</span>
              )}
            </div>

            {/* Content */}
            <div style={{
              paddingRight: '32px'
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#7FB069',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                {language === 'ko' ? `확언 ${intention.num}` : `Affirmation ${intention.num}`}
              </div>
              <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: completed[intention.num as keyof typeof completed]
                  ? 'rgba(0, 0, 0, 0.5)'
                  : 'rgba(0, 0, 0, 0.7)',
                lineHeight: 1.5,
                textDecoration: completed[intention.num as keyof typeof completed]
                  ? 'line-through'
                  : 'none'
              }}>
                {intention.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.08) 0%, rgba(139, 195, 74, 0.05) 100%)',
        borderLeft: '4px solid #7FB069',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: 'rgba(0, 0, 0, 0.6)',
        lineHeight: 1.5
      }}>
        {language === 'ko' ? (
          <>
            <strong>💫 오늘의 팁:</strong> 이 의도들은 어제 밤 꿈에서 영감을 받았습니다.
            작은 것부터 시작하세요. 완벽함보다는 지속성이 중요합니다.
          </>
        ) : (
          <>
            <strong>💫 Today's Tip:</strong> These intentions were inspired by your last night's dream.
            Start small. Consistency matters more than perfection.
          </>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          div {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
