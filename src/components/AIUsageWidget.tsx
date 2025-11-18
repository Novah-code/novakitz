'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getRemainingAIInterpretations, canAnalyzeDream } from '../lib/subscription';
import '../styles/ai-usage-widget.css';

interface AIUsageWidgetProps {
  user: User | null;
  onLimitReached?: () => void;
}

interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  canAnalyze: boolean;
}

export default function AIUsageWidget({ user, onLimitReached }: AIUsageWidgetProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsageStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(loadUsageStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user) return;

    try {
      const [usageData, canAnalyzeData] = await Promise.all([
        getRemainingAIInterpretations(user.id),
        canAnalyzeDream(user.id)
      ]);

      const stats = {
        used: usageData.used,
        limit: usageData.limit,
        remaining: usageData.remaining,
        isUnlimited: usageData.isUnlimited,
        canAnalyze: canAnalyzeData.allowed
      };

      setUsage(stats);

      // Notify if limit reached
      if (!stats.canAnalyze && onLimitReached) {
        onLimitReached();
      }
    } catch (error) {
      console.error('Error loading AI usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !usage) {
    return null;
  }

  const getStatusColor = (): string => {
    if (usage.isUnlimited) return 'unlimited';
    if (usage.remaining === 0) return 'critical';
    if (usage.remaining <= 2) return 'warning';
    return 'healthy';
  };

  const getStatusIcon = (): string => {
    if (usage.isUnlimited) return '♾️';
    if (usage.remaining === 0) return '🚫';
    if (usage.remaining <= 2) return '⚠️';
    return '✅';
  };

  const getStatusText = (): string => {
    if (usage.isUnlimited) return 'Unlimited AI';
    if (usage.remaining === 0) return 'Limit Reached';
    if (usage.remaining === 1) return 'Last one!';
    return `${usage.remaining} left`;
  };

  return (
    <div className={`ai-usage-widget status-${getStatusColor()}`}>
      <button
        className="usage-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="AI Interpretation Usage"
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="usage-details">
          <div className="detail-section">
            <h4>This Month's Usage</h4>
            {usage.isUnlimited ? (
              <div className="unlimited-info">
                <p className="unlimited-label">Unlimited Interpretations</p>
                <p className="unlimited-desc">Enjoy unlimited AI dream analysis with Premium!</p>
              </div>
            ) : (
              <div className="usage-info">
                <div className="usage-stats">
                  <div className="stat-item">
                    <span className="stat-name">Used</span>
                    <span className="stat-value used">{usage.used}</span>
                  </div>
                  <div className="stat-divider">/</div>
                  <div className="stat-item">
                    <span className="stat-name">Limit</span>
                    <span className="stat-value limit">{usage.limit}</span>
                  </div>
                </div>
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{
                      width: `${Math.min((usage.used / usage.limit) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="usage-message">
                  {usage.remaining === 0 ? (
                    <p className="error">
                      You've reached your monthly limit. Next reset: {new Date(Date.now() + (30 - new Date().getDate()) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="info">
                      {usage.remaining} interpretation{usage.remaining !== 1 ? 's' : ''} remaining this month
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {!usage.isUnlimited && usage.remaining <= 3 && (
            <div className="upgrade-prompt">
              <p>Need more interpretations?</p>
              <a href="https://gumroad.com/novakitz" target="_blank" rel="noopener noreferrer">
                Upgrade to Premium →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
