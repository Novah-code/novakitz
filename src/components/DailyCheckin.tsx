'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AffirmationsDisplay from './AffirmationsDisplay';
import Toast, { ToastType } from './Toast';

interface CheckinRecord {
  id: string;
  time_of_day: 'morning' | 'evening';
  mood: number;
  energy_level: number;
  progress_note: string;
  created_at: string;
}

interface DailyCheckinProps {
  userId: string;
  language: 'en' | 'ko';
  timeOfDay?: 'morning' | 'evening';
  onCheckInComplete?: (mood?: number) => void;
  dreamText?: string;
  dreamId?: string;
  isPremium?: boolean;
  hideAffirmations?: boolean;
}

export default function DailyCheckin({
  userId,
  language,
  timeOfDay = 'evening',
  onCheckInComplete,
  dreamText = '',
  dreamId,
  isPremium = false,
  hideAffirmations = false
}: DailyCheckinProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [mood, setMood] = useState(3);
  const [energyLevel] = useState(5);
  const [emotionIndex, setEmotionIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayCheckins, setTodayCheckins] = useState<CheckinRecord[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => setToast({ message, type });
  const [showAffirmations, setShowAffirmations] = useState(true);

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

  const emotionList = [
    { label: language === 'ko' ? '불안' : 'Anxious',  color: 'rgba(217,210,233,0.7)', borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%', moodValue: 2 },
    { label: language === 'ko' ? '두려움' : 'Fear',   color: 'rgba(205,224,230,0.7)', borderRadius: '50% 50% 60% 60% / 40% 40% 70% 70%', moodValue: 1 },
    { label: language === 'ko' ? '평온' : 'Peaceful', color: 'rgba(181,218,185,0.7)', borderRadius: '50%', moodValue: 4 },
    { label: language === 'ko' ? '기쁨' : 'Joyful',  color: 'rgba(253,232,181,0.7)', borderRadius: '45% 55% 45% 55% / 65% 55% 45% 35%', moodValue: 5 },
    { label: language === 'ko' ? '외로움' : 'Lonely', color: 'rgba(214,221,229,0.7)', borderRadius: '50% 50% 40% 40% / 40% 40% 60% 60%', moodValue: 2 },
    { label: language === 'ko' ? '희망' : 'Hopeful', color: 'rgba(214,241,208,0.7)', borderRadius: '50% 50% 50% 50% / 70% 70% 40% 40%', moodValue: 4 },
    { label: language === 'ko' ? '분노' : 'Anger',   color: 'rgba(250,209,196,0.7)', borderRadius: '15px 30px 15px 30px', moodValue: 2 },
    { label: language === 'ko' ? '무기력' : 'Low',   color: 'rgba(226,232,240,0.7)', borderRadius: '16px', moodValue: 1 },
  ];

  const handleSubmit = async () => {
    if (!userId) {
      console.warn('DailyCheckin: No userId provided');
      return;
    }
    const finalMood = emotionIndex !== null ? emotionList[emotionIndex].moodValue : mood;
    setMood(finalMood);

    try {
      setSubmitting(true);
      const today = new Date().toISOString().split('T')[0];

      console.log('DailyCheckin: Starting submission', {
        userId,
        check_date: today,
        time_of_day: timeOfDay,
        mood,
        energy_level: energyLevel
      });

      const { data, error } = await supabase
        .from('checkins')
        .insert([
          {
            user_id: userId,
            check_date: today,
            time_of_day: timeOfDay,
            mood: finalMood,
            energy_level: energyLevel
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
        showToast(language === 'ko'
          ? `저장 중 오류 발생: ${error.message}`
          : `Error saving check-in: ${error.message}`, 'error');
      } else if (data) {
        console.log('DailyCheckin: Successfully saved:', data);
        setHasCheckedInToday(true);
        setIsOpen(false);

        // Reset form
        setMood(3);

        // Update today's checkins - using functional setState
        setTodayCheckins(prev => [...prev, data as CheckinRecord]);

        // Call callback if provided
        if (onCheckInComplete) {
          onCheckInComplete(finalMood);
        }

        // Show success message
        showToast(language === 'ko'
          ? '체크인이 완료되었습니다! 좋은 하루 보내세요!'
          : 'Check-in complete! Have a great day!', 'success');
      } else {
        console.warn('DailyCheckin: No error but no data returned');
        showToast(language === 'ko' ? '저장 중 오류 발생' : 'Error saving check-in', 'error');
      }
    } catch (error) {
      console.error('DailyCheckin: Exception during submit:', error);
      showToast(language === 'ko'
        ? `저장 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `Error saving check-in: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };


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
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Affirmations Display - Show for dreamText OR for existing affirmations (from No Dream) */}
      {showAffirmations && !hideAffirmations && (
        <AffirmationsDisplay
          user={{ id: userId } as any}
          checkInTime={timeOfDay}
          dreamText={dreamText}
          dreamId={dreamId}
          language={language}
          isPremium={isPremium}
          onClose={() => {
            setShowAffirmations(false);
          }}
        />
      )}

      {/* Checkin Button */}
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
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(127, 176, 105, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(127, 176, 105, 0.1)';
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
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#EAF4EC',
            borderRadius: 32,
            padding: '35px 25px 45px',
            maxWidth: 360,
            width: '90%',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            zIndex: 901,
            textAlign: 'center'
          }}>
            <button onClick={() => setIsOpen(false)} style={{position:'absolute',top:20,right:20,width:30,height:30,background:'rgba(0,0,0,0.05)',border:'none',borderRadius:'50%',cursor:'pointer',fontSize:14,color:'#4A5D4E',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            <p style={{fontSize:16,fontWeight:500,color:'#4A5D4E',margin:'10px 0 40px',letterSpacing:'-0.5px'}}>
              {language === 'ko'
                ? `오늘 ${timeLabels[timeOfDay]} 기분은 어떤가요?`
                : `How are you feeling this ${timeLabels[timeOfDay].toLowerCase()}?`}
            </p>

            {/* Emotion pebbles */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'20px 10px',justifyItems:'center',marginBottom:32}}>
              {emotionList.map((emo, i) => (
                <div
                  key={i}
                  onClick={() => setEmotionIndex(i)}
                  style={{
                    display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer',
                    transition:'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: emotionIndex===i ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)'
                  }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    backgroundColor: emo.color,
                    borderRadius: emo.borderRadius,
                    backdropFilter: 'blur(10px)',
                    border: emotionIndex === i ? '2.5px solid #4A5D4E' : '1px solid rgba(255,255,255,0.8)',
                    boxShadow: emotionIndex === i
                      ? '0 6px 16px rgba(0,0,0,0.15)'
                      : '4px 4px 12px rgba(0,0,0,0.05), -4px -4px 12px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,0.8)',
                    transition: 'all 0.3s ease',
                  }} />
                  <span style={{fontSize:11,color:'#4A5D4E',opacity:0.8,fontWeight:500}}>{emo.label}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setIsOpen(false)} style={{flex:1,padding:'11px',background:'rgba(74,93,78,0.08)',color:'#4A5D4E',border:'1px solid rgba(74,93,78,0.15)',borderRadius:10,fontSize:14,fontWeight:500,cursor:'pointer'}}>
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || emotionIndex === null}
                style={{flex:1,padding:'11px',background:emotionIndex!==null?'#4A5D4E':'rgba(74,93,78,0.12)',color:emotionIndex!==null?'white':'#8BA390',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:emotionIndex===null||submitting?'not-allowed':'pointer',transition:'all 0.2s',opacity:submitting?0.7:1}}
              >
                {submitting ? (language === 'ko' ? '저장 중...' : 'Saving...') : (language === 'ko' ? '기록하기' : 'Save')}
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
