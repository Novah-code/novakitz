'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { authHeader } from '../../src/lib/authHeader';
import { User } from '@supabase/supabase-js';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
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

interface WeeklyMetric {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  traffic: number;
  signups: number;
  signupRate: string;
  d1Retention: string;
  activeUsers: number;
  activeRate: string;
  paid: number;
  paidRate: string;
  emailsCollected: number;
}

interface UserWithSubscription {
  id: string;
  email: string;
  nickname: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  subscriptionStatus: 'free' | 'active' | 'lifetime' | 'expired';
  planName: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  paymentMethod: string | null;
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
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);
  const [metricsPage, setMetricsPage] = useState(0);
  const [metricsPerPage] = useState(4);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Manual subscription management
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<{ success: boolean; message: string } | null>(null);

  // Users list
  const [allUsers, setAllUsers] = useState<UserWithSubscription[]>([]);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [userActionPlan, setUserActionPlan] = useState<{ [key: string]: 'free' | 'monthly' | 'yearly' | 'lifetime' }>({});

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'active' | 'lifetime' | 'expired'>('all');
  const usersPerPage = 10;

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
    loadUsers();
    loadWeeklyMetrics();
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { headers: await authHeader() });
      const data = await response.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadWeeklyMetrics = async (page = 0) => {
    setMetricsLoading(true);
    try {
      const offset = page * metricsPerPage;
      const response = await fetch(`/api/admin/weekly-metrics?weeks=${metricsPerPage}&offset=${offset}`);
      const data = await response.json();
      if (data.weeks) {
        setWeeklyMetrics(data.weeks);
        setMetricsPage(page);
      }
    } catch (err) {
      console.error('Failed to load weekly metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const activateUserSubscription = async (userEmail: string, userId: string) => {
    const plan = userActionPlan[userId] || 'monthly';
    setActivatingUserId(userId);

    try {
      // If plan is 'free', deactivate subscription
      if (plan === 'free') {
        const response = await fetch('/api/admin/deactivate-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await authHeader()),
          },
          body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (data.success) {
          loadUsers();
          loadDashboardData();
        } else {
          alert(data.error || '구독 비활성화 실패');
        }
      } else {
        // Activate subscription
        const response = await fetch('/api/admin/add-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await authHeader()),
          },
          body: JSON.stringify({ userEmail, planType: plan })
        });

        const data = await response.json();

        if (data.success) {
          loadUsers();
          loadDashboardData();
        } else {
          alert(data.error || '구독 활성화 실패');
        }
      }
    } catch (err) {
      alert('서버 오류가 발생했습니다');
    } finally {
      setActivatingUserId(null);
    }
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
      const response = await fetch('/api/subscriptions/list', { headers: await authHeader() });
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

  const handleManualSubscription = async () => {
    if (!manualEmail.trim()) {
      setManualResult({ success: false, message: '이메일을 입력해주세요' });
      return;
    }

    setManualLoading(true);
    setManualResult(null);

    try {
      const response = await fetch('/api/admin/add-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await authHeader()),
        },
        body: JSON.stringify({
          userEmail: manualEmail.trim(),
          planType: manualPlan,
        })
      });

      const data = await response.json();

      if (data.success) {
        setManualResult({
          success: true,
          message: `${manualEmail} - ${manualPlan === 'lifetime' ? '만료 없음' : manualPlan === 'yearly' ? '연간' : '월간'} 구독 활성화 완료!`
        });
        setManualEmail('');
        loadDashboardData(); // Refresh subscription list
      } else {
        setManualResult({ success: false, message: data.error || '구독 추가 실패' });
      }
    } catch (err) {
      setManualResult({ success: false, message: '서버 오류가 발생했습니다' });
    } finally {
      setManualLoading(false);
    }
  };

  const getStatusText = (status: string, expiresAt: string | null) => {
    if (!expiresAt) return '만료 없음';
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

        {/* Weekly Metrics Dashboard */}
        {(weeklyMetrics.length > 0 || metricsLoading) && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0,
              }}>
                📊 주간 메트릭스
              </h2>
              <button
                onClick={() => loadWeeklyMetrics(metricsPage)}
                disabled={metricsLoading}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: metricsLoading ? '#e5e7eb' : '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: metricsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {metricsLoading ? '로딩중...' : '🔄 새로고침'}
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {/* Header Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 80px 100px 80px 90px 70px 80px',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#6b7280',
              }}>
                <span>Week</span>
                <span>Traffic</span>
                <span>Signup</span>
                <span>D1</span>
                <span>Active(3+)</span>
                <span>Paid</span>
                <span>Emails</span>
              </div>

              {/* Data Rows */}
              {weeklyMetrics.map((week, idx) => (
                <div
                  key={week.weekNumber}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '140px 80px 100px 80px 90px 70px 80px',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: (idx === 0 && metricsPage === 0) ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)' : 'white',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: (idx === 0 && metricsPage === 0) ? '600' : '400',
                    color: '#1f2937',
                    border: (idx === 0 && metricsPage === 0) ? '1px solid rgba(127, 176, 105, 0.3)' : '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600' }}>{week.weekLabel}</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {week.startDate.slice(5)} ~ {week.endDate.slice(5)}
                    </span>
                  </div>
                  <span>{week.traffic.toLocaleString()}</span>
                  <span>
                    {week.signups} <span style={{ color: '#6b7280', fontSize: '11px' }}>({week.signupRate}%)</span>
                  </span>
                  <span style={{ color: parseFloat(week.d1Retention) > 30 ? '#10b981' : '#6b7280' }}>
                    {week.d1Retention}%
                  </span>
                  <span>
                    {week.activeUsers} <span style={{ color: '#6b7280', fontSize: '11px' }}>({week.activeRate}%)</span>
                  </span>
                  <span style={{ color: parseFloat(week.paidRate) > 3 ? '#10b981' : '#6b7280' }}>
                    {week.paid} <span style={{ fontSize: '11px' }}>({week.paidRate}%)</span>
                  </span>
                  <span style={{ color: '#7FB069' }}>{week.emailsCollected}</span>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '1rem',
              padding: '0.75rem',
            }}>
              <button
                onClick={() => loadWeeklyMetrics(metricsPage - 1)}
                disabled={metricsPage === 0 || metricsLoading}
                style={{
                  padding: '0.5rem 1rem',
                  background: (metricsPage === 0 || metricsLoading) ? '#e5e7eb' : '#7FB069',
                  color: (metricsPage === 0 || metricsLoading) ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: (metricsPage === 0 || metricsLoading) ? 'not-allowed' : 'pointer',
                }}
              >
                ← 최근
              </button>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {metricsLoading ? '로딩중...' : metricsPage === 0 ? '최근 4주' : `${metricsPage * metricsPerPage + 1}~${(metricsPage + 1) * metricsPerPage}주 전`}
              </span>
              <button
                onClick={() => loadWeeklyMetrics(metricsPage + 1)}
                disabled={metricsLoading}
                style={{
                  padding: '0.5rem 1rem',
                  background: metricsLoading ? '#e5e7eb' : '#7FB069',
                  color: metricsLoading ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: metricsLoading ? 'not-allowed' : 'pointer',
                }}
              >
                과거 →
              </button>
            </div>

            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: '#f9fafb',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#6b7280',
            }}>
              <strong>지표 설명:</strong> Traffic = 아키타입 테스트 | Signup = 가입자 | D1 = 익일 리텐션(꿈 기록) | Active(3+) = 주 3회 이상 기록 | Paid = 유료 전환 | Emails = 리드 수집
            </div>
          </div>
        )}

        {/* Manual Subscription Management */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1.5rem',
          }}>
            ➕ 수동 구독 추가/수정
          </h2>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                유저 이메일
              </label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                플랜 선택
              </label>
              <select
                value={manualPlan}
                onChange={(e) => setManualPlan(e.target.value as 'monthly' | 'yearly' | 'lifetime')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                }}
              >
                <option value="monthly">월간 (30일)</option>
                <option value="yearly">연간 (365일)</option>
                <option value="lifetime">만료 없음 (심사·데모용)</option>
              </select>
            </div>

            <button
              onClick={handleManualSubscription}
              disabled={manualLoading}
              style={{
                padding: '0.75rem 1.5rem',
                background: manualLoading ? '#9ca3af' : '#7FB069',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: manualLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {manualLoading ? '처리 중...' : '구독 활성화'}
            </button>
          </div>

          {manualResult && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: manualResult.success ? '#d1fae5' : '#fee2e2',
              color: manualResult.success ? '#065f46' : '#991b1b',
              fontSize: '14px',
            }}>
              {manualResult.success ? '✅' : '❌'} {manualResult.message}
            </div>
          )}
        </div>

        {/* All Users List */}
        {(() => {
          // Filter users
          const filteredUsers = statusFilter === 'all'
            ? allUsers
            : allUsers.filter(u => u.subscriptionStatus === statusFilter);

          // Pagination
          const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
          const startIndex = (currentPage - 1) * usersPerPage;
          const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

          return (
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  👥 전체 유저 목록
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as typeof statusFilter);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: 'white',
                    }}
                  >
                    <option value="all">전체 보기</option>
                    <option value="free">무료</option>
                    <option value="active">활성 (월간/연간)</option>
                    <option value="lifetime">만료 없음</option>
                    <option value="expired">만료</option>
                  </select>
                  <button
                    onClick={loadUsers}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    🔄 새로고침
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        이메일
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        닉네임
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        가입일
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        구독 상태
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        시작일
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        만료일
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        플랜 변경
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#1f2937' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                          {u.nickname || '-'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '12px', color: '#6b7280' }}>
                          {new Date(u.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'white',
                            background: u.subscriptionStatus === 'lifetime' ? '#8b5cf6' :
                                       u.subscriptionStatus === 'active' ? '#10b981' :
                                       u.subscriptionStatus === 'expired' ? '#ef4444' : '#9ca3af',
                          }}>
                            {u.subscriptionStatus === 'lifetime' ? '만료 없음' :
                             u.subscriptionStatus === 'active' ? '활성' :
                             u.subscriptionStatus === 'expired' ? '만료' : '무료'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '12px', color: '#6b7280' }}>
                          {u.startedAt ? new Date(u.startedAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '12px', color: '#6b7280' }}>
                          {u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select
                            value={userActionPlan[u.id] || 'monthly'}
                            onChange={(e) => setUserActionPlan(prev => ({
                              ...prev,
                              [u.id]: e.target.value as 'free' | 'monthly' | 'yearly' | 'lifetime'
                            }))}
                            style={{
                              padding: '0.4rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                              background: 'white',
                            }}
                          >
                            <option value="free">무료</option>
                            <option value="monthly">월간</option>
                            <option value="yearly">연간</option>
                            <option value="lifetime">만료 없음</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button
                            onClick={() => activateUserSubscription(u.email!, u.id)}
                            disabled={activatingUserId === u.id}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: activatingUserId === u.id ? '#9ca3af' :
                                         (userActionPlan[u.id] === 'free' ? '#ef4444' : '#7FB069'),
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: activatingUserId === u.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {activatingUserId === u.id ? '처리중...' :
                             (userActionPlan[u.id] === 'free' ? '비활성화' : '적용')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}>
                  유저가 없습니다
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: 'none',
                        background: currentPage === i + 1 ? '#7FB069' : '#d1d5db',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
                        어울리는 유형
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
                    상태
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    구독 시작
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                    만료일
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
                        background: getStatusColor(sub.status, sub.expires_at),
                      }}>
                        {getStatusText(sub.status, sub.expires_at)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      {formatDate(sub.started_at)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      {sub.expires_at ? formatDate(sub.expires_at) : '만료 없음'}
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
