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

  const shareToSocial = (platform: 'instagram' | 'tiktok' | 'kakao' | 'twitter') => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'instagram':
        // Instagram doesn't support direct sharing via URL, so we copy to clipboard
        copyToClipboard();
        alert(language === 'ko'
          ? '링크가 복사되었습니다! 인스타그램 앱을 열어서 붙여넣기 해주세요.'
          : 'Link copied! Please open Instagram app and paste it.');
        break;

      case 'tiktok':
        // TikTok doesn't support direct web sharing, copy to clipboard
        copyToClipboard();
        alert(language === 'ko'
          ? '링크가 복사되었습니다! 틱톡 앱을 열어서 붙여넣기 해주세요.'
          : 'Link copied! Please open TikTok app and paste it.');
        break;

      case 'kakao':
        // KakaoTalk sharing
        if (typeof window !== 'undefined' && (window as any).Kakao) {
          (window as any).Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: cleanName,
              description: tagline,
              imageUrl: `${window.location.origin}/og-image.png`,
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
            buttons: [
              {
                title: language === 'ko' ? '결과 보기' : 'View Result',
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            ],
          });
        } else {
          // Fallback to web share or copy
          copyToClipboard();
        }
        break;

      case 'twitter':
        // Twitter/X sharing
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
          '_blank',
          'width=550,height=420'
        );
        break;
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          <button
            onClick={() => shareToSocial('instagram')}
            style={{
              padding: '1rem',
              background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
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
            Instagram
          </button>

          <button
            onClick={() => shareToSocial('tiktok')}
            style={{
              padding: '1rem',
              background: '#000000',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
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
            TikTok
          </button>

          <button
            onClick={() => shareToSocial('kakao')}
            style={{
              padding: '1rem',
              background: '#FEE500',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
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
            {language === 'ko' ? '카카오톡' : 'KakaoTalk'}
          </button>

          <button
            onClick={() => shareToSocial('twitter')}
            style={{
              padding: '1rem',
              background: '#1DA1F2',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
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
            Twitter
          </button>
        </div>

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
