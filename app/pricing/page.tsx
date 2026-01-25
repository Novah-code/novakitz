'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// FAQ Accordion Item Component
function FAQItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{
      borderBottom: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          paddingRight: '1rem'
        }}>
          {question}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          style={{
            flexShrink: 0,
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, padding 0.3s ease',
        paddingBottom: isOpen ? '1.25rem' : '0'
      }}>
        <p style={{
          fontSize: '15px',
          color: '#6b7280',
          lineHeight: '1.7',
          margin: 0
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

// FAQ Category Component
function FAQCategory({ title, faqs, openIndex, setOpenIndex, startIndex }: {
  title: string;
  faqs: { q: string; a: string }[];
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
  startIndex: number;
}) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#7FB069',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '2px solid #7FB069'
      }}>
        {title}
      </h3>
      {faqs.map((faq, idx) => (
        <FAQItem
          key={startIndex + idx}
          question={faq.q}
          answer={faq.a}
          isOpen={openIndex === startIndex + idx}
          onClick={() => setOpenIndex(openIndex === startIndex + idx ? null : startIndex + idx)}
        />
      ))}
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  useEffect(() => {
    // Get language preference
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleGetStarted = () => {
    // Go to main page (dream journal interface)
    router.push('/');
  };

  const handleUpgradeClick = (plan: 'lifetime' | 'premium' | 'yearly') => {
    if (plan === 'lifetime') {
      window.open(process.env.NEXT_PUBLIC_GUMROAD_LIFETIME_URL || 'https://novakitz.gumroad.com/l/novakitz-lifetime', '_blank');
    } else if (plan === 'yearly') {
      window.open(process.env.NEXT_PUBLIC_GUMROAD_YEARLY_URL || 'https://novakitz.gumroad.com/l/novakitz_year', '_blank');
    } else {
      window.open(process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL || 'https://novakitz.gumroad.com/l/novakitz', '_blank');
    }
  };

  const t = {
    title: language === 'ko' ? '요금제' : 'Pricing',
    subtitle: language === 'ko' ? '당신의 무의식을 탐험하고 꿈을 기록하세요' : 'Explore your unconscious and record your dreams',
    premium: 'Premium',
    premiumDesc: language === 'ko' ? '매월 구독' : 'Monthly subscription',
    perMonth: language === 'ko' ? '매월 결제' : 'per month',
    premiumFeatures: language === 'ko'
      ? ['월 200회 AI 꿈 해석 (하루 6~7회)', '무제한 꿈 기록 및 전체 히스토리', '매일 아침 맞춤 확언 이메일', '주간 꿈 패턴 리포트', '융 아키타입 심화 분석', '모든 미래 기능 무료 업데이트']
      : ['200 AI interpretations/month (~6-7/day)', 'Unlimited dreams & full history', 'Daily personalized affirmation email', 'Weekly dream pattern report', 'Advanced archetype analysis', 'All future updates free'],
    yearly: language === 'ko' ? '연간' : 'Yearly',
    yearlyDesc: language === 'ko' ? '연간 구독' : 'Annual subscription',
    perYear: language === 'ko' ? '연간 결제' : 'per year',
    yearlyDiscount: language === 'ko' ? '30% 할인' : '30% Off',
    yearlyFeatures: language === 'ko'
      ? ['Premium의 모든 기능', '월 200회 AI 꿈 해석', '무제한 꿈 기록 및 전체 히스토리', '매일 아침 맞춤 확언 이메일', '주간 꿈 패턴 리포트', '모든 미래 기능 무료 업데이트']
      : ['All Premium features', '200 AI interpretations/month', 'Unlimited dreams & full history', 'Daily personalized affirmation email', 'Weekly dream pattern report', 'All future updates free'],
    lifetime: 'Lifetime',
    lifetimeDesc: language === 'ko' ? '평생 이용권' : 'Lifetime access',
    lifetimeDiscount: language === 'ko' ? '단 한 번 결제로 평생 사용 • 35% 할인' : 'Pay once, use forever • 35% off',
    lifetimeFeatures: language === 'ko'
      ? ['Premium의 모든 기능', '평생 무제한 AI 해석 (월 200회)', '모든 미래 기능 평생 무료', 'Product Hunt 론칭 특가', '얼리 빌리버 50명 한정']
      : ['All Premium features', 'Lifetime AI interpretations (200/month)', 'All future features free forever', 'Product Hunt launch special', 'Early Believer: 50 spots only'],
    startPremium: language === 'ko' ? 'Premium 시작하기' : 'Start Premium',
    startYearly: language === 'ko' ? '연간 구독 시작하기' : 'Start Yearly',
    buyLifetime: language === 'ko' ? '평생 이용권 구매하기' : 'Buy Lifetime Access',
    noRefund: language === 'ko' ? '환불 불가 • 즉시 라이선스 발급' : 'No refunds • Instant license',
    faq: language === 'ko' ? '자주 묻는 질문' : 'Frequently Asked Questions',
    stillThinking: language === 'ko' ? '아직 고민 중이신가요? 먼저 무료로 시작해보세요' : 'Still thinking? Start for free first',
    tryFree: language === 'ko' ? '무료로 시작하기' : 'Try Free First',
  };

  // FAQ Categories
  const faqCategories = language === 'ko' ? {
    aboutNovakitz: {
      title: 'Novakitz 소개',
      faqs: [
        {
          q: 'Novakitz란 무엇인가요?',
          a: 'Novakitz는 AI 기반 꿈 일기 앱입니다. 꿈을 기록하고 융 심리학과 아키타입 분석을 통해 무의식을 탐험할 수 있도록 도와줍니다.'
        },
        {
          q: 'Novakitz는 단순한 꿈 해석 앱인가요?',
          a: '아니요. Novakitz는 일회성 꿈 해석이 아닌 장기적인 꿈 기록, 무의식 패턴 분석, 개인 아키타입 탐험에 집중합니다. 시간이 지남에 따라 당신의 꿈 패턴과 내면의 변화를 추적할 수 있습니다.'
        },
        {
          q: 'Novakitz는 누구를 위한 앱인가요?',
          a: '자기 성찰, 융 심리학, 상징적 사고, 꿈을 통한 감정 패턴 이해에 관심 있는 분들을 위한 앱입니다. 심리학 전문가부터 자기 탐구에 관심 있는 일반인까지 모두 사용할 수 있습니다.'
        }
      ]
    },
    privacySecurity: {
      title: '개인정보 및 보안',
      faqs: [
        {
          q: '제 꿈 데이터는 안전하게 보호되나요?',
          a: '네. 모든 꿈 기록은 기본적으로 비공개이며 안전하게 암호화되어 저장됩니다. 귀하의 데이터는 절대 공유되거나 공개되지 않습니다.'
        },
        {
          q: '제 꿈 데이터가 AI 학습에 사용되나요?',
          a: '아니요. 귀하의 꿈 데이터는 AI 모델 학습에 사용되지 않습니다. 오직 개인화된 분석과 인사이트 제공에만 활용됩니다.'
        }
      ]
    },
    subscription: {
      title: '구독 및 결제',
      faqs: [
        {
          q: '월 200회 AI 해석이면 충분한가요?',
          a: '네! 하루 평균 6~7회 해석이 가능해서 매일 여러 개의 꿈을 기록하고 분석받기에 충분합니다. 대부분의 사용자는 하루 1~2개의 꿈을 기록합니다.'
        },
        {
          q: 'Lifetime 이용권은 정말 평생인가요?',
          a: '네, 단 한 번 결제로 Novakitz 서비스가 종료되지 않는 한 평생 Premium 기능을 사용하실 수 있습니다. 모든 미래 기능 업데이트도 무료로 제공됩니다.'
        },
        {
          q: '환불이 가능한가요?',
          a: 'Lifetime 이용권은 즉시 라이선스 키가 발급되는 디지털 상품으로 환불이 불가능합니다. 먼저 무료 플랜(월 7회 AI 해석)으로 서비스를 충분히 체험해보신 후 구매를 결정해주세요.'
        },
        {
          q: 'Premium 월 구독은 언제든 취소 가능한가요?',
          a: '네, 언제든지 구독을 취소하실 수 있습니다. 취소 후에도 다음 결제일까지는 Premium 기능을 계속 사용하실 수 있습니다.'
        },
        {
          q: '결제는 어떻게 하나요?',
          a: 'Gumroad를 통해 안전하게 결제하실 수 있습니다. 신용카드, 페이팔 등 다양한 결제 수단을 지원합니다.'
        }
      ]
    }
  } : {
    aboutNovakitz: {
      title: 'About Novakitz',
      faqs: [
        {
          q: 'What is Novakitz?',
          a: 'Novakitz is an AI-powered dream journal designed to help users record dreams and explore their unconscious through Jungian psychology and archetype analysis.'
        },
        {
          q: 'Is Novakitz just a dream interpretation app?',
          a: 'No. Novakitz focuses on long-term dream journaling, unconscious pattern analysis, and personal archetype exploration rather than one-time dream meanings. Over time, you can track your dream patterns and inner changes.'
        },
        {
          q: 'Who is Novakitz for?',
          a: 'Novakitz is for people interested in self-reflection, Jungian psychology, symbolic thinking, and understanding emotional patterns through dreams. From psychology enthusiasts to anyone curious about self-discovery.'
        }
      ]
    },
    privacySecurity: {
      title: 'Privacy & Security',
      faqs: [
        {
          q: 'Is my dream data private and secure?',
          a: 'Yes. All dream records are private by default and securely encrypted. Your data is never shared or made public.'
        },
        {
          q: 'Is my dream data used for AI training?',
          a: 'No. Your dream data is never used to train AI models. It is only used to provide personalized analysis and insights for you.'
        }
      ]
    },
    subscription: {
      title: 'Subscription & Payment',
      faqs: [
        {
          q: 'Is 200 AI interpretations per month enough?',
          a: 'Yes! That allows about 6-7 interpretations per day, which is plenty for recording and analyzing multiple dreams daily. Most users record 1-2 dreams per day.'
        },
        {
          q: 'Is the Lifetime plan really forever?',
          a: 'Yes, with a single payment you can use Premium features for as long as Novakitz exists. All future feature updates are included for free.'
        },
        {
          q: 'Can I get a refund?',
          a: 'Lifetime access is a digital product with instant license delivery and cannot be refunded. Please try the Free plan (7 AI interpretations/month) first to make sure Novakitz works for you.'
        },
        {
          q: 'Can I cancel the Premium monthly subscription anytime?',
          a: 'Yes, you can cancel anytime. After cancellation, you can continue using Premium features until the next billing date.'
        },
        {
          q: 'How do I pay?',
          a: 'Payments are securely processed through Gumroad. We support various payment methods including credit cards and PayPal.'
        }
      ]
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
          }}>
            {t.title}
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Pricing Cards - 3 plans only */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
          maxWidth: '1000px',
          margin: '0 auto 3rem auto'
        }}>
          {/* Premium Monthly */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '2px solid #e5e7eb',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {t.premium}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              {t.premiumDesc}
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#7FB069',
              marginBottom: '0.5rem'
            }}>
              $5.99
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {t.perMonth}
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {t.premiumFeatures.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: idx < 2 ? '600' : 'normal'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#7FB069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgradeClick('premium')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(127, 176, 105, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 176, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(127, 176, 105, 0.3)';
              }}
            >
              {t.startPremium}
            </button>
          </div>

          {/* Yearly Plan */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(127, 176, 105, 0.2)',
            border: '3px solid #7FB069',
            position: 'relative'
          }}>
            {/* Popular Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              color: 'white',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              POPULAR
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {t.yearly}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              {t.yearlyDesc}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#9ca3af',
                textDecoration: 'line-through'
              }}>
                $71.88
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#7FB069'
              }}>
                $49.99
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              {t.perYear}
              <span style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {t.yearlyDiscount}
              </span>
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {t.yearlyFeatures.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: idx === 0 ? '600' : 'normal'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#7FB069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgradeClick('yearly')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(127, 176, 105, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 176, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(127, 176, 105, 0.3)';
              }}
            >
              {t.startYearly}
            </button>
          </div>

          {/* Lifetime */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '2px solid #bfdbfe',
            position: 'relative'
          }}>
            {/* Limited Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap'
            }}>
              LIMITED 50 SPOTS
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              {t.lifetime}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              {t.lifetimeDesc}
            </div>

            {/* 3-Tier Pricing */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              {/* Tier 1: Super Early Bird - SOLD OUT */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                opacity: 0.5,
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                    {language === 'ko' ? '슈퍼 얼리버드' : 'Super Early Bird'}
                  </span>
                  <span style={{
                    background: '#6b7280',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    SOLD OUT
                  </span>
                </div>
                <span style={{ fontSize: '16px', color: '#9ca3af', textDecoration: 'line-through', fontWeight: '600' }}>$99</span>
              </div>

              {/* Tier 2: Early Believer - CURRENT */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(90deg, #dbeafe 0%, transparent 100%)',
                margin: '8px -1rem',
                padding: '10px 1rem',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                    {language === 'ko' ? '얼리 빌리버' : 'Early Believer'}
                  </span>
                  <span style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {language === 'ko' ? '현재가' : 'NOW'}
                  </span>
                </div>
                <span style={{ fontSize: '20px', color: '#1e40af', fontWeight: 'bold' }}>$129</span>
              </div>

              {/* Tier 3: Standard - COMING SOON */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                paddingTop: '10px',
                opacity: 0.6
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {language === 'ko' ? '스탠다드' : 'Standard'}
                  </span>
                  <span style={{
                    background: '#e5e7eb',
                    color: '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {language === 'ko' ? '다음 가격' : 'NEXT'}
                  </span>
                </div>
                <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600' }}>$159</span>
              </div>
            </div>

            <div style={{
              fontSize: '13px',
              color: '#7c2d12',
              fontWeight: '600',
              marginBottom: '1.5rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid #bfdbfe',
              textAlign: 'center'
            }}>
              {language === 'ko' ? '50명 한정 • 평생 $5.99/월 절약' : 'Limited 50 spots • Save $5.99/month forever'}
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {t.lifetimeFeatures.map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: idx === 0 || idx === 1 ? '600' : 'normal'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgradeClick('lifetime')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30, 64, 175, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(30, 64, 175, 0.3)';
              }}
            >
              {t.buyLifetime}
            </button>

            <div style={{
              marginTop: '1rem',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              {t.noRefund}
            </div>
          </div>
        </div>

        {/* FAQ Section - Accordion Style */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '2.5rem',
            textAlign: 'center'
          }}>
            {t.faq}
          </h2>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <FAQCategory
              title={faqCategories.aboutNovakitz.title}
              faqs={faqCategories.aboutNovakitz.faqs}
              openIndex={openFAQIndex}
              setOpenIndex={setOpenFAQIndex}
              startIndex={0}
            />
            <FAQCategory
              title={faqCategories.privacySecurity.title}
              faqs={faqCategories.privacySecurity.faqs}
              openIndex={openFAQIndex}
              setOpenIndex={setOpenFAQIndex}
              startIndex={3}
            />
            <FAQCategory
              title={faqCategories.subscription.title}
              faqs={faqCategories.subscription.faqs}
              openIndex={openFAQIndex}
              setOpenIndex={setOpenFAQIndex}
              startIndex={5}
            />
          </div>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            {t.stillThinking}
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#7FB069',
              border: '2px solid #7FB069',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7FB069';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#7FB069';
            }}
          >
            {t.tryFree}
          </button>
        </div>

        {/* Legal Links - Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <a href="/legal/terms" style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'none', margin: '0 8px' }}>
            Terms
          </a>
          <span style={{ fontSize: '11px', color: '#d1d5db' }}>·</span>
          <a href="/legal/privacy" style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'none', margin: '0 8px' }}>
            Privacy
          </a>
          <span style={{ fontSize: '11px', color: '#d1d5db' }}>·</span>
          <a href="/legal/refund" style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'none', margin: '0 8px' }}>
            Refund
          </a>
        </div>
      </div>
    </div>
  );
}
