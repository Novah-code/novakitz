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

  // Premium users (limit 200): Don't show widget until 190+ uses
  const isPremium = usage.limit === 200;
  const shouldHideForPremium = isPremium && usage.used < 190;

  if (shouldHideForPremium) {
    return null;
  }

  const getStatusColor = (): string => {
    if (usage.remaining === 0) return 'critical';
    if (usage.remaining <= 2) return 'warning';
    if (usage.remaining <= 10) return 'caution';
    return 'healthy';
  };

  const getStatusText = (): string => {
    if (usage.remaining === 0) return 'AI 해석 한도 도달';
    return `AI 해석 ${usage.remaining}회 남음`;
  };

  return (
    <div className={`ai-usage-widget status-${getStatusColor()}`}>
      <button
        className="usage-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title="AI Interpretation Usage"
      >
        <span className="status-text">{getStatusText()}</span>
        <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="usage-details">
          <div className="detail-section">
            <h4>This Month's Usage</h4>
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
                    이번 달 AI 해석 한도에 도달했습니다. 꿈 기록은 계속 가능합니다.
                  </p>
                ) : isPremium ? (
                  <p className="warning">
                    AI 해석 {usage.remaining}회 남았습니다.
                  </p>
                ) : (
                  <p className="info">
                    이번 달 AI 해석 {usage.remaining}회 남음. 꿈 기록은 제한 없이 가능합니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          {!isPremium && usage.remaining <= 3 && (
            <div className="upgrade-prompt">
              <p>Need more interpretations?</p>
              <a href="/pricing" rel="noopener noreferrer">
                Upgrade to Premium →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
