'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getRemainingAIInterpretations } from '../lib/subscription';
import { User } from '@supabase/supabase-js';
import PaymentMethodModal from './PaymentMethodModal';
import '../styles/subscription-manager.css';

const translations = {
  en: {
    planStatus: 'Plan Status',
    upgradeToP: 'Upgrade to Premium',
    perMonth: '/month',
    unlimitedRecording: 'Unlimited dream recording, but limited AI interpretations',
    unlimitedBoth: 'Unlimited dream recording and AI interpretations',
    aiInterpretations: 'AI Interpretations This Month',
    unlimited: 'Unlimited',
    reachedLimit: "You've reached your monthly limit. Upgrade to Premium for unlimited interpretations.",
    freePlanTitle: 'Free Plan Includes:',
    premiumPlanTitle: 'Premium Plan Includes:',
    upgradeToPremium: 'Upgrade to Premium',
    pricingNote: 'Note: Pricing may increase to $9.99/month in the near future. Lock in the current rate by subscribing now.',
    expires: 'Expires:',
    never: 'Never',
    license: 'License:',
    manageSubscription: 'Manage your subscription on Gumroad',
    visitGumroad: 'Visit Gumroad',
    dreamRecording: 'Dream Recording',
    history: 'History',
    days30: '30 days',
    full: 'Full',
    detailsToggle: 'Details',
    haveLicenseKey: 'Have a license key?',
    enterLicenseKey: 'Enter License Key',
    licenseKeyPlaceholder: 'Enter your Gumroad license key',
    activateLicense: 'Activate',
    activating: 'Activating...',
    licenseActivated: 'License activated successfully!',
    licenseError: 'Failed to activate license. Please check your key.',
    licenseAlreadyUsed: 'This license is already in use by another account.'
  },
  ko: {
    planStatus: '플랜 상태',
    upgradeToP: '프리미엄 업그레이드',
    perMonth: '/월',
    unlimitedRecording: '무제한 꿈 기록, 제한된 AI 해석',
    unlimitedBoth: '무제한 꿈 기록 및 AI 해석',
    aiInterpretations: '이 달의 AI 해석',
    unlimited: '무제한',
    reachedLimit: '월간 한도에 도달했습니다. 무제한 해석을 위해 프리미엄으로 업그레이드하세요.',
    freePlanTitle: '무료 플랜 포함:',
    premiumPlanTitle: '프리미엄 플랜 포함:',
    upgradeToPremium: '프리미엄 업그레이드',
    pricingNote: '참고: 가격이 가까운 미래에 $9.99/월로 인상될 수 있습니다. 현재 요금으로 고정하려면 지금 구독하세요.',
    expires: '만료:',
    never: '무제한',
    license: '라이선스:',
    manageSubscription: 'Gumroad에서 구독 관리',
    visitGumroad: 'Gumroad 방문',
    dreamRecording: '꿈 기록',
    history: '기록',
    days30: '30일',
    full: '전체',
    detailsToggle: '상세',
    haveLicenseKey: '라이선스 키가 있으신가요?',
    enterLicenseKey: '라이선스 키 입력',
    licenseKeyPlaceholder: 'Gumroad 라이선스 키를 입력하세요',
    activateLicense: '활성화',
    activating: '활성화 중...',
    licenseActivated: '라이선스가 성공적으로 활성화되었습니다!',
    licenseError: '라이선스 활성화에 실패했습니다. 키를 확인해주세요.',
    licenseAlreadyUsed: '이 라이선스는 이미 다른 계정에서 사용 중입니다.'
  }
};

interface SubscriptionManagerProps {
  user: User | null;
  language?: 'en' | 'ko';
}

interface SubscriptionInfo {
  planSlug: string;
  planName: string;
  isActive: boolean;
  expiresAt?: string;
  gumroadLicenseKey?: string;
  gumroadProductId?: string; // novakitz, novakitz_year, or novakitz_lifetime
}

interface AIUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export default function SubscriptionManager({ user, language = 'en' }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [aiUsage, setAIUsage] = useState<AIUsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLicenseInput, setShowLicenseInput] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const t = translations[language];

  const loadSubscriptionData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load subscription info
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans:plan_id(
            plan_slug,
            plan_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .maybeSingle();

      if (subscription && subscription.subscription_plans) {
        // Check if subscription is not expired
        const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();

        // Determine display name based on product type
        const productId = subscription.gumroad_product_id || '';
        const isLifetime = productId.includes('lifetime') || !subscription.expires_at;
        const displayName = isLifetime ? 'Lifetime' : subscription.subscription_plans.plan_name;

        setSubscription({
          planSlug: isExpired ? 'free' : subscription.subscription_plans.plan_slug,
          planName: isExpired ? 'Free' : displayName,
          isActive: !isExpired,
          expiresAt: subscription.expires_at,
          gumroadLicenseKey: subscription.gumroad_license_key,
          gumroadProductId: subscription.gumroad_product_id
        });
      } else {
        // Default to free plan
        setSubscription({
          planSlug: 'free',
          planName: 'Free',
          isActive: false
        });
      }

      // Load AI usage info
      const usage = await getRemainingAIInterpretations(user.id);
      setAIUsage(usage);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      // Set default free plan on error
      setSubscription({
        planSlug: 'free',
        planName: 'Free',
        isActive: false
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user, loadSubscriptionData]);

  const handleActivateLicense = async () => {
    if (!user || !licenseKey.trim()) return;

    setLicenseLoading(true);
    setLicenseMessage(null);

    try {
      const response = await fetch('/api/activate-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLicenseMessage({ type: 'success', text: t.licenseActivated });
        setLicenseKey('');
        setShowLicenseInput(false);
        // Reload subscription data
        await loadSubscriptionData();
      } else {
        const errorText = data.error?.includes('already in use')
          ? t.licenseAlreadyUsed
          : t.licenseError;
        setLicenseMessage({ type: 'error', text: errorText });
      }
    } catch {
      setLicenseMessage({ type: 'error', text: t.licenseError });
    } finally {
      setLicenseLoading(false);
    }
  };

  const getPlanBadgeColor = (planSlug: string, isLifetime?: boolean): string => {
    if (planSlug === 'premium') {
      if (isLifetime) {
        return '#9B59B6'; // Purple for lifetime
      }
      return '#FFD700'; // Gold for premium
    }
    return '#7FB069'; // Pale green for free
  };

  const isLifetimePlan = subscription?.gumroadProductId?.includes('lifetime') ||
    (subscription?.planSlug === 'premium' && !subscription?.expiresAt);

  const getProgressColor = (used: number, limit: number): string => {
    if (limit === -1) return '#7FB069'; // Unlimited - green
    const percentage = (used / limit) * 100;
    if (percentage < 50) return '#7FB069'; // Green
    if (percentage < 80) return '#F4A460'; // Orange
    return '#E74C3C'; // Red
  };

  const formatExpiryDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="subscription-manager loading">Loading subscription info...</div>;
  }

  if (!subscription || !aiUsage) {
    return <div className="subscription-manager">Unable to load subscription info</div>;
  }

  return (
    <div className="subscription-manager">
      {/* Plan Status Header */}
      <div className="subscription-header">
        <div className="plan-info">
          <h3 className="plan-title">
            <span
              className="plan-badge"
              style={{ backgroundColor: getPlanBadgeColor(subscription.planSlug, isLifetimePlan) }}
            >
              {isLifetimePlan ? '💎 Lifetime' : subscription.planSlug === 'premium' ? '👑 Premium' : subscription.planName}
            </span>
            {subscription.planSlug === 'premium' && subscription.isActive && (
              <span className="active-indicator">Active</span>
            )}
          </h3>
          {subscription.planSlug === 'free' && (
            <p className="plan-description">
              Unlimited dream recording, but limited AI interpretations
            </p>
          )}
          {subscription.planSlug === 'premium' && (
            <p className="plan-description">
              {isLifetimePlan
                ? (language === 'ko' ? '평생 무제한 꿈 기록 및 AI 해석' : 'Lifetime unlimited dream recording and AI interpretations')
                : (language === 'ko' ? '무제한 꿈 기록 및 AI 해석' : 'Unlimited dream recording and AI interpretations')
              }
            </p>
          )}
        </div>
        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      {/* AI Interpretation Usage */}
      <div className="usage-section">
        <div className="usage-header">
          <h4>AI Interpretations This Month</h4>
          <span className="usage-count">
            {aiUsage.isUnlimited ? (
              <span className="unlimited-badge">Unlimited</span>
            ) : (
              `${aiUsage.used} / ${aiUsage.limit}`
            )}
          </span>
        </div>

        {!aiUsage.isUnlimited && (
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min((aiUsage.used / aiUsage.limit) * 100, 100)}%`,
                  backgroundColor: getProgressColor(aiUsage.used, aiUsage.limit)
                }}
              />
            </div>
            <div className="progress-info">
              <span className="remaining">
                {aiUsage.remaining} remaining
              </span>
              <span className="percentage">
                {Math.round((aiUsage.used / aiUsage.limit) * 100)}%
              </span>
            </div>
          </div>
        )}

        {aiUsage.used >= aiUsage.limit && aiUsage.limit !== -1 && (
          <div className="limit-reached-message">
            You've reached your monthly limit. Upgrade to Premium for unlimited interpretations.
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="subscription-details">
          {subscription.planSlug === 'free' && (
            <div className="plan-limits">
              <h5>Free Plan Includes:</h5>
              <ul>
                <li>📝 Unlimited dream recording</li>
                <li>🤖 7 AI interpretations per month</li>
                <li>Unlimited dream history</li>
                <li>🎯 Basic dream patterns</li>
              </ul>
            </div>
          )}

          {subscription.planSlug === 'premium' && (
            <div className="plan-limits">
              <h5>Premium Plan Includes:</h5>
              <ul>
                <li>📝 Unlimited dream recording</li>
                <li>🤖 Unlimited AI interpretations</li>
                <li>Full dream history</li>
                <li>🎯 Advanced dream analysis</li>
                <li>Detailed insights</li>
                <li>Daily affirmations from recent dreams</li>
              </ul>
            </div>
          )}

          {subscription.planSlug === 'free' && (
            <div className="upgrade-section">
              <h5>Upgrade to Premium</h5>
              <p className="upgrade-price">$4.99 / month</p>
              <p className="upgrade-description">
                Unlock unlimited AI dream interpretations and full history access
              </p>
              <div className="pricing-notice">
                <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0 0 0' }}>
                  <strong>{language === 'en' ? 'Note:' : '참고:'}</strong> {t.pricingNote}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="upgrade-button"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                Upgrade to Premium
              </button>

              {/* License Key Input Section */}
              <div className="license-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                {!showLicenseInput ? (
                  <button
                    onClick={() => setShowLicenseInput(true)}
                    className="license-toggle-button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {t.haveLicenseKey}
                  </button>
                ) : (
                  <div className="license-input-container">
                    <h5 style={{ marginBottom: '0.75rem', color: '#374151' }}>{t.enterLicenseKey}</h5>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value)}
                        placeholder={t.licenseKeyPlaceholder}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}
                        disabled={licenseLoading}
                      />
                      <button
                        onClick={handleActivateLicense}
                        disabled={licenseLoading || !licenseKey.trim()}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: licenseLoading ? '#9ca3af' : '#7FB069',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          cursor: licenseLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {licenseLoading ? t.activating : t.activateLicense}
                      </button>
                    </div>
                    {licenseMessage && (
                      <p style={{
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: licenseMessage.type === 'success' ? '#16a34a' : '#dc2626'
                      }}>
                        {licenseMessage.text}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setShowLicenseInput(false);
                        setLicenseKey('');
                        setLicenseMessage(null);
                      }}
                      style={{
                        marginTop: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {language === 'ko' ? '취소' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {subscription.planSlug === 'premium' && (
            <div className="premium-info">
              <div className="info-row">
                <span className="info-label">{language === 'ko' ? '만료:' : 'Expires:'}</span>
                <span className="info-value" style={isLifetimePlan ? { color: '#9B59B6', fontWeight: 'bold' } : {}}>
                  {isLifetimePlan
                    ? (language === 'ko' ? '✨ 평생 이용권 (만료 없음)' : '✨ Lifetime (Never expires)')
                    : formatExpiryDate(subscription.expiresAt)
                  }
                </span>
              </div>
              {subscription.gumroadLicenseKey && (
                <div className="info-row">
                  <span className="info-label">License:</span>
                  <span className="info-value license-key">
                    {subscription.gumroadLicenseKey.substring(0, 8)}...
                  </span>
                </div>
              )}
              <div className="manage-subscription">
                <p className="manage-description">
                  Manage your subscription on Gumroad
                </p>
                <a
                  href="https://novakitz.gumroad.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="manage-button"
                >
                  Visit Gumroad
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat">
          <span className="stat-label">Dream Recording</span>
          <span className="stat-value">Unlimited</span>
        </div>
        <div className="stat">
          <span className="stat-label">AI Interpretations</span>
          <span className="stat-value">
            {aiUsage.isUnlimited ? 'Unlimited' : `${aiUsage.limit}/month`}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">History</span>
          <span className="stat-value">Unlimited</span>
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && user && (
        <PaymentMethodModal
          onClose={() => {
            setShowPaymentModal(false);
            // Refresh subscription data after payment
            loadSubscriptionData();
          }}
          language={language}
          userId={user.id}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
}
