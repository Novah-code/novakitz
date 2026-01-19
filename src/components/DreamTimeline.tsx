'use client';

import { useState } from 'react';

interface DreamEntry {
  id: string;
  title?: string;
  text: string;
  date: string;
  tags?: string[];
  autoTags?: string[];
  analysis?: string;
}

interface DreamTimelineProps {
  dreams: DreamEntry[];
  onDreamClick?: (dream: DreamEntry) => void;
  language?: 'en' | 'ko';
}

const translations = {
  en: {
    title: 'Dream Timeline',
    noDreams: 'No dreams recorded yet',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    weeksAgo: 'weeks ago',
    monthsAgo: 'months ago',
    viewDetails: 'View Details'
  },
  ko: {
    title: '꿈 타임라인',
    noDreams: '아직 기록된 꿈이 없습니다',
    today: '오늘',
    yesterday: '어제',
    daysAgo: '일 전',
    weeksAgo: '주 전',
    monthsAgo: '개월 전',
    viewDetails: '자세히 보기'
  }
};

// Mood detection from tags
function deriveMoodFromTags(tags: string[]): 'peaceful' | 'anxious' | 'joyful' | 'mysterious' | 'neutral' {
  const tagString = tags.join(' ').toLowerCase();

  if (tagString.includes('peaceful') || tagString.includes('calm') || tagString.includes('serene') ||
      tagString.includes('평화') || tagString.includes('고요') || tagString.includes('차분')) {
    return 'peaceful';
  }
  if (tagString.includes('anxious') || tagString.includes('fear') || tagString.includes('scared') ||
      tagString.includes('불안') || tagString.includes('두려') || tagString.includes('걱정')) {
    return 'anxious';
  }
  if (tagString.includes('joyful') || tagString.includes('happy') || tagString.includes('excited') ||
      tagString.includes('기쁨') || tagString.includes('행복') || tagString.includes('즐거')) {
    return 'joyful';
  }
  if (tagString.includes('mysterious') || tagString.includes('strange') || tagString.includes('surreal') ||
      tagString.includes('신비') || tagString.includes('이상') || tagString.includes('묘한')) {
    return 'mysterious';
  }
  return 'neutral';
}

const moodColors = {
  peaceful: { primary: '#7FB069', secondary: '#A8D5A8', bg: '#E8F5E8' },
  anxious: { primary: '#E07A5F', secondary: '#F4A261', bg: '#FFE8E0' },
  joyful: { primary: '#F2CC8F', secondary: '#FFD93D', bg: '#FFF9E6' },
  mysterious: { primary: '#81B29A', secondary: '#98C1D9', bg: '#E8F3F5' },
  neutral: { primary: '#9CA3AF', secondary: '#D1D5DB', bg: '#F3F4F6' }
};

const moodEmojis = {
  peaceful: '●',
  anxious: '●',
  joyful: '●',
  mysterious: '●',
  neutral: '●'
};

function getRelativeTime(date: string, language: 'en' | 'ko'): string {
  const t = translations[language];
  const dreamDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dreamDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t.today;
  if (diffDays === 1) return t.yesterday;
  if (diffDays < 7) return `${diffDays}${t.daysAgo}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}${t.weeksAgo}`;
  return `${Math.floor(diffDays / 30)}${t.monthsAgo}`;
}

export default function DreamTimeline({
  dreams,
  onDreamClick,
  language = 'ko'
}: DreamTimelineProps) {
  const [selectedDream, setSelectedDream] = useState<string | null>(null);
  const t = translations[language];

  // Sort dreams by date (newest first) - using toSorted for immutability
  const sortedDreams = dreams.toSorted((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDreamClick = (dream: DreamEntry) => {
    setSelectedDream(dream.id);
    if (onDreamClick) {
      onDreamClick(dream);
    }
  };

  if (dreams.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
          fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💭</div>
        <div style={{ fontSize: '1.1rem' }}>{t.noDreams}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem 1rem',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: '#374151',
          textAlign: 'center'
        }}
      >
        {t.title}
      </h2>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '20px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, #7FB069, #E5E7EB)',
            zIndex: 0
          }}
        />

        {/* Dream entries */}
        {sortedDreams.map((dream, index) => {
          const allTags = [...(dream.autoTags || []), ...(dream.tags || [])];
          const mood = deriveMoodFromTags(allTags);
          const colors = moodColors[mood];
          const emoji = moodEmojis[mood];
          const isSelected = selectedDream === dream.id;

          return (
            <div
              key={dream.id}
              style={{
                position: 'relative',
                marginBottom: '2.5rem',
                paddingLeft: '60px',
                animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '10px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: colors.primary,
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem'
                }}
              >
                {emoji}
              </div>

              {/* Dream card */}
              <div
                onClick={() => handleDreamClick(dream)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: isSelected
                    ? `0 8px 24px ${colors.primary}40`
                    : '0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: isSelected
                    ? `2px solid ${colors.primary}`
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Decorative gradient */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
                  }}
                />

                {/* Date & relative time */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: colors.primary
                    }}
                  >
                    {getRelativeTime(dream.date, language)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}
                  >
                    {new Date(dream.date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}
                  </div>
                </div>

                {/* Dream title */}
                {dream.title && (
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem',
                      color: '#1f2937'
                    }}
                  >
                    {dream.title}
                  </h3>
                )}

                {/* Dream text preview */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: '#6b7280',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {dream.text}
                </p>

                {/* Tags */}
                {allTags.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '1rem'
                    }}
                  >
                    {allTags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: colors.bg,
                          color: colors.primary,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                    {allTags.length > 4 && (
                      <span
                        style={{
                          color: '#9ca3af',
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.5rem'
                        }}
                      >
                        +{allTags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
