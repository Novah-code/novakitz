'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getRemainingAIInterpretations } from '../lib/subscription';
import { User } from '@supabase/supabase-js';
import '../styles/subscription-manager.css';

interface SubscriptionManagerProps {
  user: User | null;
}

interface SubscriptionInfo {
  planSlug: string;
  planName: string;
  isActive: boolean;
  expiresAt?: string;
  gumroadLicenseKey?: string;
}

interface AIUsageInfo {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export default function SubscriptionManager({ user }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [aiUsage, setAIUsage] = useState<AIUsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [gumroadUrl] = useState(
    process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL || 'https://novakitz.gumroad.com/l/novakitz'
  );

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

        setSubscription({
          planSlug: isExpired ? 'free' : subscription.subscription_plans.plan_slug,
          planName: isExpired ? 'Free' : subscription.subscription_plans.plan_name,
          isActive: !isExpired,
          expiresAt: subscription.expires_at,
          gumroadLicenseKey: subscription.gumroad_license_key
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

  const getPlanBadgeColor = (planSlug: string): string => {
    if (planSlug === 'premium') {
      return '#FFD700'; // Gold for premium
    }
    return '#7FB069'; // Pale green for free
  };

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
              style={{ backgroundColor: getPlanBadgeColor(subscription.planSlug) }}
            >
              {subscription.planName}
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
              Unlimited dream recording and AI interpretations
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
                <li>🤖 10 AI interpretations per month</li>
                <li>📅 30-day dream history</li>
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
                <li>📅 Full dream history</li>
                <li>🎯 Advanced dream analysis</li>
                <li>📊 Detailed insights</li>
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
                  💡 <strong>Note:</strong> Pricing may increase to $9.99/month in the near future. Lock in the current rate by subscribing now.
                </p>
              </div>
              <a
                href={gumroadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="upgrade-button"
              >
                Upgrade to Premium
              </a>
            </div>
          )}

          {subscription.planSlug === 'premium' && (
            <div className="premium-info">
              <div className="info-row">
                <span className="info-label">Expires:</span>
                <span className="info-value">
                  {formatExpiryDate(subscription.expiresAt)}
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
                  href={gumroadUrl}
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
          <span className="stat-value">
            {subscription.planSlug === 'premium' ? 'Full' : '30 days'}
          </span>
        </div>
      </div>
    </div>
  );
}
