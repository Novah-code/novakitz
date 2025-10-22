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
  moodDistribution: { mood: string; count: number; percentage: number }[];
  monthlyDistribution: { month: string; count: number }[];
  averageLength: number;
  longestDream: number;
  shortestDream: number;
  topTags: { tag: string; count: number }[];
  currentStreak: number;
}

const translations = {
  en: {
    title: 'Dream Insights',
    subtitle: 'Discover patterns in your dreams',
    loading: 'Analyzing your dreams...',
    noData: 'No dream data yet. Start recording your dreams to see insights!',
    minRecords: 'Record at least 5 dreams to see detailed insights',
    totalDreams: 'Total Dreams',
    totalKeywords: 'Keywords Extracted',
    avgPerWeek: 'Dreams per Week',
    longestStreak: 'Longest Streak',
    currentStreak: 'Current Streak',
    avgLength: 'Average Length',
    longestDream: 'Longest Dream',
    shortestDream: 'Shortest Dream',
    characters: 'characters',
    topKeywords: 'Most Common Keywords',
    emotionDistribution: 'Emotional Patterns',
    categoryBreakdown: 'Dream Categories',
    moodDistribution: 'Mood Distribution',
    monthlyTrends: 'Monthly Trends',
    topTags: 'Popular Tags',
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
    peaceful: 'Peaceful',
    anxious: 'Anxious',
    joyful: 'Joyful',
    mysterious: 'Mysterious',
    close: 'Close'
  },
  ko: {
    title: '드림 인사이트',
    subtitle: '당신의 꿈 패턴을 발견하세요',
    loading: '꿈을 분석하는 중...',
    noData: '아직 꿈 데이터가 없어요. 꿈을 기록하고 인사이트를 확인하세요!',
    minRecords: '자세한 인사이트를 보려면 최소 5개의 꿈을 기록하세요',
    totalDreams: '총 꿈 기록',
    totalKeywords: '추출된 키워드',
    avgPerWeek: '주간 평균',
    longestStreak: '최장 연속',
    currentStreak: '현재 연속',
    avgLength: '평균 길이',
    longestDream: '가장 긴 꿈',
    shortestDream: '가장 짧은 꿈',
    characters: '자',
    topKeywords: '자주 나타나는 키워드',
    emotionDistribution: '감정 패턴',
    categoryBreakdown: '꿈 카테고리',
    moodDistribution: '무드 분포',
    monthlyTrends: '월별 추이',
    topTags: '인기 태그',
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
    peaceful: '평온',
    anxious: '불안',
    joyful: '기쁨',
    mysterious: '신비',
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

const moodColors = {
  peaceful: '#7FB069',
  anxious: '#E07A5F',
  joyful: '#F2CC8F',
  mysterious: '#81B29A'
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

      // Fetch dreams with all data for comprehensive analysis
      const { data: dreamsData } = await supabase
        .from('dreams')
        .select('created_at, content, mood, tags')
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

      // Calculate longest streak and current streak
      let longestStreak = 0;
      let tempStreak = 0;
      let calculatedCurrentStreak = 0;
      if (dreamsData && dreamsData.length > 0) {
        const dates = dreamsData.map(d => new Date(d.created_at).toDateString());
        const uniqueDates = [...new Set(dates)].sort().reverse(); // Most recent first

        // Calculate current streak (from today backwards)
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          calculatedCurrentStreak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const currentDate = new Date(uniqueDates[i]);
            const prevDate = new Date(uniqueDates[i - 1]);
            const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays === 1) {
              calculatedCurrentStreak++;
            } else {
              break;
            }
          }
        }

        // Calculate longest streak
        tempStreak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i]);
          const prevDate = new Date(uniqueDates[i - 1]);
          const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // Calculate mood distribution
      const moodCounts: { [key: string]: number } = {};
      dreamsData?.forEach((dream) => {
        if (dream.mood) {
          moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
        }
      });

      const totalMoods = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
      const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
        mood,
        count,
        percentage: totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0
      }));

      // Calculate monthly distribution (last 6 months)
      const monthCounts: { [key: string]: number } = {};
      const monthNames = language === 'ko'
        ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      dreamsData?.forEach((dream) => {
        const date = new Date(dream.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      const monthlyDistribution = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // Last 6 months
        .map(([monthKey, count]) => {
          const [year, month] = monthKey.split('-');
          const monthName = monthNames[parseInt(month) - 1];
          return {
            month: `${monthName} ${year.slice(2)}`,
            count
          };
        });

      // Calculate average, longest, and shortest dream length
      let averageLength = 0;
      let longestDream = 0;
      let shortestDream = 0;
      if (dreamsData && dreamsData.length > 0) {
        const lengths = dreamsData.map(d => {
          // Extract dream text from content (before "---\n\nAnalysis:")
          const dreamText = d.content.split('\n\n---\n\n')[0];
          return dreamText.length;
        });
        averageLength = Math.round(lengths.reduce((sum, len) => sum + len, 0) / lengths.length);
        longestDream = Math.max(...lengths);
        shortestDream = Math.min(...lengths);
      }

      // Calculate top tags
      const tagCounts: { [key: string]: number } = {};
      dreamsData?.forEach((dream) => {
        dream.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      setStats({
        totalDreams: dreamCount || 0,
        totalKeywords: keywordsData?.length || 0,
        topKeywords,
        emotionDistribution,
        categoryDistribution,
        averageDreamsPerWeek,
        longestStreak,
        moodDistribution,
        monthlyDistribution,
        averageLength,
        longestDream,
        shortestDream,
        topTags,
        currentStreak: calculatedCurrentStreak
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.totalDreams}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.currentStreak}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.currentStreak}</div>
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
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.longestStreak}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.averageLength}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.avgLength}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.longestDream}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.longestDream}</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#5A8449' }}>
              {stats.shortestDream}
            </div>
            <div style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>{t.shortestDream}</div>
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

        {/* Mood Distribution (Pie Chart) */}
        {stats.moodDistribution.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.moodDistribution}</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center'
            }}>
              {/* Simple Pie Chart */}
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: `conic-gradient(${
                  stats.moodDistribution.map((mood, idx) => {
                    const prevPercentage = stats.moodDistribution.slice(0, idx).reduce((sum, m) => sum + m.percentage, 0);
                    const color = moodColors[mood.mood as keyof typeof moodColors] || '#ccc';
                    return `${color} ${prevPercentage}% ${prevPercentage + mood.percentage}%`;
                  }).join(', ')
                })`,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
              }}></div>

              {/* Legend */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                width: '100%',
                maxWidth: '400px'
              }}>
                {stats.moodDistribution.map((mood, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: moodColors[mood.mood as keyof typeof moodColors] || '#ccc',
                      flexShrink: 0
                    }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {t[mood.mood as keyof typeof t] as string}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {mood.count} ({mood.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Monthly Trends (Bar Chart) */}
        {stats.monthlyDistribution.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.monthlyTrends}</h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {stats.monthlyDistribution.map((month, idx) => {
                const maxCount = Math.max(...stats.monthlyDistribution.map(m => m.count));
                const barWidth = maxCount > 0 ? (month.count / maxCount) * 100 : 0;

                return (
                  <div key={idx}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: '600' }}>{month.month}</span>
                      <span style={{ color: '#666' }}>{month.count} {language === 'ko' ? '개' : 'dreams'}</span>
                    </div>
                    <div style={{
                      height: '32px',
                      background: '#e8f5e8',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: 'linear-gradient(135deg, #7FB069 0%, #5A8449 100%)',
                        borderRadius: '8px',
                        transition: 'width 0.5s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '12px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {month.count > 0 && month.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Tags */}
        {stats.topTags.length > 0 && (
          <div style={{ padding: '0 2rem 2rem 2rem' }}>
            <h2 style={{ color: '#5A8449', marginBottom: '1rem' }}>{t.topTags}</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              {stats.topTags.map((tag, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '2px solid #7FB069'
                  }}
                >
                  <span style={{ fontWeight: '600', color: '#5A8449' }}>
                    {tag.tag}
                  </span>
                  <span style={{
                    background: '#7FB069',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}>
                    {tag.count}
                  </span>
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
