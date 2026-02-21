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
    tagline: 'The OS for your subconscious',
    title: language === 'ko' ? '요금제' : 'Pricing',
    subtitle: language === 'ko' ? '당신의 무의식을 탐험하고 꿈을 기록하세요' : 'Explore your unconscious and record your dreams',
    heroBlocks: language === 'ko' ? [
      '아침은 늘 어수선합니다.\n생각은 흩어지고, 꿈은 사라집니다.\n\nNovakitz는 아침을\n조용한 리셋 루틴으로 만들어줍니다.',
      '비틀즈의 Paul McCartney는 꿈에서 들은 멜로디로 \'Yesterday\'를 만들었고,\nThomas Edison은 아이디어를 얻기 위해 의도적으로 낮잠을 활용했습니다.\n\n위대한 통찰은 종종\n우리가 잠든 사이 시작됩니다.',
      '단순한 꿈 일기가 아닙니다.\n매일 500단어 이상의\n칼 융 관점 심층 분석을 제공합니다.'
    ] : [
      'Mornings are always chaotic.\nThoughts scatter, dreams fade.\n\nNovakitz turns your morning\ninto a quiet reset ritual.',
      'Paul McCartney composed \'Yesterday\' from a melody he heard in a dream.\nThomas Edison deliberately used naps to spark ideas.\n\nGreat insights often begin\nwhile we sleep.',
      'This is not a simple dream diary.\nWe provide 500+ word\nin-depth Jungian analysis every day.'
    ],
    heroCTA: language === 'ko' ? '당신은 어떤 꿈을 꾸고 있나요?' : 'What are you dreaming about?',
    // Why section
    whyTitle: language === 'ko' ? '우리는 왜 꿈을 기록해야 할까요?' : 'Why should we record our dreams?',
    whyIntro: language === 'ko'
      ? '눈을 뜨자마자 스마트폰부터 찾으시나요?\n쏟아지는 알림, 타인의 SNS, 자극적인 뉴스...\n당신의 아침은 \'나\'로 시작하나요, 아니면 \'남\'으로 시작하나요?'
      : 'Do you reach for your phone the moment you wake up?\nEndless notifications, others\' social media, sensational news...\nDoes your morning start with "you" or with "others"?',
    whyCards: language === 'ko' ? [
      {
        icon: '📊',
        title: '인생의 1/3을 버리고 있습니다',
        description: '우리는 인생의 30%를 잠자며 보냅니다. 이때 뇌는 감정을 정리하고 장기 기억을 형성합니다. 꿈을 무시하는 건 이 귀중한 처리 과정의 결과물을 날리는 것과 같아요. 꿈은 뇌가 밤새 시뮬레이션한 무의식의 보고서입니다.'
      },
      {
        icon: '🌅',
        title: '아침의 첫 5분이 하루를 결정합니다',
        description: '눈 뜨자마자 SNS부터 확인하시나요? 뉴스, 타인의 소식으로 하루를 시작하면 뇌는 점점 수동적으로 변해갑니다. 아침 단 5분, 외부의 소음 대신 내 안의 목소리를 듣는 것으로 시작해보세요. 능동적인 하루를 만드는 첫 걸음입니다.'
      },
      {
        icon: '🧠',
        title: '해소되지 않은 감정은 독이 됩니다',
        description: '원인 모를 이유로 불안하거나 우울한 적이 있으신가요? 처리되지 못한 감정은 무의식에 쌓이고, 꿈을 통해 계속 신호를 보내요. 꿈을 기록하고 의식화하는 것만으로도 감정은 인식되고 해소됩니다.'
      }
    ] : [
      {
        icon: '📊',
        title: 'You\'re discarding 1/3 of your life',
        description: 'We spend 30% of our lives sleeping. Ignoring dreams is like throwing away 1/3 of your life. Dreams are your brain\'s nightly unconscious reports.'
      },
      {
        icon: '🌅',
        title: 'The first 5 minutes determine your day',
        description: 'Do you check Instagram and news first thing? Starting with others\' lives makes your brain passive. Start by listening to your inner voice instead of external noise.'
      },
      {
        icon: '🧠',
        title: 'Unprocessed emotions become poison',
        description: 'Feeling anxious or depressed for no reason? Dreams are signals from unresolved emotions. Ignore them and they follow you. Just recording and reflecting on dreams releases inner blockages.'
      }
    ],
    whyOutro: language === 'ko'
      ? '기록하지 않은 꿈은 사라지지만,\n기록된 꿈은 \'자산\'이 됩니다.'
      : 'Unrecorded dreams disappear,\nbut recorded dreams become assets.',
    whyUseCases: language === 'ko'
      ? ['막연한 불안감의 원인을 찾고 싶을 때', '남들이 모르는 창의적인 영감이 필요할 때', '진정한 나 자신(Self)을 만나고 싶을 때']
      : ['When you want to find the cause of vague anxiety', 'When you need creative inspiration others don\'t have', 'When you want to meet your true Self'],
    whyCTA: language === 'ko'
      ? '노바키츠는 사라지는 당신의 꿈을 붙잡아,\n선명한 인생의 지도로 만들어드립니다.'
      : 'Novakitz captures your fleeting dreams\nand turns them into a clear map of your life.',
    premium: 'Premium',
    premiumDesc: language === 'ko' ? '매월 구독' : 'Monthly subscription',
    perMonth: language === 'ko' ? '매월 결제' : 'per month',
    premiumFeatures: language === 'ko'
      ? ['월 200회+ 융 심리학 기반 꿈 분석 (각 500자 이상, 하루 ~6-7회)', '융 아키타입 심화 탐구', '무제한 꿈 기록 및 전체 히스토리', '매일 아침 맞춤 확언 이메일', '주간 꿈 패턴 리포트', '모든 미래 기능 무료 업데이트']
      : ['200+ Jungian dream analyses/month (500+ words each, ~6-7/day)', 'Advanced archetype exploration', 'Unlimited dreams & full history', 'Daily personalized affirmation email', 'Weekly dream pattern report', 'All future updates free'],
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
          a: '내 안에 뭔가 비어있는 것 같은 느낌이 드는 사람들을 위해.\n\n일기를 쓰고, 생각을 정리해도 정작 깊은 내면은 여전히 수수께끼로 남아있죠.\n\n노바키츠는 당신의 무의식에 귀 기울여 꿈을 의미 있는 통찰로 바꿔줍니다.'
        }
      ]
    },
    privacySecurity: {
      title: '개인정보 및 보안',
      faqs: [
        {
          q: '제 꿈 데이터는 안전하게 보호되나요?',
          a: '네. 모든 꿈 기록은 기본적으로 비공개이며 안전하게 암호화되어 저장됩니다. 귀하의 데이터는 절대 공유되거나 공개되지 않습니다.'
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
          a: 'For people who feel like they\'re missing something inside themselves.\n\nYou journal. You reflect. But your dreams stay mysterious.\n\nNovakitz helps you listen to your unconscious and turn dreams into insights.'
        }
      ]
    },
    privacySecurity: {
      title: 'Privacy & Security',
      faqs: [
        {
          q: 'Is my dream data private and secure?',
          a: 'Yes. All dream records are private by default and securely encrypted. Your data is never shared or made public.'
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
      padding: 'clamp(0.75rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header with Tagline */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#7FB069',
            letterSpacing: '2px',
            marginBottom: '0.5rem',
            textTransform: 'uppercase'
          }}>
            {t.tagline}
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 6vw, 48px)',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
          }}>
            {t.title}
          </h1>
        </div>

        {/* Pricing Section Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            {language === 'ko' ? '플랜 선택하기' : 'Choose Your Plan'}
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            {t.subtitle}
          </p>
        </div>

        {/* Hero Copy Blocks */}
        <div style={{
          maxWidth: '680px',
          margin: '0 auto 3rem auto',
          textAlign: 'center'
        }}>
          {t.heroBlocks.map((block: string, idx: number) => (
            <div key={idx} style={{
              marginBottom: '2.5rem',
              padding: '0 1rem'
            }}>
              <p style={{
                fontSize: idx === 2 ? '17px' : '16px',
                color: idx === 2 ? '#1f2937' : '#4b5563',
                lineHeight: '1.8',
                whiteSpace: 'pre-line',
                fontWeight: idx === 2 ? '600' : 'normal',
                fontStyle: idx === 1 ? 'italic' : 'normal'
              }}>
                {block}
              </p>
            </div>
          ))}
          <p style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#7FB069',
            marginBottom: '2rem'
          }}>
            {t.heroCTA}
          </p>
        </div>

        {/* Pricing Cards - 3 plans only */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
          maxWidth: '1000px',
          margin: '0 auto 3rem auto'
        }}>
          {/* Premium Monthly */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'clamp(1.25rem, 4vw, 2.5rem)',
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
              fontSize: 'clamp(32px, 7vw, 48px)',
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
            padding: 'clamp(1.25rem, 4vw, 2.5rem)',
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
            padding: 'clamp(1.25rem, 4vw, 2.5rem)',
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

        {/* Why Record Dreams Section */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)',
          marginBottom: 'clamp(1.5rem, 4vw, 3rem)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          {/* Why Title */}
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Georgia', serif"
          }}>
            {t.whyTitle}
          </h2>

          {/* Intro Text */}
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.8',
            marginBottom: '2.5rem',
            whiteSpace: 'pre-line',
            maxWidth: '600px',
            margin: '0 auto 2.5rem auto'
          }}>
            {t.whyIntro}
          </p>

          {/* 3 Persuasion Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            {t.whyCards.map((card, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: 'clamp(24px, 5vw, 32px)',
                  marginBottom: '0.75rem'
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: '1.7'
                }}>
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          {/* Outro */}
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              marginBottom: '1.5rem'
            }}>
              {t.whyOutro}
            </p>

            {/* Use Cases */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              {t.whyUseCases.map((useCase, idx) => (
                <div key={idx} style={{
                  background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.05) 100%)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#374151',
                  border: '1px solid rgba(127, 176, 105, 0.2)'
                }}>
                  {useCase}
                </div>
              ))}
            </div>

            {/* Final CTA Text */}
            <p style={{
              fontSize: '16px',
              color: '#7FB069',
              fontWeight: '600',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {t.whyCTA}
            </p>
          </div>
        </div>

        {/* FAQ Section - Accordion Style */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 4vw, 3rem)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(22px, 5vw, 32px)',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
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
