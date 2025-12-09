'use client';

import { useState } from 'react';
import TossPaymentWidget from './TossPaymentWidget';
import '../styles/payment-method-modal.css';

interface PaymentMethodModalProps {
  onClose: () => void;
  language: 'en' | 'ko';
  userId: string;
  userEmail: string;
}

type PaymentTab = 'global' | 'korea';
type BillingCycle = 'monthly' | 'yearly';

export default function PaymentMethodModal({
  onClose,
  language,
  userId,
  userEmail
}: PaymentMethodModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>(
    language === 'ko' ? 'korea' : 'global'
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [showTossWidget, setShowTossWidget] = useState(false);

  const gumroadMonthlyUrl = process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz';
  const gumroadYearlyUrl = process.env.NEXT_PUBLIC_GUMROAD_YEARLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz_year';

  const handleGumroadCheckout = () => {
    const url = billingCycle === 'monthly' ? gumroadMonthlyUrl : gumroadYearlyUrl;
    window.open(url, '_blank');
    onClose();
  };

  const handleTossCheckout = () => {
    setShowTossWidget(true);
  };

  const translations = {
    en: {
      title: 'Choose Payment Method',
      globalTab: 'Global Payment',
      koreaTab: 'Korean Payment',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: '17% Off',
      subscribe: 'Subscribe Now',
      or: 'or',
      features: {
        unlimited: 'Unlimited AI interpretations',
        history: 'Full dream history',
        patterns: 'Advanced pattern analysis',
        report: 'Monthly insights report',
        export: 'PDF export',
        affirmations: 'Daily affirmations'
      },
      paymentMethods: {
        global: 'Credit Card, PayPal via Gumroad',
        korea: 'KakaoPay, Toss, NaverPay, Bank Transfer'
      }
    },
    ko: {
      title: '결제 수단 선택',
      globalTab: '해외 결제',
      koreaTab: '한국 간편결제',
      monthly: '월간',
      yearly: '연간',
      yearlyDiscount: '17% 할인',
      subscribe: '구독하기',
      or: '또는',
      features: {
        unlimited: '무제한 AI 해석',
        history: '무제한 꿈 기록',
        patterns: '고급 패턴 분석',
        report: '월간 인사이트 리포트',
        export: 'PDF 내보내기',
        affirmations: '일일 확언'
      },
      paymentMethods: {
        global: '신용카드, PayPal (Gumroad)',
        korea: '카카오페이, 토스, 네이버페이, 계좌이체'
      }
    }
  };

  const t = translations[language];

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="payment-modal-close" onClick={onClose}>
          ✕
        </button>

        {/* Title */}
        <h2 className="payment-modal-title">{t.title}</h2>

        {/* Tabs */}
        <div className="payment-tabs">
          <button
            className={`payment-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            🌍 {t.globalTab}
          </button>
          <button
            className={`payment-tab ${activeTab === 'korea' ? 'active' : ''}`}
            onClick={() => setActiveTab('korea')}
          >
            🇰🇷 {t.koreaTab}
          </button>
        </div>

        {/* Tab Content */}
        <div className="payment-tab-content">
          {activeTab === 'global' && (
            <div className="payment-option">
              <div className="payment-method-info">
                <p className="payment-method-description">
                  {t.paymentMethods.global}
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
                <li>✨ {t.features.unlimited}</li>
                <li>📅 {t.features.history}</li>
                <li>📊 {t.features.patterns}</li>
                <li>📈 {t.features.report}</li>
                <li>📄 {t.features.export}</li>
                <li>💫 {t.features.affirmations}</li>
              </ul>

              {/* Subscribe Button */}
              <button
                className="payment-submit-btn"
                onClick={handleGumroadCheckout}
              >
                {t.subscribe} - {billingCycle === 'monthly' ? '$4.99/month' : '$49.99/year'}
              </button>
            </div>
          )}

          {activeTab === 'korea' && (
            <div className="payment-option">
              {!showTossWidget ? (
                <>
                  <div className="payment-method-info">
                    <p className="payment-method-description">
                      {t.paymentMethods.korea}
                    </p>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="billing-cycle-toggle">
                    <button
                      className={`cycle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      <div className="cycle-name">{t.monthly}</div>
                      <div className="cycle-price">₩5,900/월</div>
                    </button>
                    <button
                      className={`cycle-option ${billingCycle === 'yearly' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('yearly')}
                    >
                      <div className="cycle-name">{t.yearly}</div>
                      <div className="cycle-price">₩59,000/년</div>
                      <div className="cycle-badge">{t.yearlyDiscount}</div>
                    </button>
                  </div>

                  {/* Features */}
                  <ul className="payment-features">
                    <li>✨ {t.features.unlimited}</li>
                    <li>📅 {t.features.history}</li>
                    <li>📊 {t.features.patterns}</li>
                    <li>📈 {t.features.report}</li>
                    <li>📄 {t.features.export}</li>
                    <li>💫 {t.features.affirmations}</li>
                  </ul>

                  {/* Subscribe Button */}
                  <button
                    className="payment-submit-btn toss"
                    onClick={handleTossCheckout}
                  >
                    {t.subscribe} - {billingCycle === 'monthly' ? '₩5,900/월' : '₩59,000/년'}
                  </button>
                </>
              ) : (
                <>
                  {/* Back Button */}
                  <button
                    onClick={() => setShowTossWidget(false)}
                    style={{
                      marginBottom: '16px',
                      padding: '8px 16px',
                      background: 'rgba(127, 176, 105, 0.1)',
                      border: '1px solid rgba(127, 176, 105, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#7FB069'
                    }}
                  >
                    ← {language === 'ko' ? '돌아가기' : 'Back'}
                  </button>

                  {/* Toss Payment Widget */}
                  <TossPaymentWidget
                    userId={userId}
                    userEmail={userEmail}
                    billingCycle={billingCycle}
                    language={language}
                    onSuccess={() => {
                      alert(language === 'ko' ? '결제가 완료되었습니다!' : 'Payment successful!');
                      onClose();
                    }}
                    onError={(error) => {
                      console.error('Toss payment error:', error);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
