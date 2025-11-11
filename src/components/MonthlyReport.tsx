'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  getMonthDreams,
  getMonthDreamStats,
  generateMonthlyInsights,
  DreamStats
} from '../lib/monthlyReport';
import { generateMonthlyReportPDF } from '../lib/pdfExport';

interface MonthlyReportProps {
  user: User | null;
  language?: 'en' | 'ko';
  isPremium?: boolean;
}

export default function MonthlyReport({
  user,
  language = 'en',
  isPremium = false
}: MonthlyReportProps) {
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [insights, setInsights] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadReport = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const dreamStats = await getMonthDreamStats(user.id);
        setStats(dreamStats);

        if (isPremium && dreamStats.totalDreams > 0) {
          const dreams = await getMonthDreams(user.id);
          const insights = await generateMonthlyInsights(dreams, dreamStats, language);
          setInsights(insights);
        }
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [user, language, isPremium]);

  if (!stats) return null;

  const monthName = new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  const moodEmoji: { [key: string]: string } = {
    peaceful: '😌',
    happy: '😊',
    neutral: '😐',
    anxious: '😟',
    sad: '😢'
  };

  const labels = {
    monthlyReport: language === 'ko' ? '월간 리포트' : 'Monthly Report',
    totalDreams: language === 'ko' ? '기록된 꿈' : 'Dreams Recorded',
    analyzed: language === 'ko' ? 'AI 분석됨' : 'AI Analyzed',
    averageMood: language === 'ko' ? '평균 감정' : 'Average Mood',
    dominantMood: language === 'ko' ? '주요 감정' : 'Dominant Mood',
    affirmations: language === 'ko' ? '생성된 확언' : 'Affirmations Created',
    topKeywords: language === 'ko' ? '주요 키워드' : 'Top Keywords',
    emotionalTrends: language === 'ko' ? '감정 트렌드' : 'Emotional Trends',
    insights: language === 'ko' ? '월간 통찰' : 'Monthly Insights',
    premiumOnly: language === 'ko' ? '(프리미엄 전용)' : '(Premium Only)',
    noData: language === 'ko' ? '아직 데이터가 없습니다.' : 'No data yet.',
    exportReport: language === 'ko' ? 'PDF 내보내기' : 'Export PDF'
  };

  const handleExportReport = async () => {
    if (!stats) return;

    setIsExporting(true);
    try {
      const monthName = new Date().toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: '2-digit'
      }).replace(/\//g, '-');

      await generateMonthlyReportPDF(
        stats,
        insights,
        `monthly-report-${monthName}.pdf`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'ko' ? '내보내기 실패' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid rgba(127, 176, 105, 0.2)',
      boxShadow: '0 2px 8px rgba(127, 176, 105, 0.08)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        gap: '12px'
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {labels.monthlyReport} - {monthName}
            </h3>
          </div>
          <span style={{
            fontSize: '20px',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>

        {isPremium && !isLoading && stats && stats.totalDreams > 0 && (
          <button
            onClick={handleExportReport}
            disabled={isExporting}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(127, 176, 105, 0.1)',
              color: '#7fb069',
              border: '1px solid rgba(127, 176, 105, 0.3)',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: isExporting ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            title={labels.exportReport}
          >
            {isExporting ? '...' : '📥'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#9ca3af'
        }}>
          {language === 'ko' ? '로딩 중...' : 'Loading...'}
        </div>
      ) : stats.totalDreams === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          {labels.noData}
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Total Dreams */}
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#7fb069',
                marginBottom: '4px'
              }}>
                {stats.totalDreams}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {labels.totalDreams}
              </div>
            </div>

            {/* AI Analyzed */}
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#7fb069',
                marginBottom: '4px'
              }}>
                {stats.totalAnalyzed}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {labels.analyzed}
              </div>
            </div>

            {/* Average Mood */}
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '4px'
              }}>
                {stats.averageMood.toFixed(1)}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {labels.averageMood}
              </div>
            </div>

            {/* Affirmations */}
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#7fb069',
                marginBottom: '4px'
              }}>
                {stats.totalAffirmations}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {labels.affirmations}
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <>
              {/* Dominant Mood */}
              <div style={{
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  {labels.dominantMood}
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {moodEmoji[stats.dominantMood] || '😐'}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    textTransform: 'capitalize'
                  }}>
                    {stats.dominantMood}
                  </span>
                </div>
              </div>

              {/* Top Keywords */}
              {stats.topKeywords.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    {labels.topKeywords}
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {stats.topKeywords.map(kw => (
                      <span
                        key={kw.keyword}
                        style={{
                          display: 'inline-block',
                          backgroundColor: 'rgba(127, 176, 105, 0.1)',
                          color: '#7fb069',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {kw.keyword} ({kw.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional Trends */}
              {stats.emotionalTrends.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    {labels.emotionalTrends}
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {stats.emotionalTrends.map(trend => (
                      <div key={trend.mood} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '16px', minWidth: '20px' }}>
                          {moodEmoji[trend.mood] || '😐'}
                        </span>
                        <div style={{
                          flex: 1,
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          height: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(trend.count / Math.max(...stats.emotionalTrends.map(t => t.count))) * 100}%`,
                            backgroundColor: '#7fb069',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          minWidth: '30px',
                          textAlign: 'right'
                        }}>
                          {trend.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {isPremium && insights && (
                <div style={{
                  marginBottom: '0',
                  backgroundColor: 'rgba(127, 176, 105, 0.05)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#7fb069',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ✨ {labels.insights}
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#4b5563'
                  }}>
                    {insights}
                  </p>
                </div>
              )}

              {!isPremium && stats.totalDreams > 0 && (
                <div style={{
                  backgroundColor: 'rgba(127, 176, 105, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {labels.insights} {labels.premiumOnly}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
