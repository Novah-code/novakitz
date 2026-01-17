'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';

interface ArchetypeShareCardProps {
  archetypeName: string;
  tagline: string;
  primaryColor: string;
  darkColor: string;
  language: 'ko' | 'en';
  onClose: () => void;
}

export default function ArchetypeShareCard({
  archetypeName,
  tagline,
  primaryColor,
  darkColor,
  language,
  onClose
}: ArchetypeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `novakitz-archetype-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const shareImage = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'archetype.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: language === 'ko' ? '나의 무의식 아키타입' : 'My Unconscious Archetype',
              text: language === 'ko'
                ? `${archetypeName}\n${tagline}`
                : `${archetypeName}\n${tagline}`
            });
          } catch (err) {
            console.log('Share cancelled', err);
          }
        } else {
          await downloadImage();
        }
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Clean archetype name (remove English part for Korean)
  const cleanName = language === 'ko' ? archetypeName.split(' (')[0] : archetypeName;

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
      {/* Share Card */}
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="23" stroke="white" strokeWidth="2" opacity="0.6" />
            <path
              d="M25 12 C25 12, 35 20, 35 28 C35 33, 31 37, 25 37 C19 37, 15 33, 15 28 C15 20, 25 12, 25 12 Z"
              fill="white"
              opacity="0.9"
            />
            <circle cx="25" cy="26" r="4" fill="rgba(0,0,0,0.2)" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
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
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            {cleanName}
          </div>

          <div
            style={{
              fontSize: '16px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.95)',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}
          >
            {tagline}
          </div>

          {/* Decorative line */}
          <div
            style={{
              width: '60px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.4)',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem',
            }}
          >
            NovaKitz
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '400',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {language === 'ko' ? '무의식 아키타입 테스트' : 'Unconscious Archetype Test'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={shareImage}
          style={{
            padding: '1rem 2rem',
            background: 'white',
            color: primaryColor,
            border: 'none',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
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
          onClick={downloadImage}
          style={{
            padding: '1rem 2rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 13V5M10 13L7 10M10 13L13 10M4 17H16C16.5304 17 17.0391 16.7893 17.4142 16.4142C17.7893 16.0391 18 15.5304 18 15V5C18 4.46957 17.7893 3.96086 17.4142 3.58579C17.0391 3.21071 16.5304 3 16 3H4C3.46957 3 2.96086 3.21071 2.58579 3.58579C2.21071 3.96086 2 4.46957 2 5V15C2 15.5304 2.21071 16.0391 2.58579 16.4142C2.96086 16.7893 3.46957 17 4 17Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {language === 'ko' ? '다운로드' : 'Download'}
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
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

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
