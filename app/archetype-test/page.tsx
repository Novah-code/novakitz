'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import ArchetypeTestNav from '../../src/components/ArchetypeTestNav';
import '../globals.css';

export default function ArchetypeTestLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setLoading(false);
  };

  const startGuestTest = () => {
    // Clear any previous guest data
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    router.push('/archetype-test/guest-dream');
  };

  const goToProfileTest = () => {
    // If logged in, check if they have enough dreams for profile
    router.push('/profile');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <ArchetypeTestNav language={language} onLanguageChange={setLanguage} />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '60px', marginBottom: '1rem' }}>🌙</div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            fontFamily: "'Cormorant', serif"
          }}>
            {language === 'ko' ? '나의 무의식 아키타입 찾기' : 'Discover Your Unconscious Archetype'}
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            {language === 'ko'
              ? '간단한 꿈 하나와 8개의 질문으로 당신의 무의식 속 진짜 자아를 발견하세요'
              : 'Discover your true self through one dream and 8 simple questions'}
          </p>
        </div>

        {/* Features */}
        <div style={{
          background: '#f9fafb',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>✨</span>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '12가지 융 아키타입 분석' : '12 Jungian archetypes analysis'}
            </span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🎨</span>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '개인화된 무의식 프로파일' : 'Personalized unconscious profile'}
            </span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📤</span>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '친구와 결과 공유하기' : 'Share results with friends'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>⏱️</span>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '소요 시간: 약 3-5분' : 'Takes only 3-5 minutes'}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        {!isLoggedIn ? (
          <>
            <button
              onClick={startGuestTest}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '1rem',
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
              {language === 'ko' ? '무료로 시작하기' : 'Start for Free'}
            </button>
            <p style={{
              fontSize: '13px',
              color: '#9ca3af',
              marginTop: '1rem'
            }}>
              {language === 'ko'
                ? '로그인 없이 바로 시작할 수 있어요'
                : 'No login required to start'}
            </p>
          </>
        ) : (
          <>
            <button
              onClick={goToProfileTest}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
              }}
            >
              {language === 'ko' ? '내 프로파일 보기' : 'View My Profile'}
            </button>
            <button
              onClick={startGuestTest}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                color: '#7FB069',
                border: '2px solid #7FB069',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {language === 'ko' ? '퀵 테스트 하기' : 'Quick Test'}
            </button>
          </>
        )}

        {/* Language Toggle */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#6b7280',
              cursor: 'pointer'
            }}
          >
            {language === 'ko' ? 'English' : '한국어'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
