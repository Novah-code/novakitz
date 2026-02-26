'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import ArchetypeTestNav from '../../../src/components/ArchetypeTestNav';
import '../../globals.css';

interface Dream {
  id: string;
  content: string;
  created_at: string;
}

export default function GuestDreamRecording() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [dreamText, setDreamText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [previousDreams, setPreviousDreams] = useState<Dream[]>([]);
  const [showPreviousDreams, setShowPreviousDreams] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Check auth and load previous dreams
    checkAuthAndLoadDreams();
  }, []);

  const checkAuthAndLoadDreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);

        // Load user's previous dreams
        const { data: dreams, error } = await supabase
          .from('dreams')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && dreams) {
          setPreviousDreams(dreams);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to check auth:', err);
      setLoading(false);
    }
  };

  const handleSelectPreviousDream = (dream: Dream) => {
    const dreamOnly = dream.content.split('\n\n---\n\nAnalysis:')[0].split('\n\n---\n\n분석:')[0];
    setDreamText(dreamOnly);
    setShowPreviousDreams(false);
  };

  const handleSubmit = () => {
    if (!dreamText.trim()) {
      alert(language === 'ko' ? '꿈 내용을 입력해주세요' : 'Please enter your dream');
      return;
    }

    if (dreamText.length < 10) {
      alert(language === 'ko' ? '좀 더 자세히 작성해주세요 (최소 10자)' : 'Please write more details (min 10 chars)');
      return;
    }

    setIsSubmitting(true);

    // Save to localStorage
    localStorage.setItem('guest_dream', JSON.stringify({
      content: dreamText,
      timestamp: new Date().toISOString()
    }));

    // Move to quiz
    setTimeout(() => {
      router.push('/archetype-test/quiz');
    }, 500);
  };

  const handleSkip = () => {
    // Save empty dream
    localStorage.setItem('guest_dream', JSON.stringify({
      content: '',
      timestamp: new Date().toISOString(),
      skipped: true
    }));
    router.push('/archetype-test/quiz');
  };

  if (loading) {
    return (
      <>
        <ArchetypeTestNav language={language} />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <p style={{ fontSize: '18px', color: '#666' }}>
            {language === 'ko' ? '로딩 중...' : 'Loading...'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ArchetypeTestNav language={language} />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 1rem'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              ← 뒤로
            </button>
            <div style={{
              flex: 1,
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '33%',
                height: '100%',
                background: 'linear-gradient(90deg, #7FB069 0%, #8BC34A 100%)'
              }} />
            </div>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            margin: 0
          }}>
            {language === 'ko' ? '1단계 / 2단계' : 'Step 1 / 2'}
          </p>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 5vw, 3rem)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '60px', marginBottom: '1rem' }}>💭</div>
            <h1 style={{
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem',
              fontFamily: "'Cormorant', serif"
            }}>
              {language === 'ko' ? '가장 기억나는 꿈 하나를 기록해주세요' : 'Record Your Most Memorable Dream'}
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              {language === 'ko'
                ? '강렬하게 기억나는 꿈일수록 더 정확한 분석이 가능합니다. 편하게 작성하세요.'
                : 'The more vivid the dream, the more accurate the analysis. Write freely as you remember.'}
            </p>
          </div>

          {/* Previous Dreams Selection (Logged-in users only) */}
          {isLoggedIn && previousDreams.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={() => setShowPreviousDreams(!showPreviousDreams)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#f9fafb',
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#7FB069';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <span>📚</span>
                <span>
                  {language === 'ko'
                    ? `이전에 기록한 꿈에서 선택하기 (${previousDreams.length}개)`
                    : `Select from previous dreams (${previousDreams.length})`}
                </span>
                <span>{showPreviousDreams ? '▲' : '▼'}</span>
              </button>

              {/* Previous Dreams List */}
              {showPreviousDreams && (
                <div style={{
                  marginTop: '1rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '1rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {previousDreams.map((dream) => (
                    <button
                      key={dream.id}
                      onClick={() => handleSelectPreviousDream(dream)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#7FB069';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(127, 176, 105, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        marginBottom: '4px'
                      }}>
                        {new Date(dream.created_at).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#1f2937',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {dream.content.split('\n\n---\n\nAnalysis:')[0].split('\n\n---\n\n분석:')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dream Input */}
          <div style={{ marginBottom: '2rem' }}>
            <textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={language === 'ko'
                ? '예: 넓은 바다를 헤엄치고 있었어요. 물은 맑고 따뜻했고, 멀리 섬이 보였어요...'
                : 'e.g., I was swimming in a vast ocean. The water was clear and warm, and I could see an island in the distance...'}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#7FB069';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '13px',
              color: '#9ca3af'
            }}>
              <span>
                {dreamText.length < 10
                  ? language === 'ko'
                    ? `최소 10자 (현재 ${dreamText.length}자)`
                    : `Min 10 chars (current ${dreamText.length})`
                  : language === 'ko'
                    ? `${dreamText.length}자`
                    : `${dreamText.length} chars`}
              </span>
              {dreamText.length >= 10 && (
                <span style={{ color: '#7FB069', fontWeight: '600' }}>✓</span>
              )}
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.75rem'
            }}>
              💡 {language === 'ko' ? '작성 팁' : 'Writing Tips'}
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.8'
            }}>
              <li>{language === 'ko' ? '장소나 환경을 묘사해보세요' : 'Describe the location or environment'}</li>
              <li>{language === 'ko' ? '등장인물이나 생명체가 있었나요?' : 'Were there any characters or beings?'}</li>
              <li>{language === 'ko' ? '어떤 감정을 느꼈나요? (두려움, 기쁨, 불안 등)' : 'What emotions did you feel? (fear, joy, anxiety, etc.)'}</li>
              <li>{language === 'ko' ? '꿈에서 무엇을 원했나요? 무엇을 하려고 했나요?' : 'What did you want? What were you trying to do?'}</li>
              <li>{language === 'ko' ? '특별한 사건이나 행동이 있었나요?' : 'Were there any special events or actions?'}</li>
            </ul>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexDirection: 'column'
          }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || dreamText.length < 10}
              style={{
                width: '100%',
                padding: '16px',
                background: dreamText.length >= 10
                  ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
                  : '#e5e7eb',
                color: dreamText.length >= 10 ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: dreamText.length >= 10 ? 'pointer' : 'not-allowed',
                boxShadow: dreamText.length >= 10 ? '0 4px 12px rgba(127, 176, 105, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting
                ? (language === 'ko' ? '저장 중...' : 'Saving...')
                : (language === 'ko' ? '다음: 질문 답하기' : 'Next: Answer Questions')}
            </button>

            <button
              onClick={handleSkip}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {language === 'ko' ? '꿈 기억이 안나요 (건너뛰기)' : 'I don\'t remember (Skip)'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '13px',
          color: '#9ca3af'
        }}>
          <p>
            {language === 'ko'
              ? '🔒 입력한 꿈은 로컬에만 저장되며, 테스트 완료 후 삭제됩니다'
              : '🔒 Your dream is stored locally and deleted after the test'}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
