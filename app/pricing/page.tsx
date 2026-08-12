'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { startCheckout } from '../../src/lib/checkout';
import Toast, { ToastType } from '../../src/components/Toast';

// Design tokens
const G = {
  bgMain: '#E8F3EA',
  glass: 'rgba(255,255,255,0.5)',
  glassHover: 'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(255,255,255,0.8)',
  textDark: '#3A4A3E',
  textBase: '#5C7061',
  textLight: '#8BA390',
  green: '#7AB382',
  gold: '#D4A33B',
  pink: '#D67A6B',
};

const panel = {
  background: G.glass,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: `1px solid ${G.glassBorder}`,
  borderRadius: 32,
  boxShadow: '0 10px 40px rgba(0,0,0,0.03), inset 2px 2px 10px rgba(255,255,255,0.5)',
} as React.CSSProperties;

function Check({ color = G.green }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={18} height={18} style={{ flexShrink: 0, marginTop: 2 }}
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      marginBottom: 12,
      background: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${open ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: open ? '0 10px 20px rgba(0,0,0,0.02)' : 'none',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 24px', background: 'none', border: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: G.textDark, paddingRight: '1rem' }}>{q}</span>
        <span style={{
          fontFamily: 'monospace', fontSize: 20, color: G.green, flexShrink: 0,
          transition: 'transform 0.3s', display: 'inline-block',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? 400 : 0, overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        padding: open ? '0 24px 20px' : '0 24px 0',
      }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: G.textBase, whiteSpace: 'pre-line' }}>{a}</p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (saved) setLanguage(saved);
  }, []);

  const ko = language === 'ko';

  const handleBuy = async (plan: 'premium' | 'yearly') => {
    const { changed, message } = await startCheckout(plan, language);
    if (message) setToast({ message, type: changed ? 'success' : 'info' });
  };

  const premiumFeatures = ko ? [
    '무제한 꿈 & 감정 기반 무의식 분석',
    '무제한 꿈 기록 및 전체 히스토리',
    '맞춤 확언 제공',
    '월간 드림 리뷰 & 꿈 패턴 분석',
    '개인 아키타입 여정 타임라인',
    '모든 미래 기능 무료 업데이트',
  ] : [
    'Unlimited dream & emotion-based unconscious analysis',
    'Unlimited dreams & full history',
    'Personalized affirmations',
    'Monthly dream review & pattern analysis',
    'Personal archetype journey timeline',
    'All future updates free',
  ];

  const yearlyFeatures = ko ? [
    'Pro의 모든 기능 포함',
    '연간 결제로 30% 절약',
    '무제한 꿈 & 감정 기반 무의식 분석',
    '무제한 꿈 기록 및 전체 히스토리',
    '맞춤 확언 제공',
    '월간 드림 리뷰 & 아키타입 타임라인',
  ] : [
    'Everything in Pro',
    'Save 30% with annual billing',
    'Unlimited dream & emotion-based unconscious analysis',
    'Unlimited dreams & full history',
    'Personalized affirmations',
    'Monthly dream review & archetype timeline',
  ];

  const whyCards = [
    {
      c: '#729EAB',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={24} height={24} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
          <line x1="18" y1="20" x2="18" y2="10" stroke="#729EAB" />
          <line x1="12" y1="20" x2="12" y2="4" stroke="#729EAB" />
          <line x1="6" y1="20" x2="6" y2="14" stroke="#729EAB" />
        </svg>
      ),
      title: ko ? '인생의 1/3을 버리고 있습니다' : "You're discarding 1/3 of your life",
      desc: ko
        ? '우리는 인생의 30%를 잠자며 보냅니다. 꿈을 무시하는 건 뇌가 밤새 정리한 무의식과 감정의 보고서를 버리는 것과 같습니다.'
        : "We spend 30% of our lives sleeping. Ignoring dreams means discarding the unconscious reports — full of emotions and insights — your brain spent all night writing.",
    },
    {
      c: '#D4A33B',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={24} height={24} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="5" stroke="#D4A33B" />
          <line x1="12" y1="1" x2="12" y2="3" stroke="#D4A33B" />
          <line x1="12" y1="21" x2="12" y2="23" stroke="#D4A33B" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#D4A33B" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="#D4A33B" />
          <line x1="1" y1="12" x2="3" y2="12" stroke="#D4A33B" />
          <line x1="21" y1="12" x2="23" y2="12" stroke="#D4A33B" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="#D4A33B" />
          <line x1="18.36" y1="4.22" x2="19.78" y2="5.64" stroke="#D4A33B" />
        </svg>
      ),
      title: ko ? '아침의 첫 5분이 하루를 결정합니다' : 'The first 5 minutes determine your day',
      desc: ko
        ? '눈 뜨자마자 SNS부터 확인하시나요? 아침 단 5분, 외부 소음 대신 내 안의 목소리를 듣는 것이 능동적인 하루의 시작입니다.'
        : "Do you check Instagram first thing? Starting with others' lives makes your brain passive. Start by listening to your inner voice instead.",
    },
    {
      c: '#D67A6B',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" width={24} height={24} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#D67A6B" />
        </svg>
      ),
      title: ko ? '말하지 못한 감정을, 꿈은 이미 알고 있습니다.' : "What you feel but can't say, your dreams already know.",
      desc: ko
        ? '원인 모를 불안이나 우울함을 느끼시나요? 처리되지 못한 감정이 꿈을 통해 신호를 보냅니다. 기록하는 것만으로도 해소가 시작됩니다.'
        : "Feeling anxious for no reason? Dreams are signals from unresolved emotions. Just recording and reflecting on them begins the release.",
    },
  ];

  const faqCategories = ko ? [
    {
      title: 'Novakitz 소개',
      items: [
        { q: 'Novakitz란 무엇인가요?', a: 'Novakitz는 AI 기반 꿈 일기 앱입니다. 꿈을 기록하고 융 심리학과 아키타입 분석을 통해 무의식을 탐험할 수 있도록 도와줍니다.' },
        { q: 'Novakitz는 단순한 꿈 해석 앱인가요?', a: '아니요. Novakitz는 일회성 꿈 해석이 아닌 장기적인 꿈 기록, 무의식 패턴 분석, 개인 아키타입 탐험에 집중합니다. 시간이 지남에 따라 당신의 꿈 패턴과 내면의 변화를 추적할 수 있습니다.' },
        { q: 'Novakitz는 누구를 위한 앱인가요?', a: '내 안에 뭔가 비어있는 것 같은 느낌이 드는 사람들을 위해.\n\n일기를 쓰고, 생각을 정리해도 정작 깊은 내면은 여전히 수수께끼로 남아있죠.\n\n노바키츠는 당신의 무의식에 귀 기울여 꿈을 의미 있는 통찰로 바꿔줍니다.' },
      ],
    },
    {
      title: '개인정보 및 보안',
      items: [
        { q: '제 꿈 데이터는 안전하게 보호되나요?', a: '네. 모든 꿈 기록은 기본적으로 비공개이며 안전하게 암호화되어 저장됩니다. 귀하의 데이터는 절대 공유되거나 공개되지 않습니다.' },
      ],
    },
    {
      title: '구독 및 결제',
      items: [
        { q: '환불이 가능한가요?', a: '인앱 결제 환불은 App Store 정책에 따라 처리됩니다. 먼저 무료 플랜(월 7회 AI 해석)으로 충분히 체험해보신 후 구매를 결정해주세요.' },
        { q: 'Pro 월 구독은 언제든 취소 가능한가요?', a: '네, 언제든지 구독을 취소하실 수 있습니다. 취소 후에도 다음 결제일까지는 Pro 기능을 계속 사용하실 수 있습니다.' },
        { q: '결제는 어떻게 하나요?', a: '앱스토어 / 구글플레이 인앱 결제로 안전하게 진행됩니다. 구독 관리와 해지도 스토어 설정에서 하실 수 있습니다.' },
      ],
    },
  ] : [
    {
      title: 'About Novakitz',
      items: [
        { q: 'What is Novakitz?', a: 'Novakitz is an AI-powered inner journal designed to help users record dreams and explore their unconscious through Jungian psychology and archetype analysis.' },
        { q: 'Is Novakitz just a dream interpretation app?', a: 'No. Novakitz focuses on long-term inner journaling, unconscious pattern analysis, and personal archetype exploration rather than one-time dream meanings. Over time, you can track your dream patterns and inner changes.' },
        { q: 'Who is Novakitz for?', a: "For people who feel like they're missing something inside themselves.\n\nYou journal. You reflect. But your dreams stay mysterious.\n\nNovakitz helps you listen to your unconscious and turn dreams into meaningful insights." },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { q: 'Is my dream data private and secure?', a: 'Yes. All dream records are private by default and securely encrypted. Your data is never shared or made public.' },
      ],
    },
    {
      title: 'Subscription & Payment',
      items: [
        { q: 'Can I get a refund?', a: 'Refunds for in-app purchases are handled by the App Store or Google Play under their refund policies. Please try the Free plan (7 AI interpretations/month) first to make sure Novakitz works for you.' },
        { q: 'Can I cancel the Pro monthly subscription anytime?', a: 'Yes, you can cancel anytime. After cancellation, you can continue using Pro features until the next billing date.' },
        { q: 'How do I pay?', a: 'Payments are handled by the App Store or Google Play as a secure in-app purchase. You can manage or cancel anytime in your store subscription settings.' },
      ],
    },
  ];

  const S = { fontFamily: "'Playfair Display', Georgia, serif" } as React.CSSProperties;
  const M = { fontFamily: 'monospace' } as React.CSSProperties;

  return (
    <div style={{ minHeight: '100vh', background: G.bgMain, overflowX: 'hidden', position: 'relative' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(181,218,185,0.6)', filter: 'blur(80px)', top: -100, left: -100 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(253,232,181,0.4)', filter: 'blur(80px)', bottom: -100, right: -50 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(217,210,233,0.5)', filter: 'blur(80px)', top: '40%', left: '30%' }} />
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px,8vw,80px) 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ ...M, fontSize: 11, letterSpacing: 2, color: G.green, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>
            The OS for your subconscious
          </span>
          <h1 style={{ ...S, fontSize: 'clamp(36px,6vw,48px)', fontWeight: 700, color: G.textDark, margin: '0 0 40px', letterSpacing: -0.5 }}>
            {ko ? '요금제' : 'Pricing'}
          </h1>

          <div style={{ ...panel, maxWidth: 680, margin: '0 auto', padding: 'clamp(24px,4vw,40px)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: G.textDark, whiteSpace: 'pre-line' }}>
              {ko
                ? "비틀즈의 Paul McCartney는 꿈에서 들은 멜로디로 'Yesterday'를 만들었고,\nThomas Edison은 아이디어를 얻기 위해 의도적으로 낮잠을 활용했습니다."
                : "Paul McCartney composed 'Yesterday' from a melody he heard in a dream.\nThomas Edison deliberately used naps to spark ideas."}
            </p>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: G.textDark }}>
              {ko ? '위대한 통찰은 종종 우리가 잠든 사이 시작됩니다.' : 'Great insights often begin while we sleep.'}
            </p>
            <p style={{ ...S, fontSize: 20, fontStyle: 'italic', color: G.green, margin: '8px 0 0' }}>
              {ko ? '당신은 어떤 꿈을 꾸고 있나요?' : 'What are you dreaming about?'}
            </p>
          </div>
        </div>

        {/* ── Pricing Cards ── */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ ...S, fontSize: 32, color: G.textDark, margin: '0 0 10px' }}>
              {ko ? '플랜 선택하기' : 'Choose Your Plan'}
            </h2>
            <p style={{ fontSize: 15, color: G.textLight, margin: 0 }}>
              {ko ? '당신의 무의식을 탐험하고 꿈을 기록하세요' : 'Explore your unconscious and record your dreams'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 24, alignItems: 'stretch' }}>

            {/* Pro */}
            <div style={{ ...panel, padding: '40px 30px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ ...S, fontSize: 24, fontWeight: 700, color: G.textDark, margin: '0 0 6px' }}>Pro</h3>
              <p style={{ fontSize: 13, color: G.textLight, margin: '0 0 24px' }}>{ko ? '매월 구독' : 'Monthly subscription'}</p>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: G.green, letterSpacing: -1, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  $5.99 <span style={{ fontSize: 14, fontWeight: 400, color: G.textLight }}>/ {ko ? '월' : 'mo'}</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1 }}>
                {premiumFeatures.map((f, i) => (
                  <li key={i} style={{ fontSize: 14, color: G.textDark, display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.5 }}>
                    <Check />{f}
                  </li>
                ))}
              </ul>
              <p style={{ textAlign: 'center', fontSize: 11, color: G.textLight, margin: '0 0 8px' }}>
                * {ko ? '가입한 이메일과 동일한 결제 이메일을 입력해주세요' : 'Use the same email for both payment and sign-up'}
              </p>
              <button
                onClick={() => handleBuy('premium')}
                style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.4)', border: `1px solid ${G.green}`, color: G.green, transition: 'background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,179,130,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
              >
                {ko ? 'Pro 시작하기' : 'Start Pro'}
              </button>
            </div>

            {/* Yearly – Popular */}
            <div style={{ ...panel, border: `2px solid ${G.green}`, background: 'rgba(255,255,255,0.7)', padding: '40px 30px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '6px 18px', ...M, fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: 1, borderRadius: '12px 24px 12px 24px', background: G.green, boxShadow: '0 4px 10px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                POPULAR
              </div>
              <h3 style={{ ...S, fontSize: 24, fontWeight: 700, color: G.textDark, margin: '0 0 6px' }}>{ko ? '연간' : 'Yearly'}</h3>
              <p style={{ fontSize: 13, color: G.textLight, margin: '0 0 24px' }}>{ko ? '연간 구독' : 'Annual subscription'}</p>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: G.green, letterSpacing: -1, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, color: G.textLight, textDecoration: 'line-through', opacity: 0.7 }}>$71.88</span>
                  $49.99
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: G.textLight }}>{ko ? '연간 결제' : 'per year'}</span>
                  <span style={{ ...M, fontSize: 10, padding: '2px 8px', background: 'rgba(122,179,130,0.15)', color: G.green, borderRadius: 8, fontWeight: 700 }}>30% Off</span>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1 }}>
                {yearlyFeatures.map((f, i) => (
                  <li key={i} style={{ fontSize: 14, color: i === 0 ? G.green : G.textDark, fontWeight: i === 0 ? 700 : 400, display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.5 }}>
                    <Check />{f}
                  </li>
                ))}
              </ul>
              <p style={{ textAlign: 'center', fontSize: 11, color: G.textLight, margin: '0 0 8px' }}>
                * {ko ? '가입한 이메일과 동일한 결제 이메일을 입력해주세요' : 'Use the same email for both payment and sign-up'}
              </p>
              <button
                onClick={() => handleBuy('yearly')}
                style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: G.green, border: `1px solid ${G.green}`, color: 'white', boxShadow: '0 6px 15px rgba(122,179,130,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(122,179,130,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(122,179,130,0.3)'; }}
              >
                {ko ? '연간 구독 시작하기' : 'Start Yearly'}
              </button>
            </div>

          </div>
        </div>

        {/* ── Why Record Dreams ── */}
        <div style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ ...S, fontSize: 32, color: G.textDark, margin: '0 0 14px' }}>
              {ko ? '우리는 왜 꿈과 감정을 기록해야 할까요?' : 'Why should we record our dreams and emotions?'}
            </h2>
            <p style={{ fontSize: 15, color: G.textLight, margin: 0, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {ko
                ? "꿈과 감정은 우리 무의식의 언어입니다.\n매일 아침 사라지는 꿈 속에, 당신이 미처 말하지 못한 감정이 담겨 있습니다.\n기록하고 분석할 때 비로소 내면의 지도가 완성됩니다."
                : 'Dreams and emotions are the language of your unconscious.\nEvery morning, the dreams that fade away carry feelings you never had words for.\nRecording and analyzing them is how you map your inner world.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px,100%), 1fr))', gap: 24, marginBottom: 40 }}>
            {whyCards.map((card, i) => (
              <div key={i} style={{ ...panel, padding: '35px 25px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {card.icon}
                <h3 style={{ fontSize: 18, color: G.textDark, margin: 0, lineHeight: 1.4 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: G.textBase, lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: 18, color: G.textDark, margin: '0 0 20px' }}>
              {ko ? "기록하지 않은 꿈과 감정은 사라지지만, 기록된 것들은 '자산'이 됩니다." : "Unrecorded dreams and emotions disappear, but recorded ones become assets."}
            </h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              {(ko
                ? ['막연한 불안감의 원인을 찾고 싶을 때', '남들이 모르는 창의적인 영감이 필요할 때', '진정한 나 자신(Self)을 만나고 싶을 때']
                : ['When you want to find the cause of vague anxiety', 'When you need creative inspiration', 'When you want to meet your true Self']
              ).map((pill, i) => (
                <div key={i} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 30, fontSize: 13, color: G.textBase }}>
                  {pill}
                </div>
              ))}
            </div>
            <p style={{ ...S, fontSize: 20, fontStyle: 'italic', color: G.green, whiteSpace: 'pre-line', margin: 0 }}>
              {ko
                ? '노바키츠는 사라지는 꿈과 감정을 붙잡아,\n당신 내면의 선명한 지도로 만들어드립니다.'
                : 'Novakitz captures your fleeting dreams and emotions\nand turns them into a clear map of your inner life.'}
            </p>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ maxWidth: 800, margin: '0 auto 60px' }}>
          {faqCategories.map((cat, ci) => (
            <div key={ci}>
              <h2 style={{ ...S, fontSize: 24, color: G.green, margin: ci === 0 ? '0 0 20px' : '40px 0 20px', paddingBottom: 10, borderBottom: '1px solid rgba(122,179,130,0.3)' }}>
                {cat.title}
              </h2>
              {cat.items.map((item, ii) => (
                <FAQItem key={ii} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 16, color: G.textLight, marginBottom: 16 }}>
            {ko ? '아직 고민 중이신가요? 먼저 무료로 시작해보세요' : 'Still thinking? Start for free first'}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)', color: G.green, border: `2px solid ${G.green}`, borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = G.green; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = G.green; }}
          >
            {ko ? '무료로 시작하기' : 'Try Free First'}
          </button>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(122,179,130,0.2)' }}>
          {[['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Refund', '/legal/refund']].map(([label, href], i) => (
            <span key={i}>
              {i > 0 && <span style={{ fontSize: 11, color: G.textLight, margin: '0 4px' }}>·</span>}
              <a href={href} style={{ fontSize: 11, color: G.textLight, textDecoration: 'none', margin: '0 6px' }}>{label}</a>
            </span>
          ))}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
