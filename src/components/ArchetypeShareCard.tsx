'use client';

import { useRef } from 'react';

interface ArchetypeShareCardProps {
  archetypeName: string;
  tagline: string;
  primaryColor: string;
  darkColor: string;
  language: 'ko' | 'en';
  onClose: () => void;
  resultId?: string;
}

export default function ArchetypeShareCard({
  archetypeName,
  tagline,
  primaryColor,
  darkColor,
  language,
  onClose,
  resultId
}: ArchetypeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Clean archetype name (remove English part for Korean)
  const cleanName = language === 'ko' ? archetypeName.split(' (')[0] : archetypeName;

  // Generate share URL
  const shareUrl = resultId
    ? `${window.location.origin}/shared/archetype/${resultId}`
    : window.location.href;

  const shareText = language === 'ko'
    ? `${cleanName}\n${tagline}\n\n나의 무의식 아키타입을 발견했어요!`
    : `${cleanName}\n${tagline}\n\nI discovered my unconscious archetype!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      alert(language === 'ko' ? '링크가 복사되었습니다!' : 'Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert(language === 'ko' ? '복사 실패. 다시 시도해주세요.' : 'Failed to copy. Please try again.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '2rem 1rem',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      {/* Preview Card */}
      <div
        ref={cardRef}
        style={{
          width: '400px',
          maxWidth: '100%',
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkColor} 100%)`,
          borderRadius: '32px',
          padding: '3rem 2.5rem',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '32px',
          pointerEvents: 'none'
        }} />

        {/* Decorative Elements */}
        <svg
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            opacity: 0.15,
          }}
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
        >
          <circle cx="40" cy="40" r="35" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="40" cy="40" r="25" fill="white" fillOpacity="0.1" />
        </svg>

        <svg
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '2rem',
            opacity: 0.1,
          }}
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
        >
          <path
            d="M30 10 L40 25 L55 25 L42.5 35 L47.5 50 L30 40 L12.5 50 L17.5 35 L5 25 L20 25 Z"
            fill="white"
          />
        </svg>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="23" stroke="white" strokeWidth="2" opacity="0.9" />
            <path
              d="M25 12 C25 12, 35 20, 35 28 C35 33, 31 37, 25 37 C19 37, 15 33, 15 28 C15 20, 25 12, 25 12 Z"
              fill="white"
              opacity="1"
            />
            <circle cx="25" cy="26" r="4" fill="rgba(0,0,0,0.3)" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {language === 'ko' ? 'My Archetype' : 'My Archetype'}
          </div>

          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              lineHeight: '1.2',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.4)',
              fontFamily: '"S-Core Dream", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {cleanName}
          </div>

          <div
            style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'white',
              marginBottom: '2rem',
              lineHeight: '1.5',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {tagline}
          </div>

          {/* Decorative line */}
          <div
            style={{
              width: '60px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.8)',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '0.5rem',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            NovaKitz
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            {language === 'ko' ? '무의식 아키타입 테스트' : 'Unconscious Archetype Test'}
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={async () => {
            // Use Web Share API if available, otherwise copy to clipboard
            if (navigator.share) {
              try {
                await navigator.share({
                  title: cleanName,
                  text: shareText,
                  url: shareUrl
                });
              } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                  copyToClipboard();
                }
              }
            } else {
              copyToClipboard();
            }
          }}
          style={{
            padding: '1rem 2rem',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkColor} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
          onClick={copyToClipboard}
          style={{
            padding: '1rem 2rem',
            background: 'white',
            color: primaryColor,
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M13.5 3H16.5C16.7652 3 17.0196 3.10536 17.2071 3.29289C17.3946 3.48043 17.5 3.73478 17.5 4V16C17.5 16.2652 17.3946 16.5196 17.2071 16.7071C17.0196 16.8946 16.7652 17 16.5 17H13.5M10 14L14 10M14 10L10 6M14 10H2.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {language === 'ko' ? '링크 복사' : 'Copy Link'}
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {language === 'ko' ? '닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
}
