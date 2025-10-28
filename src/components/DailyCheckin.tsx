'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CheckinRecord {
  id: string;
  time_of_day: 'morning' | 'afternoon' | 'evening';
  mood: number;
  energy_level: number;
  progress_note: string;
  created_at: string;
}

interface DailyCheckinProps {
  userId: string;
  language: 'en' | 'ko';
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  onCheckInComplete?: () => void;
}

export default function DailyCheckin({
  userId,
  language,
  timeOfDay = 'afternoon',
  onCheckInComplete
}: DailyCheckinProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [mood, setMood] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [progressNote, setProgressNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState<CheckinRecord[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchTodayCheckins = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('checkins')
          .select('id, time_of_day, mood, energy_level, progress_note, created_at')
          .eq('user_id', userId)
          .eq('check_date', today);

        if (error) {
          console.error('Error fetching checkins:', error);
        } else if (data) {
          setTodayCheckins(data as CheckinRecord[]);
          // Check if they already checked in at this time
          const alreadyCheckedIn = data.some(c => c.time_of_day === timeOfDay);
          setHasCheckedInToday(alreadyCheckedIn);
        }
      } catch (error) {
        console.error('Exception fetching checkins:', error);
      }
    };

    fetchTodayCheckins();
  }, [userId]);

  const handleSubmit = async () => {
    if (!userId) {
      console.warn('DailyCheckin: No userId provided');
      return;
    }

    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];

      console.log('DailyCheckin: Starting submission', {
        userId,
        check_date: today,
        time_of_day: timeOfDay,
        mood,
        energy_level: energyLevel,
        progress_note: progressNote
      });

      const { data, error } = await supabase
        .from('checkins')
        .insert([
          {
            user_id: userId,
            check_date: today,
            time_of_day: timeOfDay,
            mood,
            energy_level: energyLevel,
            progress_note: progressNote
          }
        ])
        .select()
        .single();

      console.log('DailyCheckin: Insert response', { data, error });

      if (error) {
        console.error('DailyCheckin: Error saving checkin:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        alert(language === 'ko'
          ? `저장 중 오류 발생: ${error.message}`
          : `Error saving check-in: ${error.message}`);
      } else if (data) {
        console.log('DailyCheckin: Successfully saved:', data);
        setHasCheckedInToday(true);
        setIsOpen(false);

        // Reset form
        setMood(5);
        setEnergyLevel(5);
        setProgressNote('');

        // Update today's checkins
        setTodayCheckins([...todayCheckins, data as CheckinRecord]);

        // Call callback if provided
        if (onCheckInComplete) {
          onCheckInComplete();
        }

        // Show success message
        alert(language === 'ko'
          ? '체크인이 완료되었습니다! 좋은 하루 보내세요!'
          : 'Check-in complete! Have a great day!');
      } else {
        console.warn('DailyCheckin: No error but no data returned');
        alert(language === 'ko' ? '저장 중 오류 발생' : 'Error saving check-in');
      }
    } catch (error) {
      console.error('DailyCheckin: Exception during submit:', error);
      alert(language === 'ko'
        ? `저장 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `Error saving check-in: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const moodLabels = language === 'ko'
    ? ['😢', '😟', '😐', '🙂', '😊', '😄', '🤩', '🥳', '🌟', '✨']
    : ['😢', '😟', '😐', '🙂', '😊', '😄', '🤩', '🥳', '🌟', '✨'];

  const timeLabels = {
    morning: language === 'ko' ? '아침' : 'Morning',
    afternoon: language === 'ko' ? '오후' : 'Afternoon',
    evening: language === 'ko' ? '저녁' : 'Evening'
  };

  if (hasCheckedInToday) {
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
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <div>
            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#7FB069'
            }}>
              {language === 'ko'
                ? `${timeLabels[timeOfDay]} 체크인 완료`
                : `${timeLabels[timeOfDay]} check-in done`}
            </p>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.85rem',
              color: 'rgba(0, 0, 0, 0.5)'
            }}>
              {language === 'ko'
                ? '훌륭한 업데이트입니다!'
                : 'Great update!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Checkin Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '16px',
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
        {language === 'ko'
          ? `${timeLabels[timeOfDay]} 체크인 하기`
          : `${timeLabels[timeOfDay]} Check-in`}
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
              {timeLabels[timeOfDay]} {language === 'ko' ? '체크인' : 'Check-in'}
            </h2>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.9rem',
              color: 'rgba(0, 0, 0, 0.6)'
            }}>
              {language === 'ko'
                ? '현재 기분과 진행 상황을 공유해주세요'
                : 'Share how you\'re doing and your progress'}
            </p>

            {/* Mood Selector */}
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
                {language === 'ko' ? '기분' : 'Mood'} ({mood}/10)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMood(i + 1)}
                    style={{
                      padding: '12px',
                      fontSize: '1.5rem',
                      background: mood === i + 1
                        ? 'rgba(127, 176, 105, 0.2)'
                        : 'transparent',
                      border: mood === i + 1
                        ? '2px solid #7FB069'
                        : '1px solid rgba(127, 176, 105, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      if (mood !== i + 1) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {moodLabels[i]}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level Selector */}
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
                {language === 'ko' ? '에너지 레벨' : 'Energy Level'} ({energyLevel}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  background: 'linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #7FB069 100%)',
                  borderRadius: '3px',
                  outline: 'none',
                  WebkitAppearance: 'slider-horizontal',
                  cursor: 'pointer'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'rgba(0, 0, 0, 0.4)',
                marginTop: '8px'
              }}>
                <span>{language === 'ko' ? '피곤' : 'Tired'}</span>
                <span>{language === 'ko' ? '활기찬' : 'Energized'}</span>
              </div>
            </div>

            {/* Progress Note */}
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
                {language === 'ko' ? '오늘의 진행 상황 (선택)' : 'Progress Note (Optional)'}
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder={language === 'ko'
                  ? '오늘 무엇을 했는지, 어떻게 느꼈는지 간단히 적어주세요'
                  : 'What did you do? How do you feel?'}
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
                  background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
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
