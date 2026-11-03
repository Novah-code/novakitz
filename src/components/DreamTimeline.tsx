'use client';

import { useState } from 'react';
import { EMOTIONS } from '../lib/emotions';
import { dedupeTags } from '../lib/tags';

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

/*
 * A morning record is stored as "[감정 기록] 감정: … 장소: … 핵심 장면: …", with an
 * 'emotion-record' tag. The timeline printed that text and tag as they are.
 * This reads the record the way the journal view does: the scene (or the sleep
 * and stress lines) as the preview, the chosen pebble as the dot, no internal tag.
 */
function readMoodRecord(dream: DreamEntry) {
  const tags = [...(dream.autoTags || []), ...(dream.tags || [])];
  if (!tags.includes('emotion-record') && !(dream.text ?? '').startsWith('[감정 기록]')) return null;
  const clean = (dream.text ?? '').replace(/^\[감정 기록\] /, '').split('\n\n---\n\n')[0];
  const lines = clean.split('\n');
  const after = (k: string) => lines.find((l) => l.startsWith(k))?.slice(k.length).trim() ?? '';
  const sceneStart = lines.findIndex((l) => l.startsWith('핵심 장면:'));
  const scene = sceneStart >= 0 ? lines.slice(sceneStart).join(' ').slice('핵심 장면:'.length).trim() : '';
  const feelings = [after('수면:'), after('스트레스:')].filter(Boolean).join(' · ');
  const emotionLabel = tags.find((tg) => tg !== 'emotion-record') ?? after('감정:');
  const emotion = EMOTIONS.find((e) => e.en === emotionLabel || e.ko === emotionLabel);
  return {
    preview: scene || feelings || clean.split('\n').filter((l) => !l.startsWith('감정:')).join(' ').trim(),
    emotion,
    tags: dedupeTags(tags.filter((tg) => tg !== 'emotion-record')),
  };
}

const INK = '#2E3C33';
const PINK = '#EDA3BC';

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
      <div style={{ padding: '3rem', textAlign: 'center', color: '#7d8f82', fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif" }}>
        <div style={{ fontSize: '1.1rem' }}>{t.noDreams}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0 2rem', maxWidth: '900px', margin: '0 auto', fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif", color: INK }}>
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, rgba(237,163,188,0.6), rgba(46,60,51,0.08))', zIndex: 0 }} />

        {sortedDreams.map((dream, index) => {
          const mood = readMoodRecord(dream);
          const allTags = mood ? mood.tags : dedupeTags([...(dream.autoTags || []), ...(dream.tags || [])]);
          const isSelected = selectedDream === dream.id;
          const title = mood ? (language === 'ko' ? '오늘의 기분' : "Today's Mood") : dream.title;
          const preview = mood ? mood.preview : dream.text;

          return (
            <div key={dream.id} style={{ position: 'relative', marginBottom: '1.5rem', paddingLeft: '52px', animation: `slideIn 0.5s ease-out ${index * 0.08}s both` }}>
              {/* Timeline dot: the pebble for a morning, a pink dot for a dream */}
              <div
                style={{
                  position: 'absolute', left: mood?.emotion ? '4px' : '10px', top: '18px',
                  width: mood?.emotion ? '32px' : '20px', height: mood?.emotion ? '32px' : '20px',
                  borderRadius: mood?.emotion ? mood.emotion.borderRadius : '50%',
                  background: mood?.emotion ? mood.emotion.color : PINK,
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(40,60,45,0.12)', zIndex: 1,
                }}
              />

              <div
                onClick={() => handleDreamClick(dream)}
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
                  backdropFilter: 'blur(22px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                  borderRadius: '24px',
                  padding: '18px 20px',
                  border: isSelected ? `1.5px solid ${PINK}` : '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 8px 24px rgba(40,60,45,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, fontWeight: 700, color: '#7d8f82', textTransform: 'uppercase' }}>
                    {getRelativeTime(dream.date, language)}
                  </div>
                  <div style={{ fontSize: 12, color: '#7d8f82' }}>
                    {new Date(dream.date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}
                  </div>
                </div>

                {title && (
                  <h3 style={{ fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : 'var(--font-display), Georgia, serif', fontSize: language === 'ko' ? 18 : 24, fontWeight: language === 'ko' ? 500 : 400, margin: '0 0 8px', color: INK, lineHeight: 1.2 }}>
                    {title}
                  </h3>
                )}

                <p style={{ fontSize: 15, lineHeight: 1.65, color: '#4A5D4E', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {preview}
                </p>

                {allTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {allTags.slice(0, 4).map((tag, idx) => (
                      <span key={idx} style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', color: '#4A5D4E', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                        #{tag}
                      </span>
                    ))}
                    {allTags.length > 4 && (
                      <span style={{ color: '#7d8f82', fontSize: 12, padding: '4px 4px' }}>+{allTags.length - 4}</span>
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
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
