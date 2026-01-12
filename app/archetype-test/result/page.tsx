'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateArchetypeFromQuiz } from '../../../src/lib/archetypeQuiz';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor
} from '../../../src/lib/archetypes';
import { supabase } from '../../../src/lib/supabase';
import ArchetypeTestNav from '../../../src/components/ArchetypeTestNav';
import '../../globals.css';

export default function ArchetypeResult() {
  const router = useRouter();
  const [language] = useState<'ko' | 'en'>('ko');
  const [result, setResult] = useState<{
    primary: string;
    secondary: string | null;
    scores: Record<string, number>;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);

  useEffect(() => {
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

    const shareText = language === 'ko'
      ? `나의 무의식 아키타입은 "${getArchetypeName(result!.primary, language)}"! 당신도 테스트해보세요!`
      : `My unconscious archetype is "${getArchetypeName(result!.primary, language)}"! Take the test too!`;

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
    router.push('/archetype-test');
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
      <ArchetypeTestNav language={language} />
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        padding: '2rem 1rem'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Celebration Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontFamily: "'Cormorant', serif"
          }}>
            {language === 'ko' ? '당신의 아키타입이 밝혀졌습니다!' : 'Your Archetype Revealed!'}
          </h1>
        </div>

        {/* Result Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
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
              marginBottom: '1rem'
            }}>
              {getArchetypeName(result.primary, language)}
            </div>
            <div style={{
              fontSize: '16px',
              color: '#4b5563',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              {getArchetypeDescription(result.primary, language)}
            </div>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {getArchetypeTraits(result.primary, language).map((trait, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#4b5563',
                    fontWeight: '500'
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Secondary Archetype */}
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
                {language === 'ko' ? '당신의 부 아키타입' : 'Your Secondary Archetype'}
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

          {/* Insights */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              💡 {language === 'ko' ? '이런 특징이 있어요' : 'Key Insights'}
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.8'
            }}>
              {result.primary === 'explorer' && (
                <>
                  <li>{language === 'ko' ? '새로운 경험과 자유를 추구합니다' : 'Seeks new experiences and freedom'}</li>
                  <li>{language === 'ko' ? '변화와 모험을 두려워하지 않습니다' : 'Embraces change and adventure'}</li>
                  <li>{language === 'ko' ? '독립적이고 자율적인 삶을 선호합니다' : 'Values independence and autonomy'}</li>
                </>
              )}
              {result.primary === 'sage' && (
                <>
                  <li>{language === 'ko' ? '진실과 지혜를 추구합니다' : 'Seeks truth and wisdom'}</li>
                  <li>{language === 'ko' ? '분석적이고 통찰력 있는 사고를 합니다' : 'Thinks analytically and insightfully'}</li>
                  <li>{language === 'ko' ? '지식과 이해를 통해 성장합니다' : 'Grows through knowledge and understanding'}</li>
                </>
              )}
              {result.primary === 'innocent' && (
                <>
                  <li>{language === 'ko' ? '순수함과 낙관성을 유지합니다' : 'Maintains purity and optimism'}</li>
                  <li>{language === 'ko' ? '안정과 안전을 중요하게 여깁니다' : 'Values stability and safety'}</li>
                  <li>{language === 'ko' ? '단순하고 진실된 삶을 추구합니다' : 'Seeks a simple and authentic life'}</li>
                </>
              )}
              {result.primary === 'orphan' && (
                <>
                  <li>{language === 'ko' ? '현실적이고 실용적인 사고를 합니다' : 'Thinks realistically and practically'}</li>
                  <li>{language === 'ko' ? '공감 능력이 뛰어납니다' : 'Has strong empathy'}</li>
                  <li>{language === 'ko' ? '평등과 정의를 중요하게 여깁니다' : 'Values equality and justice'}</li>
                </>
              )}
              {result.primary === 'warrior' && (
                <>
                  <li>{language === 'ko' ? '용기와 결단력이 있습니다' : 'Shows courage and determination'}</li>
                  <li>{language === 'ko' ? '목표 지향적이고 집중력이 강합니다' : 'Goal-oriented with strong focus'}</li>
                  <li>{language === 'ko' ? '도전을 즐기고 극복합니다' : 'Enjoys and overcomes challenges'}</li>
                </>
              )}
              {result.primary === 'caregiver' && (
                <>
                  <li>{language === 'ko' ? '타인을 돌보고 보호합니다' : 'Cares for and protects others'}</li>
                  <li>{language === 'ko' ? '이타적이고 희생적입니다' : 'Altruistic and self-sacrificing'}</li>
                  <li>{language === 'ko' ? '따뜻함과 공감을 제공합니다' : 'Provides warmth and empathy'}</li>
                </>
              )}
              {result.primary === 'lover' && (
                <>
                  <li>{language === 'ko' ? '열정과 친밀감을 추구합니다' : 'Seeks passion and intimacy'}</li>
                  <li>{language === 'ko' ? '관계와 연결을 중요하게 여깁니다' : 'Values relationships and connections'}</li>
                  <li>{language === 'ko' ? '아름다움과 감각을 즐깁니다' : 'Enjoys beauty and sensuality'}</li>
                </>
              )}
              {result.primary === 'jester' && (
                <>
                  <li>{language === 'ko' ? '유머와 즐거움을 추구합니다' : 'Seeks humor and joy'}</li>
                  <li>{language === 'ko' ? '창의적이고 자유로운 표현을 합니다' : 'Expresses creatively and freely'}</li>
                  <li>{language === 'ko' ? '현재를 즐기며 살아갑니다' : 'Lives in and enjoys the present'}</li>
                </>
              )}
              {result.primary === 'creator' && (
                <>
                  <li>{language === 'ko' ? '창조와 혁신을 추구합니다' : 'Pursues creation and innovation'}</li>
                  <li>{language === 'ko' ? '상상력이 풍부합니다' : 'Has rich imagination'}</li>
                  <li>{language === 'ko' ? '독창적인 결과물을 만듭니다' : 'Creates original outcomes'}</li>
                </>
              )}
              {result.primary === 'ruler' && (
                <>
                  <li>{language === 'ko' ? '리더십과 통제력이 있습니다' : 'Shows leadership and control'}</li>
                  <li>{language === 'ko' ? '조직과 질서를 중요하게 여깁니다' : 'Values organization and order'}</li>
                  <li>{language === 'ko' ? '책임감이 강합니다' : 'Has strong sense of responsibility'}</li>
                </>
              )}
              {result.primary === 'magician' && (
                <>
                  <li>{language === 'ko' ? '변화와 변혁을 일으킵니다' : 'Brings change and transformation'}</li>
                  <li>{language === 'ko' ? '비전과 통찰력이 있습니다' : 'Has vision and insight'}</li>
                  <li>{language === 'ko' ? '가능성을 현실로 만듭니다' : 'Turns possibilities into reality'}</li>
                </>
              )}
              {result.primary === 'outlaw' && (
                <>
                  <li>{language === 'ko' ? '규칙과 관습에 도전합니다' : 'Challenges rules and conventions'}</li>
                  <li>{language === 'ko' ? '독립적이고 반항적입니다' : 'Independent and rebellious'}</li>
                  <li>{language === 'ko' ? '변화를 위해 싸웁니다' : 'Fights for change'}</li>
                </>
              )}
            </ul>
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
          gridTemplateColumns: isLoggedIn ? '1fr' : '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              padding: '16px',
              background: 'white',
              color: '#1f2937',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            📤 {sharing
              ? (language === 'ko' ? '공유 중...' : 'Sharing...')
              : (language === 'ko' ? '친구에게 공유하기' : 'Share with Friends')}
          </button>
          {!isLoggedIn && (
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
          )}
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
    </>
  );
}
