'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface DreamInsightsProps {
  user: User;
  language?: 'en' | 'ko';
  onClose: () => void;
}

interface KeywordData {
  keyword: string;
  category: string;
  sentiment: string;
  count: number;
}

interface EmotionData {
  sentiment: string;
  count: number;
  percentage: number;
}

interface DreamStats {
  totalDreams: number;
  totalKeywords: number;
  topKeywords: KeywordData[];
  emotionDistribution: EmotionData[];
  categoryDistribution: { category: string; count: number }[];
  averageDreamsPerWeek: number;
  longestStreak: number;
}

const translations = {
  en: {
    title: 'Dream Insights',
    subtitle: 'Discover patterns in your dreams',
    loading: 'Analyzing your dreams...',
    noData: 'No dream data yet. Start recording your dreams to see insights!',
    totalDreams: 'Total Dreams',
    totalKeywords: 'Keywords Extracted',
    avgPerWeek: 'Dreams per Week',
    longestStreak: 'Longest Streak',
    topKeywords: 'Most Common Keywords',
    emotionDistribution: 'Emotional Patterns',
    categoryBreakdown: 'Dream Categories',
    recentPatterns: 'Recent Patterns',
    days: 'days',
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
    mixed: 'Mixed',
    emotion: 'Emotion',
    symbol: 'Symbol',
    person: 'Person',
    place: 'Place',
    action: 'Action',
    theme: 'Theme',
    close: 'Close'
  },
  ko: {
    title: '드림 인사이트',
    subtitle: '당신의 꿈 패턴을 발견하세요',
    loading: '꿈을 분석하는 중...',
    noData: '아직 꿈 데이터가 없어요. 꿈을 기록하고 인사이트를 확인하세요!',
    totalDreams: '총 꿈 기록',
    totalKeywords: '추출된 키워드',
    avgPerWeek: '주간 평균',
    longestStreak: '최장 연속 기록',
    topKeywords: '자주 나타나는 키워드',
    emotionDistribution: '감정 패턴',
    categoryBreakdown: '꿈 카테고리',
    recentPatterns: '최근 패턴',
    days: '일',
    positive: '긍정',
    negative: '부정',
    neutral: '중립',
    mixed: '복합',
    emotion: '감정',
    symbol: '상징',
    person: '인물',
    place: '장소',
    action: '행동',
    theme: '주제',
    close: '닫기'
  }
};

const sentimentColors = {
  positive: '#7FB069',
  negative: '#E07A5F',
  neutral: '#81B29A',
  mixed: '#F2CC8F'
};

const categoryColors = {
  emotion: '#7FB069',
  symbol: '#81B29A',
  person: '#F2CC8F',
  place: '#E07A5F',
  action: '#3D5A80',
  theme: '#98C1D9'
};

export default function DreamInsights({ user, language = 'en', onClose }: DreamInsightsProps) {
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DreamStats | null>(null);

  useEffect(() => {
    loadDreamInsights();
  }, [user.id]);

  const loadDreamInsights = async () => {
    try {
      setLoading(true);

      // Fetch total dreams count
      const { count: dreamCount } = await supabase
        .from('dreams')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch all keywords for this user
      const { data: keywordsData, error: keywordsError } = await supabase
        .from('dream_keywords')
        .select('keyword, category, sentiment')
        .eq('user_id', user.id);

      if (keywordsError) throw keywordsError;

      // Calculate keyword frequency
      const keywordFrequency: { [key: string]: KeywordData } = {};
      keywordsData?.forEach((kw) => {
        const key = kw.keyword.toLowerCase();
        if (keywordFrequency[key]) {
          keywordFrequency[key].count++;
        } else {
          keywordFrequency[key] = {
            keyword: kw.keyword,
            category: kw.category,
            sentiment: kw.sentiment,
            count: 1
          };
        }
      });

      // Top keywords
      const topKeywords = Object.values(keywordFrequency)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Emotion distribution
      const emotionCounts: { [key: string]: number } = {};
      keywordsData?.forEach((kw) => {
        if (kw.category === 'emotion') {
          emotionCounts[kw.sentiment] = (emotionCounts[kw.sentiment] || 0) + 1;
        }
      });

      const totalEmotions = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
      const emotionDistribution = Object.entries(emotionCounts).map(([sentiment, count]) => ({
        sentiment,
        count,
        percentage: Math.round((count / totalEmotions) * 100)
      }));

      // Category distribution
      const categoryCounts: { [key: string]: number } = {};
      keywordsData?.forEach((kw) => {
        categoryCounts[kw.category] = (categoryCounts[kw.category] || 0) + 1;
      });

      const categoryDistribution = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));

      // Fetch dreams with timestamps for streak calculation
      const { data: dreamsData } = await supabase
        .from('dreams')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Calculate average dreams per week
      let averageDreamsPerWeek = 0;
      if (dreamsData && dreamsData.length > 0) {
        const oldestDream = new Date(dreamsData[dreamsData.length - 1].created_at);
        const now = new Date();
        const weeksDiff = Math.max(1, (now.getTime() - oldestDream.getTime()) / (7 * 24 * 60 * 60 * 1000));
        averageDreamsPerWeek = Math.round((dreamsData.length / weeksDiff) * 10) / 10;
      }

      // Calculate longest streak
      let longestStreak = 0;
      let currentStreak = 0;
      if (dreamsData && dreamsData.length > 0) {
        const dates = dreamsData.map(d => new Date(d.created_at).toDateString());
        const uniqueDates = [...new Set(dates)].sort();

        for (let i = 0; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i]);
          const prevDate = i > 0 ? new Date(uniqueDates[i - 1]) : null;

          if (prevDate) {
            const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays === 1) {
              currentStreak++;
            } else {
              longestStreak = Math.max(longestStreak, currentStreak);
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      setStats({
        totalDreams: dreamCount || 0,
        totalKeywords: keywordsData?.length || 0,
        topKeywords,
        emotionDistribution,
        categoryDistribution,
        averageDreamsPerWeek,
        longestStreak
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dream insights:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
        }}>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalDreams === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '24px',
          maxWidth: '500px',
          textAlign: 'center',
          fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
        }}>
          <h2 style={{ color: '#7FB069', marginBottom: '1rem' }}>{t.title}</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>{t.noData}</p>
          <button
            onClick={onClose}
            style={{
              background: '#7FB069',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7FB069 0%, #5A8449 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '24px 24px 0 0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>{t.title}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>{t.subtitle}</p>
        </div>

        {/* Stats Cards */}
        <div style={{
          padding: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.totalDreams}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem' }}>{t.totalDreams}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.totalKeywords}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem' }}>{t.totalKeywords}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.averageDreamsPerWeek}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem' }}>{t.avgPerWeek}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.longestStreak}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem' }}>{t.longestStreak} {t.days}</div>
          </div>
        </div>

        {/* Top Keywords */}
        {stats.topKeywords.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.topKeywords}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.topKeywords.map((kw, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    minWidth: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: categoryColors[kw.category as keyof typeof categoryColors] || '#ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{kw.keyword}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {t[kw.category as keyof typeof t] as string} • {t[kw.sentiment as keyof typeof t] as string}
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    color: '#5A8449'
                  }}>
                    {kw.count}x
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotion Distribution */}
        {stats.emotionDistribution.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.emotionDistribution}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.emotionDistribution.map((emotion, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>{t[emotion.sentiment as keyof typeof t] as string}</span>
                    <span style={{ color: '#666' }}>{emotion.percentage}%</span>
                  </div>
                  <div style={{
                    height: '12px',
                    background: '#e8f5e8',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${emotion.percentage}%`,
                      background: sentimentColors[emotion.sentiment as keyof typeof sentimentColors] || '#ccc',
                      borderRadius: '6px',
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {stats.categoryDistribution.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.categoryBreakdown}</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {stats.categoryDistribution.map((cat, idx) => (
                <div key={idx} style={{
                  background: categoryColors[cat.category as keyof typeof categoryColors] || '#ccc',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {cat.count}
                  </div>
                  <div style={{ opacity: 0.9 }}>{t[cat.category as keyof typeof t] as string}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div style={{ padding: '0 2rem 2rem 2rem', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: '#7FB069',
              color: 'white',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5A8449';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#7FB069';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
