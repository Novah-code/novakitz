'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateArchetypeFromQuiz } from '../../../src/lib/archetypeQuiz';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeLongDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor,
  getArchetypeTagline
} from '../../../src/lib/archetypes';
import { getGrowthStage } from '../../../src/lib/archetypeGrowth';
import { supabase } from '../../../src/lib/supabase';
import ArchetypeTestNav from '../../../src/components/ArchetypeTestNav';
import ArchetypeShareCard from '../../../src/components/ArchetypeShareCard';
import '../../globals.css';

export default function ArchetypeResult() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [result, setResult] = useState<{
    primary: string;
    secondary: string | null;
    scores: Record<string, number>;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Email gate states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Check if already unlocked
    const unlocked = localStorage.getItem('archetype_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }

    loadResult();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const loadResult = async () => {
    const answersStr = localStorage.getItem('guest_quiz_answers');
    if (!answersStr) {
      router.push('/archetype-test');
      return;
    }

    const answers = JSON.parse(answersStr);
    const calculatedResult = calculateArchetypeFromQuiz(answers);
    setResult(calculatedResult);

    // Save result to database for sharing
    await saveResultToDatabase(calculatedResult, answers);
  };

  const saveResultToDatabase = async (
    calculatedResult: {
      primary: string;
      secondary: string | null;
      scores: Record<string, number>;
    },
    answers: Record<string, number>
  ) => {
    // Check if already saved
    const savedId = localStorage.getItem('guest_result_id');
    if (savedId) {
      setSavedResultId(savedId);
      return;
    }

    try {
      const dreamStr = localStorage.getItem('guest_dream');
      const dreamData = dreamStr ? JSON.parse(dreamStr) : null;

      const response = await fetch('/api/guest-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary_archetype: calculatedResult.primary,
          secondary_archetype: calculatedResult.secondary,
          archetype_scores: calculatedResult.scores,
          dream_content: dreamData?.content || '',
          quiz_answers: answers,
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedResultId(data.id);
        localStorage.setItem('guest_result_id', data.id);
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const handleShare = async () => {
    setSharing(true);

    // Use personalized share link if result is saved
    const shareUrl = savedResultId
      ? `${window.location.origin}/archetype-test/shared/${savedResultId}`
      : `${window.location.origin}/archetype-test`;

    // Get clean archetype name (remove English part for Korean)
    const fullName = getArchetypeName(result!.primary, language);
    const cleanName = language === 'ko' ? fullName.split(' (')[0] : fullName;
    const tagline = getArchetypeTagline(result!.primary, language);

    const shareText = language === 'ko'
      ? `나의 무의식 아키타입: ${cleanName}\n${tagline}\n\n당신의 아키타입도 알아보세요 ✨`
      : `My unconscious archetype: ${cleanName}\n${tagline}\n\nDiscover yours ✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'ko' ? '무의식 아키타입 테스트' : 'Unconscious Archetype Test',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert(language === 'ko' ? '링크가 복사되었습니다!' : 'Link copied!');
      } catch (err) {
        alert(language === 'ko' ? '공유 링크: ' + shareUrl : 'Share link: ' + shareUrl);
      }
    }
    setSharing(false);
  };

  const handleSignUp = () => {
    router.push('/');
  };

  const handleRetake = () => {
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    localStorage.removeItem('archetype_unlocked');
    router.push('/archetype-test');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(language === 'ko' ? '올바른 이메일 주소를 입력해주세요' : 'Please enter a valid email address');
      return;
    }

    if (!savedResultId) {
      setEmailError(language === 'ko' ? '결과를 저장하는 중입니다. 잠시 후 다시 시도해주세요.' : 'Saving result. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/guest-results', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: savedResultId,
          email,
          is_subscribed: isSubscribed,
        }),
      });

      if (response.ok) {
        setIsUnlocked(true);
        localStorage.setItem('archetype_unlocked', 'true');
      } else {
        const data = await response.json();
        setEmailError(data.error || (language === 'ko' ? '오류가 발생했습니다' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setEmailError(language === 'ko' ? '네트워크 오류가 발생했습니다' : 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!result) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>결과를 불러오는 중...</p>
      </div>
    );
  }

  const primaryColor = getArchetypeColor(result.primary);
  const primaryDarkColor = getArchetypeDarkColor(result.primary);
  const secondaryColor = result.secondary
    ? getArchetypeColor(result.secondary)
    : primaryColor;

  return (
    <>
      <ArchetypeTestNav language={language} isLoggedIn={isLoggedIn} />
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: 'clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem)'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Celebration Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontFamily: "'Cormorant', serif",
            marginBottom: '0.5rem'
          }}>
            {language === 'ko' ? '당신의 아키타입은?' : 'What is Your Archetype?'}
          </h1>
        </div>

        {/* Result Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 5vw, 3rem)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginBottom: '2rem'
        }}>
          {/* Primary Archetype */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              {language === 'ko' ? '당신의 주요 아키타입' : 'Your Primary Archetype'}
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {getArchetypeName(result.primary, language)}
            </div>
            <div style={{
              fontSize: '15px',
              color: '#7FB069',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              {getArchetypeTagline(result.primary, language)}
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              marginBottom: '0',
              lineHeight: '1.6'
            }}>
              {getArchetypeDescription(result.primary, language)}
            </div>
          </div>

          {/* Email Gate Section - Show when not unlocked and not logged in */}
          {!isUnlocked && !isLoggedIn && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center',
              border: '2px solid rgba(127, 176, 105, 0.3)'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '0.75rem'
              }}>
                {language === 'ko' ? '심층 분석 리포트' : 'Deep Analysis Report'}
              </div>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
              }}>
                {language === 'ko'
                  ? "융 심리학 기반의 '그림자(Shadow)' 분석과 성장 가이드를 확인하세요."
                  : "Unlock your Jung-based 'Shadow' analysis and growth guide."}
              </p>

              <form onSubmit={handleEmailSubmit} style={{ maxWidth: '320px', margin: '0 auto' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={language === 'ko' ? '이메일 주소' : 'Email address'}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: emailError ? '2px solid #ef4444' : '2px solid rgba(127, 176, 105, 0.3)',
                    fontSize: '15px',
                    marginBottom: '0.75rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    if (!emailError) e.currentTarget.style.borderColor = '#7FB069';
                  }}
                  onBlur={(e) => {
                    if (!emailError) e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.3)';
                  }}
                />

                {emailError && (
                  <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '0.75rem', textAlign: 'left' }}>
                    {emailError}
                  </p>
                )}

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#6b7280',
                  marginBottom: '1rem',
                  cursor: 'pointer',
                  justifyContent: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={isSubscribed}
                    onChange={(e) => setIsSubscribed(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#7FB069'
                    }}
                  />
                  {language === 'ko' ? '노바키츠 뉴스레터 받기' : 'Subscribe to Novakitz newsletter'}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: isSubmitting
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSubmitting
                    ? (language === 'ko' ? '처리 중...' : 'Processing...')
                    : (language === 'ko' ? '전체 결과 보기' : 'View Full Results')}
                </button>
              </form>

              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '1rem'
              }}>
                {language === 'ko' ? '스팸 없이 유용한 콘텐츠만 보내드려요' : 'No spam, only valuable content'}
              </p>
            </div>
          )}

          {/* Long Description - Always visible */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '15px',
              color: '#374151',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {getArchetypeLongDescription(result.primary, language)}
            </div>
          </div>

          {/* Blurred/Unlocked Content Wrapper */}
          <div style={{
            position: 'relative',
            filter: (isUnlocked || isLoggedIn) ? 'none' : 'blur(4px)',
            pointerEvents: (isUnlocked || isLoggedIn) ? 'auto' : 'none',
            userSelect: (isUnlocked || isLoggedIn) ? 'auto' : 'none',
            transition: 'filter 0.5s ease'
          }}>
            {/* Traits */}
            <div style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {language === 'ko' ? '💫 당신의 특징' : '💫 Your Traits'}
              </h3>
              <div style={{
                fontSize: '15px',
                color: '#374151',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap'
              }}>
                {getArchetypeTraits(result.primary, language)}
              </div>
            </div>

          {/* Growth System */}
          {(() => {
            const growthStage = getGrowthStage(result.primary, language);
            if (!growthStage) return null;

            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.05) 0%, rgba(139, 195, 74, 0.02) 100%)',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '2px solid rgba(127, 176, 105, 0.2)'
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  {language === 'ko' ? '🌱 성장 시스템' : '🌱 Growth System'}
                </h2>

                {/* Current Stage */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#7FB069',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    {language === 'ko' ? '현재 단계' : 'Current Stage'}
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    {growthStage.current[language]}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {growthStage.characteristics[language].map((char, idx) => (
                      <div key={idx} style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        paddingLeft: '1rem',
                        position: 'relative'
                      }}>
                        <span style={{
                          position: 'absolute',
                          left: '0',
                          color: '#7FB069'
                        }}>•</span>
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Growth Quests */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#7FB069',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    {language === 'ko' ? '성장 퀘스트' : 'Growth Quests'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#9ca3af',
                    marginBottom: '1rem'
                  }}>
                    {language === 'ko' ? '다음 단계로 나아가기 위한 실천' : 'Actions to move to the next stage'}
                  </div>
                  {growthStage.quests[language].map((quest, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '2px solid #7FB069',
                        marginRight: '0.75rem',
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      <span style={{
                        fontSize: '14px',
                        color: '#374151',
                        lineHeight: '1.5'
                      }}>
                        {quest}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Next Stage */}
                <div style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    {language === 'ko' ? '다음 단계' : 'Next Stage'}
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {growthStage.next[language]}
                  </div>
                </div>
              </div>
            );
          })()}

            {/* Compatible Type */}
            {result.secondary && (
              <div style={{
                background: '#f9fafb',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {language === 'ko' ? '잘 어울리는 유형' : 'Compatible Type'}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {getArchetypeName(result.secondary, language)}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {getArchetypeDescription(result.secondary, language)}
                </div>
              </div>
            )}
          </div>
          {/* End of Blurred Content Wrapper */}

          {/* Pro Upselling */}
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
            border: '2px solid #fed7aa'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#9a3412',
              marginBottom: '1rem'
            }}>
              💎 {language === 'ko' ? '더 깊은 성장을 위해' : 'For Deeper Growth'}
            </div>
            <p style={{
              fontSize: '15px',
              color: '#7c2d12',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              {language === 'ko'
                ? `당신의 유형인 ${getArchetypeName(result.primary, language)}에게 가장 필요한 어퍼메이션을 매일 아침 꿈에 맞춰 보내드립니다.`
                : `We'll send daily affirmations tailored to your ${getArchetypeName(result.primary, language)} archetype, matched with your dreams.`
              }
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.3)';
              }}
            >
              {language === 'ko' ? 'Novakitz Pro 알아보기' : 'Learn About Novakitz Pro'}
            </button>
          </div>

          {/* CTA Section */}
          {!isLoggedIn && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}>
                🌟 {language === 'ko' ? '더 깊은 분석을 원하시나요?' : 'Want deeper analysis?'}
              </div>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                {language === 'ko'
                  ? '가입하고 꿈 일기를 작성하면 AI가 더 정확한 무의식 프로파일을 만들어드립니다'
                  : 'Sign up and journal your dreams for a more accurate unconscious profile'}
              </p>
              <button
                onClick={handleSignUp}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
                }}
              >
                {language === 'ko' ? '무료로 시작하기' : 'Start for Free'}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => setShowShareCard(true)}
            style={{
              padding: '16px',
              background: 'white',
              color: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }}>
              <path
                d="M15 13V15C15 15.5304 14.7893 16.0391 14.4142 16.4142C14.0391 16.7893 13.5304 17 13 17H5C4.46957 17 3.96086 16.7893 3.58579 16.4142C3.21071 16.0391 3 15.5304 3 15V13M13 9L9 5M9 5L5 9M9 5V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {language === 'ko' ? '공유하기' : 'Share'}
          </button>
          <button
            onClick={handleRetake}
            style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#6b7280',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 {language === 'ko' ? '다시 테스트' : 'Retake Test'}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '13px'
        }}>
          <p>
            {language === 'ko'
              ? '이 테스트는 융의 12가지 아키타입 이론을 기반으로 합니다'
              : 'This test is based on Jung\'s 12 archetypes theory'}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>

      {/* Share Card Modal */}
      {showShareCard && (
        <ArchetypeShareCard
          archetypeName={getArchetypeName(result.primary, language)}
          tagline={getArchetypeTagline(result.primary, language)}
          primaryColor={primaryColor}
          darkColor={primaryDarkColor}
          language={language}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}
