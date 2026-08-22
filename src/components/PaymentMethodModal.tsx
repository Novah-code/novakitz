'use client';

import { useState } from 'react';
import { startCheckout } from '../lib/checkout';
import Toast, { ToastType } from './Toast';
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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleCheckout = async () => {
    const { changed, message } = await startCheckout(
      billingCycle === 'monthly' ? 'premium' : 'yearly',
      language
    );
    // Keep the modal open on failure so the message has somewhere to show and
    // the user can retry without reopening it.
    if (changed) {
      onClose();
      return;
    }
    if (message) setToast({ message, type: 'error' });
  };

  const translations = {
    en: {
      title: 'Choose Your Plan',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: '30% Off',
      subscribe: 'Subscribe Now',
      features: {
        daily: 'A daily AI interpretation',
        history: 'Full dream history',
        patterns: 'Advanced pattern analysis',
        report: 'Monthly insights report',
        export: 'PDF export',
        affirmations: 'Daily affirmations',
        noDreamAffirmations: 'Affirmations from recent dreams on no-dream days'
      },
      paymentMethod: 'Secure in-app purchase'
    },
    ko: {
      title: '플랜 선택',
      monthly: '월간',
      yearly: '연간',
      yearlyDiscount: '30% 할인',
      subscribe: '구독하기',
      features: {
        daily: '매일 받는 AI 해석',
        history: '전체 히스토리 보관',
        patterns: '고급 패턴 분석',
        report: '월간 인사이트 리포트',
        export: 'PDF 내보내기',
        affirmations: '일일 확언',
        noDreamAffirmations: '꿈 없는 날 최근 꿈 기반 확언'
      },
      paymentMethod: '앱 내 결제'
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
                <div className="cycle-price">$5.99/month</div>
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
              <li>{t.features.daily}</li>
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
              onClick={handleCheckout}
            >
              {t.subscribe} - {billingCycle === 'monthly' ? '$5.99/month' : '$49.99/year'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
