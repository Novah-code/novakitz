'use client';

import { useState } from 'react';
import '../styles/payment-method-modal.css';

interface PaymentMethodModalProps {
  onClose: () => void;
  language: 'en' | 'ko';
  userId: string;
  userEmail: string;
}

type BillingCycle = 'monthly' | 'yearly';

export default function PaymentMethodModal({
  onClose,
  language,
  userId,
  userEmail
}: PaymentMethodModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const gumroadMonthlyUrl = process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz';
  const gumroadYearlyUrl = process.env.NEXT_PUBLIC_GUMROAD_YEARLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz_year';

  const handleGumroadCheckout = () => {
    const url = billingCycle === 'monthly' ? gumroadMonthlyUrl : gumroadYearlyUrl;
    window.open(url, '_blank');
    onClose();
  };

  const translations = {
    en: {
      title: 'Choose Your Plan',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: '17% Off',
      subscribe: 'Subscribe Now',
      features: {
        unlimited: 'Unlimited AI interpretations',
        history: 'Full dream history',
        patterns: 'Advanced pattern analysis',
        report: 'Monthly insights report',
        export: 'PDF export',
        affirmations: 'Daily affirmations',
        noDreamAffirmations: 'Affirmations from recent dreams on no-dream days'
      },
      paymentMethod: 'Credit Card, PayPal via Gumroad'
    },
    ko: {
      title: '플랜 선택',
      monthly: '월간',
      yearly: '연간',
      yearlyDiscount: '17% 할인',
      subscribe: '구독하기',
      features: {
        unlimited: '무제한 AI 해석',
        history: '무제한 꿈 기록',
        patterns: '고급 패턴 분석',
        report: '월간 인사이트 리포트',
        export: 'PDF 내보내기',
        affirmations: '일일 확언',
        noDreamAffirmations: '꿈 없는 날 최근 꿈 기반 확언'
      },
      paymentMethod: '신용카드, PayPal (Gumroad)'
    }
  };

  const t = translations[language];

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="payment-modal-close" onClick={onClose}>
          ×
        </button>

        {/* Title */}
        <h2 className="payment-modal-title">{t.title}</h2>

        {/* Payment Option */}
        <div className="payment-tab-content">
          <div className="payment-option">
            <div className="payment-method-info">
              <p className="payment-method-description">
                {t.paymentMethod}
              </p>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="billing-cycle-toggle">
              <button
                className={`cycle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                <div className="cycle-name">{t.monthly}</div>
                <div className="cycle-price">$4.99/month</div>
              </button>
              <button
                className={`cycle-option ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                <div className="cycle-name">{t.yearly}</div>
                <div className="cycle-price">$49.99/year</div>
                <div className="cycle-badge">{t.yearlyDiscount}</div>
              </button>
            </div>

            {/* Features */}
            <ul className="payment-features">
              <li>{t.features.unlimited}</li>
              <li>{t.features.history}</li>
              <li>{t.features.patterns}</li>
              <li>{t.features.report}</li>
              <li>{t.features.export}</li>
              <li>{t.features.affirmations}</li>
              <li>{t.features.noDreamAffirmations}</li>
            </ul>

            {/* Subscribe Button */}
            <button
              className="payment-submit-btn"
              onClick={handleGumroadCheckout}
            >
              {t.subscribe} - {billingCycle === 'monthly' ? '$4.99/month' : '$49.99/year'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
