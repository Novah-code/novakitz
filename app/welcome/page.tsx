'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuraOrb from '../../src/components/AuraOrb';
import '../../src/styles/home-scene.css';

/*
 * The website: one page that says what Novakitz is and sends people to the App
 * Store. The web app is retired (2026-11-17, 윤아님's call); the product is the
 * iPhone app.
 *
 * Shape borrowed from pickle.com/ko — a calm first screen with one large
 * sentence in a rounded panel, a store button, phones with real screens, a
 * privacy block and a short FAQ — in the app's own sky, glass and fonts.
 */

// The App Store page (Apple ID 6800352279). No storefront or language in the path, so
// Apple sends each visitor to their own country's page in their own language.
const APP_STORE_URL = 'https://apps.apple.com/app/id6800352279';

type Lang = 'en' | 'ko';

const T = {
  en: {
    navFeatures: 'Features',
    navPrivacy: 'Privacy',
    navFaq: 'FAQ',
    download: 'Download',
    hero1: 'Two taps.',
    hero2: 'How you woke, and what you dreamed.',
    heroSub: 'A one-minute morning ritual for your mood and your dreams.',
    appStore: 'Download on the App Store',
    scroll: 'Scroll',
    introEyebrow: 'Meet Novakitz',
    introTitle: 'Mood and dream, in the same place',
    introBody: 'Open the app and two things are waiting: how you woke, and what you dreamed. Tap one, tap the other, close the app.',
    f1Title: 'Eight glowing lights, not a scale',
    f1Body: "Touch the one that already feels like yours. No numbers, no grades — a color isn't a score.",
    f2Title: 'Write it down while you still have it',
    f2Body: "A few lines is enough. Forgot it? Choose mood only, and that's a finished entry.",
    f3Title: 'See both halves of a morning',
    f3Body: 'The feelings you wake with, next to the images your dreams keep coming back to.',
    refEyebrow: 'Reflection',
    refTitle: 'The Waking Mind, the Sleeping Mind',
    refBody: "Reflection shows the feelings that showed up most in your recent logs beside the symbols your dreams keep returning to. Novakitz doesn't diagnose anything — it puts the two halves of a morning where you can see them together.",
    refAi: 'Optionally, a short reading grounded in Jungian symbolism, written for the morning you are actually having. Seven readings a month are free.',
    privEyebrow: 'Privacy',
    privTitle: 'Your mornings stay yours',
    p1Title: 'Skip the AI entirely',
    p1Body: 'Keep just the journal. Recording is always free, and nothing you write is locked behind a subscription.',
    p2Title: 'What leaves your phone',
    p2Body: "Dream text is sent to Google's Gemini to write the reading and the daily affirmation, and it is stored in your account.",
    p3Title: 'Yours to delete',
    p3Body: 'You can delete your account and your records from Settings.',
    faqTitle: 'Questions',
    faq: [
      ['Is Novakitz free?', 'Recording is free, with no limit: mood, dreams, calendar, streak and your whole history. Seven AI readings a month are free too. Pro adds more readings and the monthly review.'],
      ['Which phones does it run on?', 'iPhone, for now.'],
      ['Does it diagnose anything?', "No. It's a journal with a gentle reading, not a medical tool. If you're struggling, please talk to someone you trust or a professional."],
      ['Where does my dream text go?', "Only to Google's Gemini API, to write a reading and the daily affirmation, and into your own account. You can turn the AI part off by simply not asking for a reading."],
    ] as Array<[string, string]>,
    ctaTitle: 'Two taps, then close the app.',
    footerPrivacy: 'Privacy',
    footerTerms: 'Terms',
    footerRefund: 'Refunds',
    footerSupport: 'Support',
  },
  ko: {
    navFeatures: '기능',
    navPrivacy: '개인정보',
    navFaq: '질문',
    download: '다운로드',
    hero1: '두 번 탭하면 끝',
    hero2: '나만의 모닝 리추얼',
    heroSub: '', // 윤아님: the Korean description line read as awkward, so Korean has none
    appStore: 'App Store에서 다운로드',
    scroll: '아래로',
    introEyebrow: '소개합니다',
    introTitle: '기분과 꿈을 한곳에',
    introBody: '앱을 열면 두 가지가 기다리고 있어요. 어떻게 깨어났는지, 무슨 꿈을 꿨는지. 하나를 누르고, 다른 하나를 누르고, 앱을 닫으면 끝이에요.',
    f1Title: '숫자 대신 여덟 개의 빛',
    f1Body: '이미 내 것 같은 빛을 눌러 보세요. 점수도 등급도 없어요. 색은 성적표가 아니니까요.',
    f2Title: '기억이 남아 있을 때 적어두세요',
    f2Body: '몇 줄이면 충분해요. 꿈이 기억나지 않으면 무드만 기록해도 오늘의 기록은 끝나요.',
    f3Title: '아침의 두 얼굴을 함께',
    f3Body: '깨어날 때의 감정과, 꿈에 자꾸 돌아오는 이미지를 나란히 보여줘요.',
    refEyebrow: '리플렉션',
    refTitle: '깨어 있는 마음과 잠든 마음',
    refBody: '최근 기록에서 가장 자주 나타난 감정을, 꿈에 계속 돌아오는 상징 옆에 놓아 보여줘요. 노바키츠는 아무것도 진단하지 않아요. 한 아침의 두 조각을 함께 볼 수 있는 곳에 놓을 뿐이에요.',
    refAi: '원하면, 융의 상징에 바탕을 둔 짧은 해석을 받을 수 있어요. 사전 같은 설명이 아니라 오늘 아침에 맞춰 쓴 글이에요. 한 달에 일곱 번은 무료예요.',
    privEyebrow: '개인정보',
    privTitle: '내 아침은 내 것',
    p1Title: 'AI 없이도 쓸 수 있어요',
    p1Body: '일기만 써도 괜찮아요. 기록은 언제나 무료이고, 쓴 글은 구독 뒤에 잠기지 않아요.',
    p2Title: '폰 밖으로 나가는 것',
    p2Body: '꿈 글은 해석과 오늘의 확언을 쓰기 위해 Google Gemini로 보내지고, 내 계정에 저장돼요.',
    p3Title: '직접 삭제할 수 있어요',
    p3Body: '설정에서 계정과 기록을 삭제할 수 있어요.',
    faqTitle: '자주 묻는 질문',
    faq: [
      ['노바키츠는 무료인가요?', '기록은 제한 없이 무료예요. 무드, 꿈, 캘린더, 연속 기록, 전체 기록 모두요. AI 해석도 한 달에 일곱 번은 무료예요. Pro는 해석을 더 받고 월간 리뷰를 볼 수 있어요.'],
      ['어떤 폰에서 쓸 수 있나요?', '지금은 아이폰만 지원해요.'],
      ['무언가를 진단하나요?', '아니요. 부드러운 해석이 있는 일기이지, 의료 도구가 아니에요. 힘든 마음이 계속된다면 믿을 수 있는 사람이나 전문가와 이야기해 보세요.'],
      ['내 꿈 글은 어디로 가나요?', '해석과 오늘의 확언을 쓰기 위해 Google Gemini API로만 보내지고, 내 계정에 저장돼요. 해석을 요청하지 않으면 AI는 쓰이지 않아요.'],
    ] as Array<[string, string]>,
    ctaTitle: '두 번 탭하고, 앱을 닫으세요.',
    footerPrivacy: '개인정보처리방침',
    footerTerms: '이용약관',
    footerRefund: '환불',
    footerSupport: '문의',
  },
} as const;

const INK = '#2E3C33';
const BASE = '#4A5D4E';
const LIGHT = '#7d8f82';
const PINK = '#EDA3BC';
const ROSE = '#C27A8C';

function AppleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function Phone({ src, alt, tilt = 0 }: { src: string; alt: string; tilt?: number }) {
  return (
    <div className="lp-phone" style={{ transform: `rotate(${tilt}deg)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}


/*
 * Petals drifting across the first screen, out of focus.
 *
 * Soft on purpose and without `filter: blur`: each petal is an SVG shape whose fill
 * fades to nothing at its edge, so it looks blurred with no filter at all. (iOS lets a
 * filtered, animated child spill out of a rounded parent that only has `overflow:
 * hidden`; this layer is also masked to be safe.) Positions, sizes and timings are fixed
 * lists, not random, so the server and the browser draw the same thing.
 *
 * Three depths: small and faint and slow at the back, large and softer and a little
 * quicker at the front. Everything stops under `prefers-reduced-motion`.
 */
// The app's own mood colours plus the tulip's reds, so the petals read as the same family
// as the orbs: rose, coral, peach, butter, mint, sky, lavender, orchid.
const PETAL_COLORS = ['#E2566B', '#FF8F7A', '#F7A98B', '#FFC94D', '#8CCB92', '#7FB8DC', '#A99AE8', '#E58AC4'];
// left %, size px, fall seconds, delay seconds (negative: already in flight), sway px, spin deg, colour, opacity
const PETALS: Array<[number, number, number, number, number, number, number, number]> = [
  [6, 54, 26, -4, 40, 200, 0, 0.55],
  [14, 120, 34, -19, 70, -160, 5, 0.5],
  [22, 38, 22, -11, 30, 240, 3, 0.5],
  [31, 90, 30, -2, 60, 180, 6, 0.5],
  [40, 46, 24, -15, 36, -220, 1, 0.5],
  [49, 150, 38, -27, 80, 140, 4, 0.5],
  [57, 62, 27, -8, 44, 260, 7, 0.5],
  [66, 34, 21, -17, 26, -200, 2, 0.5],
  [74, 104, 33, -23, 66, 170, 5, 0.5],
  [82, 50, 25, -6, 38, -240, 0, 0.5],
  [90, 130, 36, -13, 74, 150, 6, 0.5],
  [95, 42, 23, -21, 30, 210, 3, 0.5],
  [10, 70, 29, -25, 48, -180, 7, 0.5],
  [60, 110, 35, -31, 70, 190, 1, 0.5],
];

function Petals() {
  return (
    <div className="lp-petals" aria-hidden="true">
      {PETALS.map(([left, size, dur, delay, sway, spin, c, op], i) => {
        const color = PETAL_COLORS[c];
        return (
          <span
            key={i}
            className="lp-petal"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.3,
              opacity: op,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              ['--sway' as string]: `${sway}px`,
              ['--spin' as string]: `${spin}deg`,
            }}
          >
            <svg viewBox="0 0 100 130" width="100%" height="100%">
              <defs>
                <radialGradient id={`pg${i}`} cx="50%" cy="52%" r="52%">
                  <stop offset="0" stopColor={color} stopOpacity="0.95" />
                  <stop offset="0.55" stopColor={color} stopOpacity="0.6" />
                  <stop offset="1" stopColor={color} stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M50 4 C86 30 92 88 50 126 C8 88 14 30 50 4 Z" fill={`url(#pg${i})`} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

export default function Welcome() {
  const [lang, setLang] = useState<Lang>('en');
  const [open, setOpen] = useState<number | null>(0);
  const t = T[lang];
  const ko = lang === 'ko';

  useEffect(() => {
    try {
      const saved = localStorage.getItem('preferredLanguage') as Lang | null;
      setLang(saved ?? (navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en'));
    } catch {
      /* keep the default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('preferredLanguage', lang);
    } catch {
      /* not saved */
    }
  }, [lang]);

  const store = (
    <a className="lp-store" href={APP_STORE_URL}>
      <AppleLogo />
      <span>{t.appStore}</span>
    </a>
  );

  return (
    <div className="lp">
      <style>{CSS}</style>

      <header className="lp-nav">
        <a className="lp-logo" href="#top" aria-label="Novakitz">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="" width={28} height={28} />
          <span>novakitz</span>
        </a>
        <nav className="lp-links" aria-label="Sections">
          <a href="#features">{t.navFeatures}</a>
          <a href="#privacy">{t.navPrivacy}</a>
          <a href="#faq">{t.navFaq}</a>
        </nav>
        <div className="lp-nav-right">
          <div className="lp-lang" role="group" aria-label="Language">
            {(['ko', 'en'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={lang === l ? 'on' : ''}>
                {l === 'ko' ? '한국어' : 'EN'}
              </button>
            ))}
          </div>
          <a className="lp-pill" href={APP_STORE_URL}>{t.download}</a>
        </div>
      </header>

      <main id="top">
        {/* 1 — one sentence on the sky */}
        <section className="lp-hero">
          <div className="lp-hero-sky" aria-hidden="true" />
          <Petals />
          <div className="home-scene__grain home-scene__grain--flat" aria-hidden="true" />
          <div className="lp-hero-inner">
            <div className="lp-hero-text">
              <h1 className={`lp-h1 ${ko ? 'ko' : ''}`}>
                <span>{t.hero1}</span>
                <span>{t.hero2}</span>
              </h1>
              {t.heroSub ? <p className="lp-sub">{t.heroSub}</p> : null}
              {store}
            </div>
            <div className="lp-hero-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lp-tulip" src="/site/tulip.webp" alt="" />
            </div>
          </div>
          <div className="lp-scroll" aria-hidden="true">{t.scroll}</div>
        </section>

        {/* 2 — what it is, on real screens */}
        <section className="lp-section" id="features">
          <p className="lp-eyebrow">{t.introEyebrow}</p>
          <h2 className={`lp-h2 ${ko ? 'ko' : ''}`}>{t.introTitle}</h2>
          <p className="lp-lead">{t.introBody}</p>
          <div className="lp-phones">
            <Phone src="/site/shot-1-home.jpg" alt={ko ? '홈 화면' : 'Home screen'} tilt={-3} />
            <Phone src="/site/shot-2-picker.jpg" alt={ko ? '무드 선택' : 'Mood picker'} />
            <Phone src="/site/shot-4-calendar.jpg" alt={ko ? '캘린더' : 'Calendar'} tilt={3} />
          </div>
        </section>

        {/* 3 — the three ideas */}
        <section className="lp-section lp-cards">
          <article className="lp-card">
            <div className="lp-card-art">
              <AuraOrb emotionKey="joyful" size={110} />
              <AuraOrb emotionKey="hopeful" size={110} index={3} />
              <AuraOrb emotionKey="anxious" size={110} index={5} />
            </div>
            <h3 className={ko ? 'ko' : ''}>{t.f1Title}</h3>
            <p>{t.f1Body}</p>
          </article>
          <article className="lp-card">
            <div className="lp-card-art lp-card-art-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/site/shot-3-saved.jpg" alt="" loading="lazy" />
            </div>
            <h3 className={ko ? 'ko' : ''}>{t.f2Title}</h3>
            <p>{t.f2Body}</p>
          </article>
          <article className="lp-card">
            <div className="lp-card-art lp-card-art-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/site/shot-5-insights.jpg" alt="" loading="lazy" />
            </div>
            <h3 className={ko ? 'ko' : ''}>{t.f3Title}</h3>
            <p>{t.f3Body}</p>
          </article>
        </section>

        {/* 4 — reflection */}
        <section className="lp-section lp-split">
          <div className="lp-split-text">
            <p className="lp-eyebrow left">{t.refEyebrow}</p>
            <h2 className={`lp-h2 left ${ko ? 'ko' : ''}`}>{t.refTitle}</h2>
            <p className="lp-lead left">{t.refBody}</p>
            <p className="lp-lead left lp-muted">{t.refAi}</p>
          </div>
          <div className="lp-split-art">
            <Phone src="/site/shot-6-monthly.jpg" alt={ko ? '월간 리뷰' : 'Monthly review'} tilt={2} />
          </div>
        </section>

        {/* 5 — privacy */}
        <section className="lp-dark" id="privacy">
          <p className="lp-eyebrow light">{t.privEyebrow}</p>
          <h2 className={`lp-h2 light ${ko ? 'ko' : ''}`}>{t.privTitle}</h2>
          <div className="lp-dark-cards">
            {[[t.p1Title, t.p1Body], [t.p2Title, t.p2Body], [t.p3Title, t.p3Body]].map(([title, body]) => (
              <div className="lp-dark-card" key={title}>
                <h3 className={ko ? 'ko' : ''}>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 — questions */}
        <section className="lp-section lp-faq" id="faq">
          <h2 className={`lp-h2 left ${ko ? 'ko' : ''}`}>{t.faqTitle}</h2>
          <div>
            {t.faq.map(([q, a], i) => (
              <div className="lp-q" key={q}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span>{q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open === i ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                {open === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 7 — the last ask */}
        <section className="lp-end" id="download">
          <h2 className={`lp-h2 ${ko ? 'ko' : ''}`}>{t.ctaTitle}</h2>
          {store}
        </section>
      </main>

      <footer className="lp-footer">
        <span>© Novakitz</span>
        <nav>
          <Link href="/legal/privacy">{t.footerPrivacy}</Link>
          <Link href="/legal/terms">{t.footerTerms}</Link>
          <Link href="/legal/refund">{t.footerRefund}</Link>
          <Link href="/support">{t.footerSupport}</Link>
        </nav>
      </footer>
    </div>
  );
}

const CSS = `
.lp { background: #FBF8F3; color: ${INK}; font-family: 'Roboto', -apple-system, sans-serif; min-height: 100vh; overflow-x: hidden; }
.lp * { box-sizing: border-box; }
.lp a { color: inherit; text-decoration: none; }
html[lang="ko"] .lp { font-family: 'Pretendard', -apple-system, sans-serif; word-break: keep-all; }

.lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 max(20px, calc((100vw - 1100px) / 2)); background: linear-gradient(180deg, rgba(251,248,243,.92), rgba(251,248,243,0)); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.lp-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display), Georgia, serif; font-size: 24px; letter-spacing: .2px; }
.lp-logo img { border-radius: 8px; }
.lp-links { display: flex; gap: 28px; font-size: 14px; color: ${BASE}; }
.lp-nav-right { display: flex; align-items: center; gap: 12px; }
.lp-lang { display: flex; padding: 3px; border-radius: 20px; background: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 2px 8px rgba(40,60,45,.08); }
.lp-lang button { border: 0; background: transparent; font: inherit; font-size: 12.5px; padding: 6px 12px; border-radius: 16px; color: ${LIGHT}; cursor: pointer; }
.lp-lang button.on { background: #fff; color: ${INK}; font-weight: 700; box-shadow: 0 1px 6px rgba(40,60,45,.14); }
.lp-pill { background: ${INK}; color: #fff !important; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 999px; }

.lp-hero { position: relative; margin: 76px 16px 0; min-height: calc(100vh - 92px); border-radius: 48px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.lp-hero-sky { position: absolute; inset: 0; background-image: var(--home-sky-day); background-color: #F4EEE5; }
.lp-hero .home-scene__grain { z-index: 2; }
.lp-hero-inner { z-index: 3; }
.lp-petals { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; isolation: isolate; -webkit-mask-image: -webkit-radial-gradient(white, black); }
.lp-petal { position: absolute; top: -20%; display: block; will-change: transform; animation-name: lp-drift; animation-timing-function: linear; animation-iteration-count: infinite; }
@keyframes lp-drift {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  25%  { transform: translate3d(var(--sway), 30vh, 0) rotate(calc(var(--spin) * .25)); }
  50%  { transform: translate3d(calc(var(--sway) * -.6), 62vh, 0) rotate(calc(var(--spin) * .5)); }
  75%  { transform: translate3d(calc(var(--sway) * .9), 94vh, 0) rotate(calc(var(--spin) * .75)); }
  100% { transform: translate3d(0, 128vh, 0) rotate(var(--spin)); }
}
@media (prefers-reduced-motion: reduce) { .lp-petal { animation: none; top: 30%; } .lp-tulip { animation: none; } }
.lp-hero-inner { position: relative; z-index: 3; width: 100%; max-width: 1240px; margin: 0 auto; padding: 64px 40px 84px; display: grid; grid-template-columns: 1.05fr .95fr; align-items: center; gap: 24px; text-align: left; }
.lp-hero-text { display: flex; flex-direction: column; align-items: flex-start; }
.lp-hero-art { display: flex; justify-content: center; align-items: center; }
.lp-tulip { width: min(122%, 760px, 80vh); max-width: none; height: auto; margin: -3% -11% -3% -11%; filter: drop-shadow(0 22px 36px rgba(120,40,50,.22)); animation: lp-breathe 8s ease-in-out infinite; }
@keyframes lp-breathe { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.018); } }
.lp-h1 { margin: 0; font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: clamp(40px, 5.6vw, 80px); line-height: 1.06; letter-spacing: -.5px; display: flex; flex-direction: column; text-wrap: balance; }
.lp-h1 span:last-child { color: ${ROSE}; font-style: italic; }
/* globals.css sets every element in Korean to Pretendard with !important, so a heading has to say !important too. */
html[lang="ko"] .lp-h1.ko, html[lang="ko"] .lp-h1.ko span, html[lang="ko"] .lp-h2.ko, html[lang="ko"] .lp-card h3.ko, html[lang="ko"] .lp-dark-card h3.ko { font-family: 'KoDisplay', 'Pretendard', serif !important; }
.lp-h1.ko, .lp-h2.ko { font-family: 'KoDisplay', 'Pretendard', serif; font-weight: 300; letter-spacing: -1px; line-height: 1.3; }
.lp-h1.ko { font-size: clamp(32px, 4.6vw, 62px); }
.lp-h1.ko span:last-child { font-style: normal; }
/* Korean: "나만의 모닝 리추얼" is the headline; "두 번 탭하면 끝" is the small line above it. */
.lp-h1.ko { line-height: 1.2; gap: .22em; }
.lp-h1.ko span:first-child { font-weight: 400; font-size: .4em; letter-spacing: -.3px; line-height: 1.3; }
.lp-h1.ko span:last-child { font-weight: 520; font-size: 1.04em; letter-spacing: -1.5px; line-height: 1.15; }
.lp-h1 + .lp-store { margin-top: 34px; }
.lp-sub { margin: 22px 0 28px; max-width: 520px; font-size: clamp(16px, 1.7vw, 19px); line-height: 1.6; color: ${BASE}; }
.lp-store { display: inline-flex; align-items: center; gap: 10px; background: ${INK}; color: #fff !important; padding: 15px 26px; border-radius: 999px; font-weight: 600; font-size: 15.5px; box-shadow: 0 10px 28px rgba(40,60,45,.22); transition: transform .2s; }
.lp-store:hover { transform: translateY(-2px); }
.lp-scroll { position: absolute; bottom: 22px; left: 0; right: 0; z-index: 2; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: ${LIGHT}; }

.lp-section { max-width: 1100px; margin: 0 auto; padding: 120px 24px 0; text-align: center; }
.lp-eyebrow { margin: 0 0 14px; font-size: 14px; font-weight: 600; letter-spacing: .5px; color: ${ROSE}; }
.lp-eyebrow.left { text-align: left; } .lp-eyebrow.light { color: ${PINK}; text-align: center; }
.lp-h2 { margin: 0; font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: clamp(34px, 4.6vw, 58px); line-height: 1.1; text-wrap: balance; }
.lp-h2.left { text-align: left; } .lp-h2.light { color: #FBF8F3; text-align: center; }
.lp-h2.ko { font-size: clamp(28px, 3.8vw, 46px); }
.lp-lead { margin: 22px auto 0; max-width: 640px; font-size: 17px; line-height: 1.8; color: ${BASE}; }
.lp-lead.left { margin-left: 0; text-align: left; } .lp-muted { color: ${LIGHT}; font-size: 15.5px; margin-top: 16px; }

.lp-phones { margin: 64px auto 0; display: flex; justify-content: center; align-items: flex-start; gap: clamp(16px, 3vw, 40px); }
.lp-phone { width: clamp(150px, 24vw, 270px); border-radius: 34px; padding: 7px; background: #1d241f; box-shadow: 0 30px 60px rgba(40,50,45,.28); flex-shrink: 0; }
.lp-phone img { display: block; width: 100%; height: auto; border-radius: 28px; }
.lp-phones .lp-phone:nth-child(2) { margin-top: 36px; }

.lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding-top: 100px; }
.lp-card { text-align: left; padding: 22px 22px 28px; border-radius: 32px; background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(246,243,234,.7)); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 16px 40px rgba(40,60,45,.10); overflow: hidden; }
.lp-card-art { height: 230px; border-radius: 22px; background-image: var(--home-sky-day); background-color: #F4EEE5; display: flex; align-items: center; justify-content: center; gap: 4px; overflow: hidden; margin-bottom: 22px; }
.lp-card-art-shot { align-items: flex-start; }
.lp-card-art-shot img { width: 56%; height: auto; border-radius: 18px 18px 0 0; margin-top: 22px; box-shadow: 0 10px 30px rgba(40,50,45,.25); }
.lp-card h3 { margin: 0 0 8px; font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: 28px; line-height: 1.15; }
.lp-card h3.ko, .lp-dark-card h3.ko { font-family: 'KoDisplay', 'Pretendard', serif; font-weight: 400; font-size: 20px; line-height: 1.4; }
.lp-card p { margin: 0; font-size: 15px; line-height: 1.7; color: ${BASE}; }

.lp-split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 56px; align-items: center; text-align: left; }
.lp-split-art { display: flex; justify-content: center; }
.lp-split-art .lp-phone { width: clamp(200px, 26vw, 290px); }

.lp-dark { margin: 120px 16px 0; padding: 96px max(24px, calc((100vw - 1100px) / 2)); border-radius: 48px; background: ${INK}; color: #FBF8F3; text-align: center; }
.lp-dark-cards { margin-top: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.lp-dark-card { text-align: left; padding: 28px 26px 32px; border-radius: 28px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); }
.lp-dark-card h3 { margin: 0 0 12px; font-family: var(--font-display), Georgia, serif; font-weight: 400; font-size: 27px; line-height: 1.15; color: #FBF8F3; }
.lp-dark-card p { margin: 0; font-size: 15px; line-height: 1.75; color: rgba(251,248,243,.78); }

.lp-faq { max-width: 820px; text-align: left; }
.lp-q { border-bottom: 1px solid rgba(46,60,51,.14); }
.lp-faq .lp-h2 { margin-bottom: 28px; }
.lp-q button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 22px 0; border: 0; background: transparent; font: inherit; font-size: 17px; font-weight: 600; color: ${INK}; text-align: left; cursor: pointer; }
.lp-q p { margin: 0 0 22px; font-size: 15.5px; line-height: 1.8; color: ${BASE}; max-width: 700px; }

.lp-end { text-align: center; padding: 140px 24px 120px; }
.lp-end .lp-h2 { margin-bottom: 30px; }

.lp-footer { max-width: 1100px; margin: 0 auto; padding: 28px 24px 48px; display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 13.5px; color: ${LIGHT}; border-top: 1px solid rgba(46,60,51,.1); }
.lp-footer nav { display: flex; gap: 22px; flex-wrap: wrap; }
.lp-footer a:hover { color: ${INK}; }

@media (max-width: 860px) {
  .lp-links { display: none; }
  .lp-cards, .lp-dark-cards { grid-template-columns: 1fr; }
  .lp-split { grid-template-columns: 1fr; gap: 40px; }
  .lp-section { padding-top: 88px; }
  .lp-phones { gap: 10px; }
  .lp-phone { width: 30vw; border-radius: 18px; padding: 4px; }
  .lp-phone img { border-radius: 14px; }
  .lp-phones .lp-phone:nth-child(2) { margin-top: 20px; }
  .lp-hero { margin: 68px 10px 0; border-radius: 34px; }
  .lp-hero-inner { grid-template-columns: 1fr; gap: 8px; padding: 36px 22px 84px; text-align: center; }
  .lp-hero-art { order: -1; }
  .lp-tulip { width: min(104%, 430px, 52vh); margin: -2% -2% 0 -2%; }
  .lp-hero-text { align-items: center; }
  .lp-dark { margin: 88px 10px 0; border-radius: 34px; padding: 72px 20px; }
  .lp-nav { padding: 0 14px; }
  .lp-pill { display: none; }
}
`;
