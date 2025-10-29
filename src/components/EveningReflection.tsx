'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Intention {
  intention_1: string;
  intention_2: string;
  intention_3: string;
}

interface ReflectionRecord {
  id: string;
  intention_1_achieved: boolean;
  intention_2_achieved: boolean;
  intention_3_achieved: boolean;
  overall_score: number;
  reflection_note: string;
  dream_preparation_tip: string;
  created_at: string;
}

interface EveningReflectionProps {
  userId: string;
  language: 'en' | 'ko';
  onReflectionComplete?: () => void;
}

export default function EveningReflection({
  userId,
  language,
  onReflectionComplete
}: EveningReflectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReflectedToday, setHasReflectedToday] = useState(false);
  const [intentions, setIntentions] = useState<Intention | null>(null);
  const [achieved, setAchieved] = useState({
    1: false,
    2: false,
    3: false
  });
  const [overallScore, setOverallScore] = useState(5);
  const [reflectionNote, setReflectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchTodayData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's intentions
        const { data: intentionData } = await supabase
          .from('daily_intentions')
          .select('intention_1, intention_2, intention_3')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();

        if (intentionData) {
          setIntentions(intentionData as Intention);
        }

        // Check if already reflected today
        const { data: reflectionData } = await supabase
          .from('evening_reflections')
          .select('id')
          .eq('user_id', userId)
          .eq('reflection_date', today)
          .maybeSingle();

        if (reflectionData) {
          setHasReflectedToday(true);
        }
      } catch (error) {
        console.error('Error fetching today\'s data:', error);
      }
    };

    fetchTodayData();
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];

      // Generate dream preparation tip based on reflection
      const dreamTip = language === 'ko'
        ? '잠들기 전에 깊게 숨을 쉬고, 오늘의 경험들을 감사한 마음으로 돌아보세요.'
        : 'Before sleep, take deep breaths and reflect on today\'s experiences with gratitude.';

      const { data, error } = await supabase
        .from('evening_reflections')
        .insert([
          {
            user_id: userId,
            reflection_date: today,
            intention_1_achieved: achieved[1 as keyof typeof achieved],
            intention_2_achieved: achieved[2 as keyof typeof achieved],
            intention_3_achieved: achieved[3 as keyof typeof achieved],
            overall_score: overallScore,
            reflection_note: reflectionNote,
            dream_preparation_tip: dreamTip
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving reflection:', error);
        alert(language === 'ko' ? '저장 중 오류 발생' : 'Error saving reflection');
      } else if (data) {
        console.log('Reflection saved:', data);
        setHasReflectedToday(true);
        setIsOpen(false);

        // Reset form
        setAchieved({ 1: false, 2: false, 3: false });
        setOverallScore(5);
        setReflectionNote('');

        // Call callback
        if (onReflectionComplete) {
          onReflectionComplete();
        }

        // Show success message
        alert(language === 'ko'
          ? '오늘의 성찰이 완료되었습니다. 좋은 꿈 꾸세요! 🌙'
          : 'Reflection complete! Sweet dreams! 🌙');
      }
    } catch (error) {
      console.error('Exception saving reflection:', error);
      alert(language === 'ko' ? '저장 중 오류 발생' : 'Error saving reflection');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAchieved = (intentionNum: number) => {
    setAchieved(prev => ({
      ...prev,
      [intentionNum]: !prev[intentionNum as keyof typeof prev]
    }));
  };

  if (hasReflectedToday) {
    return (
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(127, 176, 105, 0.2)',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🌙</span>
          <div>
            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#7FB069'
            }}>
              {language === 'ko'
                ? '오늘의 성찰 완료'
                : 'Evening reflection complete'}
            </p>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.85rem',
              color: 'rgba(0, 0, 0, 0.5)'
            }}>
              {language === 'ko'
                ? '좋은 꿈을 기원합니다!'
                : 'Sleep well!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Reflection Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'rgba(127, 176, 105, 0.08)',
          color: '#7FB069',
          border: '1px solid rgba(127, 176, 105, 0.2)',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '16px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
        }}
      >
        {language === 'ko' ? '저녁 성찰하기' : 'Evening Reflection'}
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 900
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '20px',
              padding: '32px 24px',
              maxWidth: '420px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              zIndex: 901
            }}
          >
            {/* Header */}
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.3rem',
              fontWeight: 600,
              color: 'var(--matcha-dark)',
              fontFamily: "'Cormorant', serif"
            }}>
              {language === 'ko' ? '저녁 성찰' : 'Evening Reflection'}
            </h2>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.9rem',
              color: 'rgba(0, 0, 0, 0.6)'
            }}>
              {language === 'ko'
                ? '오늘 하루를 되돌아보고 내일을 준비하세요'
                : 'Reflect on your day and prepare for tomorrow'}
            </p>

            {/* Intention Achievement */}
            {intentions && (
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.7)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {language === 'ko' ? '의도 달성 여부' : 'Did you achieve your intentions?'}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { num: 1, text: intentions.intention_1 },
                    { num: 2, text: intentions.intention_2 },
                    { num: 3, text: intentions.intention_3 }
                  ].map((intention) => (
                    <button
                      key={intention.num}
                      onClick={() => toggleAchieved(intention.num)}
                      style={{
                        padding: '12px',
                        background: achieved[intention.num as keyof typeof achieved]
                          ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 250, 245, 0.8) 100%)',
                        border: `2px solid ${achieved[intention.num as keyof typeof achieved]
                          ? '#7FB069'
                          : 'rgba(127, 176, 105, 0.2)'}`,
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => {
                        if (!achieved[intention.num as keyof typeof achieved]) {
                          e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!achieved[intention.num as keyof typeof achieved]) {
                          e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.2)';
                        }
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: `2px solid ${achieved[intention.num as keyof typeof achieved]
                          ? '#7FB069'
                          : 'rgba(127, 176, 105, 0.3)'}`,
                        borderRadius: '4px',
                        background: achieved[intention.num as keyof typeof achieved]
                          ? '#7FB069'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {achieved[intention.num as keyof typeof achieved] && (
                          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                        )}
                      </div>
                      <span style={{
                        color: achieved[intention.num as keyof typeof achieved]
                          ? 'rgba(0, 0, 0, 0.5)'
                          : 'rgba(0, 0, 0, 0.7)',
                        textDecoration: achieved[intention.num as keyof typeof achieved]
                          ? 'line-through'
                          : 'none',
                        flex: 1
                      }}>
                        {intention.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Score */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'rgba(0, 0, 0, 0.7)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {language === 'ko' ? '오늘 하루 평가' : 'Rate your day'} ({overallScore}/10)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setOverallScore(i + 1)}
                    style={{
                      padding: '10px 4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: overallScore === i + 1
                        ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
                        : 'rgba(127, 176, 105, 0.1)',
                      color: overallScore === i + 1 ? 'white' : 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (overallScore !== i + 1) {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (overallScore !== i + 1) {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                      }
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Note */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'rgba(0, 0, 0, 0.7)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {language === 'ko' ? '오늘의 성찰 (선택)' : 'Reflection Note (Optional)'}
              </label>
              <textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder={language === 'ko'
                  ? '오늘 하루에서 배운 점이나 느낀 점을 적어보세요'
                  : 'What did you learn or feel today?'}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '1px solid rgba(127, 176, 105, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(127, 176, 105, 0.08)',
                  color: '#7FB069',
                  border: '1px solid rgba(127, 176, 105, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
                }}
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(127, 176, 105, 0.08)',
                  color: '#7FB069',
                  border: '1px solid rgba(127, 176, 105, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
                }}
              >
                {submitting ? (language === 'ko' ? '저장 중...' : 'Saving...') : (language === 'ko' ? '저장' : 'Save')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
