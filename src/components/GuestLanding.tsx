'use client';

import { useState } from 'react';

interface GuestLandingProps {
  language: 'en' | 'ko';
  onTryNow: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function GuestLanding({ language, onTryNow, onSignIn, onSignUp }: GuestLandingProps) {
  const t = {
    title: language === 'ko' ? 'Novakitz' : 'Novakitz',
    subtitle: language === 'ko'
      ? 'AI 기반 꿈 일기 & 융 심리학 분석'
      : 'AI Dream Journal & Jungian Analysis',
    description: language === 'ko'
      ? '당신의 꿈 속 숨겨진 메시지를 발견하세요.\n무의식의 패턴을 탐험하고 자기 성장을 경험하세요.'
      : 'Discover hidden messages in your dreams.\nExplore unconscious patterns and experience personal growth.',
    tryNow: language === 'ko' ? '지금 바로 체험하기' : 'Try Now - Free',
    tryNowSub: language === 'ko' ? '로그인 없이 1회 무료 분석' : 'One free analysis without signup',
    signIn: language === 'ko' ? '로그인' : 'Sign In',
    signUp: language === 'ko' ? '회원가입' : 'Sign Up',
    features: language === 'ko' ? [
      { icon: '🌙', title: 'AI 꿈 해석', desc: '융 심리학 기반 깊이 있는 분석' },
      { icon: '📊', title: '패턴 분석', desc: '반복되는 꿈 주제와 상징 추적' },
      { icon: '🔮', title: '아키타입 탐험', desc: '무의식의 원형 발견' },
    ] : [
      { icon: '🌙', title: 'AI Dream Analysis', desc: 'Deep Jungian psychology-based insights' },
      { icon: '📊', title: 'Pattern Tracking', desc: 'Track recurring themes & symbols' },
      { icon: '🔮', title: 'Archetype Discovery', desc: 'Explore your unconscious archetypes' },
    ],
    alreadyMember: language === 'ko' ? '이미 계정이 있으신가요?' : 'Already have an account?',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 50%, #e3f2fd 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: language === 'ko'
        ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif"
        : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Main Content */}
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #7FB069 0%, #9C27B0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            letterSpacing: '-1px'
          }}>
            {t.title}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#5a6c5a',
            fontWeight: '500'
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '1rem',
          color: '#666',
          lineHeight: '1.8',
          marginBottom: '2rem',
          whiteSpace: 'pre-line'
        }}>
          {t.description}
        </p>

        {/* Main CTA - Try Now */}
        <button
          onClick={onTryNow}
          style={{
            width: '100%',
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(127, 176, 105, 0.4)',
            transition: 'all 0.3s ease',
            marginBottom: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(127, 176, 105, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(127, 176, 105, 0.4)';
          }}
        >
          {t.tryNow}
        </button>
        <p style={{
          fontSize: '0.85rem',
          color: '#888',
          marginBottom: '2rem'
        }}>
          {t.tryNowSub}
        </p>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2.5rem'
        }}>
          {t.features.map((feature, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '1.2rem 0.8rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#333',
                marginBottom: '0.3rem'
              }}>
                {feature.title}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: '#666',
                lineHeight: '1.4'
              }}>
                {feature.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Sign In / Sign Up */}
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.1)',
          paddingTop: '1.5rem'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#888',
            marginBottom: '1rem'
          }}>
            {t.alreadyMember}
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={onSignIn}
              style={{
                padding: '12px 32px',
                background: 'white',
                color: '#7FB069',
                border: '2px solid #7FB069',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7FB069';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#7FB069';
              }}
            >
              {t.signIn}
            </button>
            <button
              onClick={onSignUp}
              style={{
                padding: '12px 32px',
                background: 'rgba(127, 176, 105, 0.1)',
                color: '#5a8a4a',
                border: '2px solid transparent',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
              }}
            >
              {t.signUp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
