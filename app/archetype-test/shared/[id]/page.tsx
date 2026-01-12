'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor
} from '../../../../src/lib/archetypes';
import ArchetypeTestNav from '../../../../src/components/ArchetypeTestNav';
import '../../../globals.css';

export default function SharedArchetypeResult() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [result, setResult] = useState<{
    primary_archetype: string;
    secondary_archetype: string | null;
    archetype_scores: Record<string, number>;
    dream_content: string;
    language: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      setLanguage('ko');
    } else {
      setLanguage('en');
    }

    loadSharedResult();
  }, [id]);

  const loadSharedResult = async () => {
    try {
      const response = await fetch(`/api/guest-results?id=${id}`);

      if (!response.ok) {
        setError('Result not found');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);

      // Use the language from the result if available
      if (data.language) {
        setLanguage(data.language);
      }
    } catch (err) {
      console.error('Error loading result:', err);
      setError('Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeTest = () => {
    // Clear any previous guest data
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    router.push('/archetype-test/guest-dream');
  };

  if (loading) {
    return (
      <>
        <ArchetypeTestNav language={language} onLanguageChange={setLanguage} />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <p style={{ fontSize: '18px', color: '#666' }}>
            {language === 'ko' ? '결과를 불러오는 중...' : 'Loading result...'}
          </p>
        </div>
      </>
    );
  }

  if (error || !result) {
    return (
      <>
        <ArchetypeTestNav language={language} onLanguageChange={setLanguage} />
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          padding: '2rem 1rem'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'white',
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '60px', marginBottom: '1rem' }}>😔</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              {language === 'ko' ? '결과를 찾을 수 없습니다' : 'Result Not Found'}
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '2rem'
            }}>
              {language === 'ko'
                ? '링크가 만료되었거나 올바르지 않습니다'
                : 'The link may have expired or is invalid'}
            </p>
            <button
              onClick={() => router.push('/archetype-test')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {language === 'ko' ? '홈으로 가기' : 'Go to Home'}
            </button>
          </div>
        </div>
      </>
    );
  }

  const primaryArchetype = result.primary_archetype;
  const secondaryArchetype = result.secondary_archetype;
  const primaryColor = getArchetypeColor(primaryArchetype);
  const darkColor = getArchetypeDarkColor(primaryArchetype);
  const traits = getArchetypeTraits(primaryArchetype, language);

  return (
    <>
      <ArchetypeTestNav language={language} onLanguageChange={setLanguage} />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 1rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Friend's Result Header */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '1rem' }}>👥</div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {language === 'ko'
                ? '친구의 무의식 아키타입 결과'
                : "Your Friend's Unconscious Archetype"}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {language === 'ko'
                ? '친구가 자신의 무의식을 당신과 공유했어요'
                : 'Your friend shared their unconscious profile with you'}
            </p>
          </div>

          {/* Primary Archetype Result */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${darkColor}08 100%)`,
            borderRadius: '24px',
            padding: '3rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `2px solid ${primaryColor}30`
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: `${primaryColor}20`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: darkColor,
                marginBottom: '1rem'
              }}>
                {language === 'ko' ? '주요 아키타입' : 'Primary Archetype'}
              </div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: darkColor,
                marginBottom: '1rem',
                fontFamily: "'Cormorant', serif"
              }}>
                {getArchetypeName(primaryArchetype, language)}
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#4b5563',
                lineHeight: '1.8'
              }}>
                {getArchetypeDescription(primaryArchetype, language)}
              </p>
            </div>

            {/* Traits */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                {language === 'ko' ? '주요 특성' : 'Key Traits'}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {traits.map((trait, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px 14px',
                      background: `${primaryColor}10`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: darkColor,
                      fontWeight: '500'
                    }}
                  >
                    {trait}
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Archetype */}
            {secondaryArchetype && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                marginTop: '1rem'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {language === 'ko' ? '부수 아키타입' : 'Secondary Archetype'}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: getArchetypeDarkColor(secondaryArchetype)
                }}>
                  {getArchetypeName(secondaryArchetype, language)}
                </div>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🌙</div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              fontFamily: "'Cormorant', serif"
            }}>
              {language === 'ko'
                ? '당신의 무의식 아키타입은 무엇일까요?'
                : 'What is Your Unconscious Archetype?'}
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              {language === 'ko'
                ? '친구가 발견한 것처럼, 당신도 자신의 진짜 자아를 발견해보세요. 단 3-5분이면 됩니다.'
                : 'Like your friend discovered, find your true self. Takes only 3-5 minutes.'}
            </p>

            <button
              onClick={handleTakeTest}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {language === 'ko' ? '무료로 테스트 시작하기' : 'Start Free Test'}
            </button>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                ✨ {language === 'ko' ? '12가지 융 아키타입 분석' : '12 Jungian archetypes'}<br />
                ⏱️ {language === 'ko' ? '소요 시간: 3-5분' : 'Takes 3-5 minutes'}<br />
                🔒 {language === 'ko' ? '로그인 불필요' : 'No login required'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
