'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import '../../styles/pricing.css';

export default function PricingPage() {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Get language preference
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const gumroadMonthlyUrl = process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz';
  const gumroadYearlyUrl = process.env.NEXT_PUBLIC_GUMROAD_YEARLY_URL ||
    'https://novakitz.gumroad.com/l/novakitz_year';
  const gumroadLifetimeUrl = process.env.NEXT_PUBLIC_GUMROAD_LIFETIME_URL ||
    'https://novakitz.gumroad.com/l/novakitz_lifetime';

  const handleCheckout = (url: string) => {
    window.open(url, '_blank');
  };

  const translations = {
    en: {
      title: 'Choose Your Plan',
      subtitle: 'Unlock deeper insights into your dreams',
      monthly: 'Monthly',
      yearly: 'Yearly',
      lifetime: 'Lifetime',
      yearlyBadge: '17% Off',
      lifetimeBadge: 'Best Value',
      selectPlan: 'Select Plan',
      popularBadge: 'Most Popular',
      features: {
        unlimited: '200 AI interpretations/month',
        history: 'Full dream history',
        patterns: 'Advanced pattern analysis',
        report: 'Monthly insights report',
        export: 'PDF export',
        affirmations: 'Daily affirmations',
        noDreamAffirmations: 'Affirmations from recent dreams',
        lifetimeAccess: 'Lifetime access - pay once, own forever',
        supportDev: 'Support long-term development',
        prioritySupport: 'Priority support'
      },
      refundPolicy: {
        title: 'Refund Policy',
        lifetime: 'Unlike our monthly subscription which comes with a 7-day trial, this Lifetime License is a digital good with instant access, and therefore ALL SALES ARE FINAL. We cannot offer refunds for this specific offer.',
        earlyBelievers: 'This deal is designed for "Early Believers" who want to support the project\'s long-term survival.',
        tryFirst: 'Not sure yet? Please try our Free Plan or the Monthly Subscription first to see if Novakitz works for you before committing to Lifetime Access.'
      }
    },
    ko: {
      title: '플랜 선택',
      subtitle: '꿈에 대한 더 깊은 통찰을 얻으세요',
      monthly: '월간',
      yearly: '연간',
      lifetime: '평생',
      yearlyBadge: '17% 할인',
      lifetimeBadge: '최고 가치',
      selectPlan: '플랜 선택',
      popularBadge: '인기',
      features: {
        unlimited: '월 200회 AI 해석',
        history: '무제한 꿈 기록',
        patterns: '고급 패턴 분석',
        report: '월간 인사이트 리포트',
        export: 'PDF 내보내기',
        affirmations: '일일 확언',
        noDreamAffirmations: '최근 꿈 기반 확언',
        lifetimeAccess: '평생 접근 - 한 번 결제, 영원히 소유',
        supportDev: '장기 개발 지원',
        prioritySupport: '우선 지원'
      },
      refundPolicy: {
        title: '환불 정책',
        lifetime: '7일 무료 체험이 제공되는 월간 구독과 달리, 이 평생 라이선스는 즉시 액세스가 가능한 디지털 제품이므로 모든 판매는 최종입니다. 이 특별 제안에 대한 환불은 제공되지 않습니다.',
        earlyBelievers: '이 거래는 프로젝트의 장기 생존을 지원하고자 하는 "얼리 빌리버"를 위해 설계되었습니다.',
        tryFirst: '아직 확실하지 않으신가요? 평생 접근 권한을 약속하기 전에 먼저 무료 플랜이나 월간 구독을 통해 NovaKitz가 귀하에게 적합한지 확인해 보세요.'
      }
    }
  };

  const t = translations[language];

  return (
    <div className="pricing-page">
      {/* Header */}
      <div className="pricing-header">
        <button
          onClick={() => window.location.href = '/'}
          className="back-button"
        >
          ← {language === 'ko' ? '돌아가기' : 'Back'}
        </button>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-cards">
        {/* Monthly Plan */}
        <div className="pricing-card">
          <div className="card-header">
            <h3>{t.monthly}</h3>
            <div className="price">
              <span className="amount">$4.99</span>
              <span className="period">/month</span>
            </div>
          </div>
          <ul className="features-list">
            <li>✓ {t.features.unlimited}</li>
            <li>✓ {t.features.history}</li>
            <li>✓ {t.features.patterns}</li>
            <li>✓ {t.features.report}</li>
            <li>✓ {t.features.export}</li>
            <li>✓ {t.features.affirmations}</li>
            <li>✓ {t.features.noDreamAffirmations}</li>
          </ul>
          <button
            className="select-plan-btn"
            onClick={() => handleCheckout(gumroadMonthlyUrl)}
          >
            {t.selectPlan}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="pricing-card popular">
          <div className="popular-badge">{t.popularBadge}</div>
          <div className="card-header">
            <h3>{t.yearly}</h3>
            <div className="badge">{t.yearlyBadge}</div>
            <div className="price">
              <span className="amount">$49.99</span>
              <span className="period">/year</span>
            </div>
            <div className="price-note">
              <span className="original-price">$59.88</span>
            </div>
          </div>
          <ul className="features-list">
            <li>✓ {t.features.unlimited}</li>
            <li>✓ {t.features.history}</li>
            <li>✓ {t.features.patterns}</li>
            <li>✓ {t.features.report}</li>
            <li>✓ {t.features.export}</li>
            <li>✓ {t.features.affirmations}</li>
            <li>✓ {t.features.noDreamAffirmations}</li>
          </ul>
          <button
            className="select-plan-btn primary"
            onClick={() => handleCheckout(gumroadYearlyUrl)}
          >
            {t.selectPlan}
          </button>
        </div>

        {/* Lifetime Plan */}
        <div className="pricing-card lifetime">
          <div className="lifetime-badge">{t.lifetimeBadge}</div>
          <div className="card-header">
            <h3>{t.lifetime}</h3>
            <div className="price">
              <span className="amount">$99</span>
              <span className="period">{language === 'ko' ? '평생' : 'forever'}</span>
            </div>
          </div>
          <ul className="features-list">
            <li>✓ {t.features.lifetimeAccess}</li>
            <li>✓ {t.features.unlimited}</li>
            <li>✓ {t.features.history}</li>
            <li>✓ {t.features.patterns}</li>
            <li>✓ {t.features.report}</li>
            <li>✓ {t.features.export}</li>
            <li>✓ {t.features.affirmations}</li>
            <li>✓ {t.features.prioritySupport}</li>
            <li>✓ {t.features.supportDev}</li>
          </ul>
          <button
            className="select-plan-btn lifetime-btn"
            onClick={() => handleCheckout(gumroadLifetimeUrl)}
          >
            {t.selectPlan}
          </button>

          {/* Refund Policy - Lifetime Only */}
          <div className="refund-policy">
            <h4>{t.refundPolicy.title}</h4>
            <p className="policy-text">{t.refundPolicy.lifetime}</p>
            <p className="policy-text">{t.refundPolicy.earlyBelievers}</p>
            <p className="policy-text"><strong>{t.refundPolicy.tryFirst}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
