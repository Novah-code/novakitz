'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import '../styles/premium-prompt-modal.css';

interface PremiumPromptModalProps {
  user: User | null;
  onClose: () => void;
  language?: 'en' | 'ko';
}

export default function PremiumPromptModal({
  user,
  onClose,
  language = 'en'
}: PremiumPromptModalProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);

  // Helper function to reset the prompt for testing
  const resetPremiumPrompt = () => {
    if (user) {
      localStorage.removeItem(`premium_prompt_seen_${user.id}`);
      setHasSeenPrompt(false);
    }
  };

  const gumroadUrl = process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL ||
    'https://novakitz.gumroad.com/l/novakitz';

  useEffect(() => {
    if (!user) {
      setShowModal(false);
      return;
    }

    const checkPremiumAndPrompt = async () => {
      try {
        console.log('Checking premium status for user:', user.id);

        // Check subscription status - simplified query
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select('id, plan_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.warn('Error querying subscriptions:', error);
          // On error, assume user is free and show the prompt
          setIsPremium(false);
          setShowModal(true);
          return;
        }

        console.log('Subscription data:', subscription);

        if (subscription) {
          // User has an active subscription, check if it's premium
          // We'll just check if subscription exists - if they have an active subscription, assume they might be premium
          // For more accuracy, we could check the plan_id against subscription_plans table
          const { data: planData } = await supabase
            .from('subscription_plans')
            .select('plan_slug')
            .eq('id', subscription.plan_id)
            .single();

          const isPremium = planData?.plan_slug === 'premium';
          console.log('User is premium:', isPremium);
          setIsPremium(isPremium || false);

          // Only show prompt to free users
          if (!isPremium) {
            setShowModal(true);
          }
        } else {
          // No active subscription = free user
          console.log('No active subscription found - user is free');
          setIsPremium(false);
          setShowModal(true);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        // On error, show the prompt to be safe
        setIsPremium(false);
        setShowModal(true);
      }
    };

    checkPremiumAndPrompt();
  }, [user]);

  const handleClose = () => {
    // Don't save to localStorage - show prompt every time for free users
    setShowModal(false);
    onClose();
  };

  if (!showModal || isPremium || hasSeenPrompt) {
    return null;
  }

  return (
    <div className="premium-prompt-overlay" onClick={handleClose}>
      <div className="premium-prompt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="premium-prompt-close" onClick={handleClose}>
          ✕
        </button>

        {/* Header */}
        <div className="premium-prompt-header">
          <h2 className="premium-prompt-title">
            {language === 'ko' ? '꿈 일기를 더 풍요롭게' : 'Enhance Your Dream Journal'}
          </h2>
        </div>

        {/* Content */}
        <div className="premium-prompt-content">
          {/* Free Plan */}
          <div className="plan-card free-plan">
            <div className="plan-badge">
              {language === 'ko' ? '무료' : 'Free'}
            </div>
            <h3>{language === 'ko' ? '무료 플랜' : 'Free Plan'}</h3>
            <ul className="plan-features">
              <li>
                <span>{language === 'ko' ? '꿈 기록 무제한' : 'Unlimited dream recording'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '월 5회 AI 분석' : '5 AI interpretations/month'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '30일 기록 보관' : '30-day history'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '기본 꿈 분석' : 'Basic dream analysis'}</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="plan-card premium-plan">
            <div className="plan-badge premium-badge">
              {language === 'ko' ? '프리미엄' : 'Premium'}
            </div>
            <h3>{language === 'ko' ? '프리미엄 플랜' : 'Premium Plan'}</h3>
            <div className="plan-price">
              <span className="price">$4.99</span>
              <span className="period">{language === 'ko' ? '/월' : '/month'}</span>
            </div>
            <ul className="plan-features">
              <li>
                <span>{language === 'ko' ? '꿈 기록 무제한' : 'Unlimited dream recording'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? 'AI 분석 무제한' : 'Unlimited AI interpretations'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '전체 기록 보관' : 'Full dream history'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '고급 분석 및 인사이트' : 'Advanced analysis & insights'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="premium-prompt-actions">
          <button className="btn-skip" onClick={handleClose}>
            {language === 'ko' ? '나중에' : 'Maybe Later'}
          </button>
          <a href={gumroadUrl} target="_blank" rel="noopener noreferrer" className="btn-upgrade">
            {language === 'ko' ? '프리미엄 업그레이드' : 'Upgrade to Premium'}
          </a>
        </div>

        {/* Info Text */}
        <p className="premium-prompt-info">
          {language === 'ko'
            ? '지금 업그레이드하면 무제한 AI 분석과 전체 꿈 기록을 모두 이용할 수 있습니다.'
            : 'Unlock unlimited AI dream interpretations and access your complete dream history.'
          }
        </p>
      </div>
    </div>
  );
}
