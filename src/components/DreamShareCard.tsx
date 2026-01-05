'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';

interface DreamShareCardProps {
  dreamTitle: string;
  dreamSummary: string;
  mood: string;
  keywords: string[];
  date: string;
  language?: 'en' | 'ko';
  onClose: () => void;
}

const translations = {
  en: {
    title: 'My Dream',
    mood: 'Mood',
    symbols: 'Symbols',
    recorded: 'Recorded',
    poweredBy: 'Dream journaling with',
    download: 'Download Image',
    share: 'Share',
    close: 'Close',
    copied: 'Link copied!'
  },
  ko: {
    title: '나의 꿈',
    mood: '기분',
    symbols: '상징',
    recorded: '기록일',
    poweredBy: '꿈 기록',
    download: '이미지 저장',
    share: '공유하기',
    close: '닫기',
    copied: '링크 복사됨!'
  }
};

const moodColors = {
  peaceful: ['#7FB069', '#A8D5A8'],
  anxious: ['#E07A5F', '#F4A261'],
  joyful: ['#F2CC8F', '#FFD93D'],
  mysterious: ['#81B29A', '#98C1D9'],
  neutral: ['#9CA3AF', '#D1D5DB']
};

const moodEmojis = {
  peaceful: '🌙',
  anxious: '😰',
  joyful: '✨',
  mysterious: '🔮',
  neutral: '😌'
};

export default function DreamShareCard({
  dreamTitle,
  dreamSummary,
  mood,
  keywords,
  date,
  language = 'ko',
  onClose
}: DreamShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const moodKey = mood.toLowerCase() as keyof typeof moodColors;
  const colors = moodColors[moodKey] || moodColors.neutral;
  const emoji = moodEmojis[moodKey] || moodEmojis.neutral;

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `dream-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShare = async () => {
    const shareText = language === 'ko'
      ? `${dreamTitle}\n\n${dreamSummary}\n\n✨ Novakitz에서 꿈을 기록하세요`
      : `${dreamTitle}\n\n${dreamSummary}\n\n✨ Track your dreams with Novakitz`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: dreamTitle,
          text: shareText,
          url: 'https://novakitz.com'
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert(t.copied);
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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '2rem',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxWidth: '500px',
          width: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Preview */}
        <div
          ref={cardRef}
          style={{
            background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            color: 'white',
            fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Elements */}
          <div
            style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              filter: 'blur(40px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              filter: 'blur(30px)'
            }}
          />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  opacity: 0.9,
                  fontWeight: '500'
                }}
              >
                {t.title}
              </div>
              <div style={{ fontSize: '2rem' }}>{emoji}</div>
            </div>

            {/* Dream Title */}
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                lineHeight: 1.3,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              {dreamTitle}
            </h2>

            {/* Dream Summary */}
            <p
              style={{
                fontSize: '1rem',
                lineHeight: 1.6,
                opacity: 0.95,
                marginBottom: '2rem',
                maxHeight: '4.8em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {dreamSummary}
            </p>

            {/* Mood & Keywords */}
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}
              >
                {t.mood}: {mood}
              </div>

              {keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    {t.symbols}:
                  </span>
                  {keywords.slice(0, 4).map((keyword, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {t.recorded}: {new Date(date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}
              </div>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  opacity: 0.9
                }}
              >
                Novakitz
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
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
            📥 {t.download}
          </button>

          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #7FB069',
              background: 'white',
              color: '#7FB069',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            🔗 {t.share}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: '#f3f4f6',
              color: '#6b7280',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
