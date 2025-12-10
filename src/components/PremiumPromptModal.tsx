'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import PaymentMethodModal from './PaymentMethodModal';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Helper function to reset the prompt for testing
  const resetPremiumPrompt = () => {
    if (user) {
      localStorage.removeItem(`premium_prompt_seen_${user.id}`);
      setHasSeenPrompt(false);
    }
  };

  // Removed gumroad URLs - using PaymentMethodModal instead

  useEffect(() => {
    if (!user) {
      setShowModal(false);
      return;
    }

    const checkPremiumAndPrompt = async () => {
      try {
        console.log('Checking premium status for user:', user.id);

        // Check if user has seen prompt recently (within 24 hours)
        const lastShownKey = `premium_prompt_last_shown_${user.id}`;
        const lastShownTime = localStorage.getItem(lastShownKey);

        if (lastShownTime) {
          const lastShown = new Date(lastShownTime);
          const now = new Date();
          const hoursSinceShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);

          if (hoursSinceShown < 24) {
            console.log('Premium prompt shown within last 24 hours, skipping');
            setShowModal(false);
            return;
          }
        }

        // Get premium plan ID first
        const { data: premiumPlans } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('plan_slug', 'premium')
          .maybeSingle();

        const premiumPlanId = premiumPlans?.id;

        if (!premiumPlanId) {
          console.warn('Could not find premium plan');
          setIsPremium(false);
          setShowModal(true);
          return;
        }

        // Check subscription status
        const { data: subscription, error } = await supabase
          .from('user_subscriptions')
          .select('id, status, plan_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.warn('Error querying subscriptions:', error);
          setIsPremium(false);
          setShowModal(true);
          return;
        }

        console.log('Subscription data:', subscription);

        if (subscription) {
          // User has an active subscription, check if it's premium
          const isPremium = subscription.plan_id === premiumPlanId;
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
    // Save the last shown time to localStorage - show prompt max once per day
    if (user) {
      const lastShownKey = `premium_prompt_last_shown_${user.id}`;
      localStorage.setItem(lastShownKey, new Date().toISOString());
    }
    setShowModal(false);
    onClose();
  };

  if (showPaymentModal && user) {
    return (
      <PaymentMethodModal
        onClose={() => {
          setShowPaymentModal(false);
          onClose();
        }}
        language={language}
        userId={user.id}
        userEmail={user.email || ''}
      />
    );
  }

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
                <span>{language === 'ko' ? '월 7회 AI 해석' : '7 AI interpretations/month'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '짧은 해석 (150-200자)' : 'Brief interpretation (150-200 chars)'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '기본 분석' : 'Basic analysis'}</span>
              </li>
              <li>
                <span>{language === 'ko' ? '무제한 열람' : 'Unlimited viewing'}</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan - Monthly */}
          <div className="plan-card premium-plan">
            <div className="plan-badge premium-badge">
              {language === 'ko' ? '프리미엄' : 'Premium'}
            </div>
            <h3>{language === 'ko' ? '프리미엄 월간' : 'Premium Monthly'}</h3>
            <div className="plan-price">
              <span className="price">$4.99</span>
              <span className="period">{language === 'ko' ? '/월' : '/month'}</span>
            </div>
            <ul className="plan-features">
              <li>
                <span>{language === 'ko' ? '꿈 기록 무제한' : 'Unlimited dream recording'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '무제한 AI 해석' : 'Unlimited AI interpretations'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '자세한 해석 (500자+)' : 'Detailed interpretation (500+ chars)'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '3개 확언' : '3 affirmations'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '구체적 조언' : 'Actionable advice'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '패턴 분석' : 'Pattern analysis'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '월간 리포트' : 'Monthly report'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? 'PDF Export' : 'PDF export'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '무제한 열람' : 'Unlimited viewing'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '꿈 없는 날 최근 꿈 기반 확언' : 'Affirmations from recent dreams on no-dream days'}</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan - Yearly */}
          <div className="plan-card premium-plan premium-yearly">
            <div className="plan-badge premium-badge">
              {language === 'ko' ? '프리미엄' : 'Premium'} {language === 'ko' ? '(최저가)' : '(Best Value)'}
            </div>
            <h3>{language === 'ko' ? '프리미엄 연간' : 'Premium Yearly'}</h3>
            <div className="plan-price">
              <span className="price">$49.99</span>
              <span className="period">{language === 'ko' ? '/년' : '/year'}</span>
            </div>
            <div style={{fontSize: '12px', color: '#7fb069', fontWeight: '600', marginBottom: '12px'}}>
              {language === 'ko' ? '17% 절감' : '17% Off'}
            </div>
            <ul className="plan-features">
              <li>
                <span>{language === 'ko' ? '꿈 기록 무제한' : 'Unlimited dream recording'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '무제한 AI 해석' : 'Unlimited AI interpretations'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '자세한 해석 (500자+)' : 'Detailed interpretation (500+ chars)'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '3개 확언' : '3 affirmations'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '구체적 조언' : 'Actionable advice'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '패턴 분석' : 'Pattern analysis'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '월간 리포트' : 'Monthly report'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? 'PDF Export' : 'PDF export'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '무제한 열람' : 'Unlimited viewing'}</span>
              </li>
              <li className="premium-feature">
                <span>{language === 'ko' ? '꿈 없는 날 최근 꿈 기반 확언' : 'Affirmations from recent dreams on no-dream days'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="premium-prompt-actions" style={{flexDirection: 'column', gap: '8px'}}>
          <button
            onClick={() => {
              setShowModal(false);
              setShowPaymentModal(true);
            }}
            className="btn-upgrade"
            style={{width: '100%'}}
          >
            {language === 'ko' ? '프리미엄 구독하기' : 'Subscribe to Premium'}
          </button>
          <button className="btn-skip" onClick={handleClose} style={{width: '100%'}}>
            {language === 'ko' ? '나중에' : 'Maybe Later'}
          </button>
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
