'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  gumroad_license_key: string | null;
  gumroad_product_id: string | null;
  toss_payment_key: string | null;
  toss_order_id: string | null;
  payment_method: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  renewed_at: string | null;
  created_at: string;
  user_email: string;
  subscription_plans: {
    plan_slug: string;
    plan_name: string;
  };
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
}

interface ArchetypeStats {
  totalResults: number;
  totalViews: number;
  averageViews: number;
  topArchetypes: { archetype: string; count: number }[];
  topShared: {
    id: string;
    primary_archetype: string;
    secondary_archetype: string | null;
    view_count: number;
    created_at: string;
    language: string;
  }[];
  languageCounts: { ko: number; en: number };
  topCountries: { country_code: string; country_name: string; count: number }[];
  recentResults: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalRevenue: 0,
  });
  const [archetypeStats, setArchetypeStats] = useState<ArchetypeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin email - 이 이메일만 대시보드 접근 가능
  const ADMIN_EMAIL = 'jeongnewna@gmail.com';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    setUser(user);

    // Check if user is admin
    if (user.email !== ADMIN_EMAIL) {
      setError(`관리자 권한이 없습니다. 현재 로그인: ${user.email}`);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    loadDashboardData();
    loadArchetypeStats();
  };

  const loadArchetypeStats = async () => {
    try {
      const response = await fetch('/api/archetype-stats');
      const data = await response.json();

      if (!data.error) {
        setArchetypeStats(data);
      }
    } catch (err) {
      console.error('Failed to load archetype stats:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/subscriptions/list');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSubscriptions(data.subscriptions || []);

      // Calculate stats
      const now = new Date();
      const active = (data.subscriptions || []).filter((sub: Subscription) => {
        if (!sub.expires_at) return true; // No expiry = lifetime
        return new Date(sub.expires_at) > now && sub.status === 'active';
      }).length;

      const expired = (data.subscriptions || []).filter((sub: Subscription) => {
        if (!sub.expires_at) return false;
        return new Date(sub.expires_at) <= now || sub.status !== 'active';
      }).length;

      setStats({
        totalSubscriptions: data.total || 0,
        activeSubscriptions: active,
        expiredSubscriptions: expired,
        totalRevenue: (data.total || 0) * 19, // Assuming $19 per subscription
      });

      setLoading(false);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string, expiresAt: string | null) => {
    if (!expiresAt) return '#10b981'; // green for lifetime
    const isExpired = new Date(expiresAt) <= new Date();
    if (status === 'active' && !isExpired) return '#10b981'; // green
    if (isExpired) return '#ef4444'; // red
    return '#f59e0b'; // yellow
  };

  const getStatusText = (status: string, expiresAt: string | null) => {
    if (!expiresAt) return '평생';
    const isExpired = new Date(expiresAt) <= new Date();
    if (status === 'active' && !isExpired) return '활성';
    if (isExpired) return '만료';
    return '대기';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '18px', color: '#ef4444', marginBottom: '1rem' }}>
            ⚠️ {error}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#7FB069',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
            🎛️ 관리자 대시보드
          </h1>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {user?.email}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
              전체 구독
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {stats.totalSubscriptions}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
              활성 구독
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {stats.activeSubscriptions}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
              만료된 구독
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.expiredSubscriptions}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
              총 매출 (추정)
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7FB069' }}>
              ${stats.totalRevenue}
            </div>
          </div>
        </div>

        {/* Archetype Test Stats */}
        {archetypeStats && (
          <>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1.5rem',
              marginTop: '3rem',
            }}>
              🌙 아키타입 테스트 통계
            </h2>

            {/* Archetype Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  총 테스트 완료
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7FB069' }}>
                  {archetypeStats.totalResults}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  총 공유 조회수
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8BC34A' }}>
                  {archetypeStats.totalViews}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  평균 조회수
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {archetypeStats.averageViews}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  최근 7일 테스트
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800' }}>
                  {archetypeStats.recentResults}
                </div>
              </div>
            </div>

            {/* Top Archetypes, Language Distribution, and Country Distribution */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}>
              {/* Top 5 Archetypes */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '1rem',
                }}>
                  🏆 인기 아키타입 TOP 5
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {archetypeStats.topArchetypes.map((item, index) => (
                    <div
                      key={item.archetype}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#6b7280',
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                          {item.archetype}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#7FB069',
                      }}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Distribution */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '1rem',
                }}>
                  🌐 언어별 분포
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>한국어</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                        {archetypeStats.languageCounts.ko} ({((archetypeStats.languageCounts.ko / archetypeStats.totalResults) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{
                      height: '12px',
                      background: '#e5e7eb',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(archetypeStats.languageCounts.ko / archetypeStats.totalResults) * 100}%`,
                        background: '#7FB069',
                      }} />
                    </div>
                  </div>
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>English</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>
                        {archetypeStats.languageCounts.en} ({((archetypeStats.languageCounts.en / archetypeStats.totalResults) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{
                      height: '12px',
                      background: '#e5e7eb',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(archetypeStats.languageCounts.en / archetypeStats.totalResults) * 100}%`,
                        background: '#8BC34A',
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 10 Countries */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '1.5rem',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '1rem',
                }}>
                  🌍 국가별 분포 TOP 10
                </h3>
                {archetypeStats.topCountries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {archetypeStats.topCountries.map((country, index) => (
                      <div
                        key={country.country_code}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#6b7280',
                          }}>
                            #{index + 1}
                          </span>
                          <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                            {country.country_name}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#7FB069',
                        }}>
                          {country.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                    아직 국가 정보가 없습니다
                  </p>
                )}
              </div>
            </div>

            {/* Top Shared Results Table */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              marginBottom: '2rem',
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  🔥 가장 많이 본 공유 결과 TOP 10
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        순위
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        주요 아키타입
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        부수 아키타입
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        조회수
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        언어
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        생성일
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        공유 링크
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {archetypeStats.topShared.map((result, index) => (
                      <tr key={result.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', fontSize: '14px', fontWeight: 'bold', color: index < 3 ? '#7FB069' : '#6b7280' }}>
                          #{index + 1}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                          {result.primary_archetype}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                          {result.secondary_archetype || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'white',
                            background: result.view_count > 10 ? '#7FB069' : result.view_count > 5 ? '#8BC34A' : '#9ca3af',
                          }}>
                            {result.view_count} 회
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                          {result.language === 'ko' ? '🇰🇷 한국어' : '🇺🇸 English'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                          {formatDate(result.created_at)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <a
                            href={`/archetype-test/shared/${result.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '12px',
                              color: '#7FB069',
                              textDecoration: 'underline',
                            }}
                          >
                            보기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Subscriptions Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
              구독 목록
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    이메일
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    플랜
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    결제 방법
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    상태
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    구독 시작
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    만료일
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    결제 ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#1f2937' }}>
                      {sub.user_email}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#1f2937' }}>
                      {sub.subscription_plans?.plan_name || 'Unknown'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        background: sub.payment_method === 'toss' ? '#0064FF' : '#FF90E8',
                      }}>
                        {sub.payment_method === 'toss' ? '토스' : 'Gumroad'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        background: getStatusColor(sub.status, sub.expires_at),
                      }}>
                        {getStatusText(sub.status, sub.expires_at)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(sub.started_at)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      {sub.expires_at ? formatDate(sub.expires_at) : '평생'}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {sub.payment_method === 'toss'
                        ? (sub.toss_order_id ? sub.toss_order_id.substring(0, 16) + '...' : '-')
                        : (sub.gumroad_license_key ? sub.gumroad_license_key.substring(0, 16) + '...' : '-')
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscriptions.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#9ca3af',
            }}>
              구독 내역이 없습니다
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              loadDashboardData();
              loadArchetypeStats();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#7FB069',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#6d9a5a')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#7FB069')}
          >
            🔄 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}
