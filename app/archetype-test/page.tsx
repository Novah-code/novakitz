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
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setLoading(false);
  };

  const handleLanguageChange = (newLang: 'ko' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('test_language', newLang);
  };

  const startGuestTest = () => {
    // Clear any previous guest data
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    // Save language preference
    localStorage.setItem('test_language', language);
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
      <ArchetypeTestNav language={language} onLanguageChange={handleLanguageChange} />
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
        {/* Language Toggle - Top */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            background: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px'
          }}>
            <button
              onClick={() => handleLanguageChange('ko')}
              style={{
                padding: '8px 16px',
                background: language === 'ko' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: language === 'ko' ? '600' : '400',
                color: language === 'ko' ? '#1f2937' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: language === 'ko' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              한국어
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              style={{
                padding: '8px 16px',
                background: language === 'en' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: language === 'en' ? '600' : '400',
                color: language === 'en' ? '#1f2937' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: language === 'en' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              English
            </button>
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 5C20 5 12 15 12 25C12 35 20 45 30 55C40 45 48 35 48 25C48 15 40 5 30 5Z" fill="#7FB069" opacity="0.2"/>
              <path d="M30 10C22 10 16 18 16 26C16 34 22 42 30 50C38 42 44 34 44 26C44 18 38 10 30 10Z" fill="#7FB069"/>
              <circle cx="25" cy="24" r="2" fill="white"/>
              <circle cx="35" cy="24" r="2" fill="white"/>
              <path d="M22 30C24 32 26 33 30 33C34 33 36 32 38 30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem',
            fontFamily: "'Cormorant', serif"
          }}>
            {language === 'ko' ? '나의 무의식 아키타입 찾기' : 'Discover Your Unconscious Archetype'}
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#7FB069',
            fontWeight: '600',
            marginBottom: '0.5rem',
            lineHeight: '1.4'
          }}>
            {language === 'ko'
              ? '당신의 꿈은 이미 당신이 누구인지 알고 있습니다.'
              : 'Your dreams already know who you are.'}
          </p>
          <p style={{
            fontSize: '15px',
            color: '#9ca3af',
            marginBottom: '1rem'
          }}>
            {language === 'ko'
              ? '직관으로 가장 끌리는 선택지를 골라주세요'
              : 'Choose the option that resonates with your intuition'}
          </p>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            {language === 'ko'
              ? '간단한 꿈 하나와 15개의 질문으로 당신의 무의식 속 진짜 자아를 발견하세요'
              : 'Discover your true self through one dream and 15 simple questions'}
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
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M10 2L11.5 7L16 7.5L12 11L13 16L10 13.5L7 16L8 11L4 7.5L8.5 7L10 2Z" fill="#7FB069"/>
            </svg>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '12가지 융 아키타입 분석' : '12 Jungian archetypes analysis'}
            </span>
          </div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <rect x="3" y="3" width="14" height="14" rx="2" fill="#7FB069" opacity="0.3"/>
              <circle cx="7" cy="7" r="2" fill="#7FB069"/>
              <circle cx="13" cy="13" r="2" fill="#7FB069"/>
              <path d="M7 9L13 11" stroke="#7FB069" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '개인화된 무의식 프로파일' : 'Personalized unconscious profile'}
            </span>
          </div>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M3 10L8 5L12 9L17 4" stroke="#7FB069" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13 4H17V8" stroke="#7FB069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: '14px', color: '#4b5563' }}>
              {language === 'ko' ? '친구와 결과 공유하기' : 'Share results with friends'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <circle cx="10" cy="10" r="8" stroke="#7FB069" strokeWidth="2"/>
              <path d="M10 6V10L13 13" stroke="#7FB069" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
      </div>
    </div>
    </>
  );
}
