'use client';

import type { ReactNode } from 'react';
import { goTo } from '../lib/platform';
import {
  PersonIcon, BellIcon, GlobeIcon, BagIcon, StarIcon, MailIcon, CameraIcon,
  DocIcon, LogoutIcon, ChevronIcon, CheckIcon,
} from './menuIcons';

/**
 * Settings, as a sheet that rises from the bottom. The second reference screen.
 *
 * Everything that used to be scattered — the drawer's footer, the profile
 * modal's account tab, the pricing and legal links that only the pricing page
 * carried — is reachable from one place, grouped the way the reference groups
 * it: where you stand with Pro, then Account, Personalize, Explore, About.
 *
 * It composes things that already exist rather than rebuilding them. Account
 * and Notifications open the profile modal on the right tab, since that is
 * where those controls and the sign-out already live; pricing, the archetype
 * test and the legal pages are the existing routes, reached through goTo for the
 * reason recorded in lib/platform.ts.
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface SettingsSheetProps {
  language: 'en' | 'ko';
  signedIn: boolean;
  isPremium: boolean;
  onClose: () => void;
  onToggleLanguage: () => void;
  /** Opens the profile modal on `tab`. Only called while signed in. */
  onOpenProfile: (tab: 'profile' | 'account' | 'subscription') => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

// Titles in a deep green-grey, icons and accents in the app's green, so the two
// read as different things instead of one wash of colour.
const INK = '#2E3C33';
const ACCENT = '#5C8D63';

const COPY = {
  en: {
    title: 'Settings',
    done: 'Done',
    freeTitle: "You're on the Free plan",
    freeSub: 'Pro adds the monthly review and the patterns across your mornings.',
    seePro: 'See Pro',
    proTitle: "You're on Pro",
    proSub: 'Thank you. Everything is unlocked.',
    manage: 'Manage',
    account: 'Account',
    myAccount: 'My Account',
    signIn: 'Sign in / Sign up',
    personalize: 'Personalize',
    notifications: 'Morning reminder',
    language: 'Language',
    explore: 'Explore',
    pricing: 'Pricing',
    archetype: 'My Archetype',
    about: 'About',
    contact: 'Contact us',
    instagram: 'Instagram',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    refund: 'Refund Policy',
    signOut: 'Sign out',
  },
  ko: {
    title: '설정',
    done: '완료',
    freeTitle: '무료 플랜을 이용 중이에요',
    freeSub: 'Pro는 월간 리뷰와, 아침들이 쌓여 보이는 패턴을 더해줘요.',
    seePro: 'Pro 보기',
    proTitle: 'Pro를 이용 중이에요',
    proSub: '고맙습니다. 모든 기능이 열려 있어요.',
    manage: '관리',
    account: '계정',
    myAccount: '내 계정',
    signIn: '로그인 / 회원가입',
    personalize: '맞춤 설정',
    notifications: '아침 알림',
    language: '언어',
    explore: '둘러보기',
    pricing: '요금제',
    archetype: '나의 아키타입',
    about: '정보',
    contact: '문의하기',
    instagram: '인스타그램',
    terms: '이용약관',
    privacy: '개인정보 처리방침',
    refund: '환불 정책',
    signOut: '로그아웃',
  },
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: '22px' }}>
      {title && <h3 style={{ margin: '0 0 8px 6px', fontSize: '17px', fontWeight: 600, color: INK, letterSpacing: '0.01em' }}>{title}</h3>}
      <div
        style={{
          borderRadius: '22px',
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 4px 16px rgba(40,60,45,0.07), inset 0 1px 0 rgba(255,255,255,1)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ icon, title, trailing, onClick, href, last }: {
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  last?: boolean;
}) {
  const style = {
    width: '100%',
    boxSizing: 'border-box' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '15px 16px',
    border: 'none',
    borderBottom: last ? 'none' : '1px solid rgba(92,112,97,0.10)',
    background: 'transparent',
    color: INK,
    textAlign: 'left' as const,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '15.5px',
    fontWeight: 500,
    WebkitTapHighlightColor: 'transparent',
  };
  const inner = (
    <>
      <span style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0, color: ACCENT }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
      {trailing ?? <span style={{ opacity: 0.4, display: 'flex' }}><ChevronIcon size={16} /></span>}
    </>
  );
  if (href) {
    return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={style}>{inner}</a>;
  }
  return <button type="button" onClick={onClick} style={style}>{inner}</button>;
}

export default function SettingsSheet(props: SettingsSheetProps) {
  const { language, signedIn, isPremium, onClose } = props;
  const t = COPY[language];

  const legal = (label: string, path: string, last?: boolean) => (
    <Row icon={<DocIcon />} title={label} onClick={() => goTo(path)} last={last} />
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10006,
        background: 'rgba(30, 41, 35, 0.38)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <style>{`@keyframes settingsSheetUp { from { transform: translateY(100%); } to { transform: none; } }`}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          // Below the gear (it ends 58px down), so the button above stays whole
          // instead of being cut in half by the sheet's rounded corner.
          top: 'calc(env(safe-area-inset-top, 0px) + 66px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '30px 30px 0 0',
          background:
            'radial-gradient(circle at 8% 0%, rgba(255,196,170,0.40) 0%, rgba(255,196,170,0) 46%), radial-gradient(circle at 100% 6%, rgba(196,182,255,0.38) 0%, rgba(196,182,255,0) 48%), #F6F3EA',
          boxShadow: '0 -10px 40px rgba(30,41,35,0.25)',
          animation: 'settingsSheetUp 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        {/* Grabber, header and the round Done button stay put while the list scrolls. */}
        <div style={{ flexShrink: 0, padding: '10px 18px 0', position: 'relative' }}>
          <div style={{ width: 38, height: 5, borderRadius: 3, background: 'rgba(92,112,97,0.28)', margin: '0 auto 14px' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46 }}>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 600, color: INK }}>{t.title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.done}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 46,
                height: 46,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.95)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(236,243,236,0.92) 100%)',
                boxShadow: '0 4px 14px rgba(40,60,45,0.16), inset 0 1px 0 #fff',
                color: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <CheckIcon size={22} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px calc(env(safe-area-inset-bottom, 0px) + 32px)', WebkitOverflowScrolling: 'touch' }}>
          {/* Where you stand with Pro — the reference leads with this. */}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              marginTop: '8px',
              padding: '18px 18px 16px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.78)',
              border: '1px solid rgba(255,255,255,0.95)',
              boxShadow: '0 6px 20px rgba(40,60,45,0.10), inset 0 1px 0 #fff',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: '-30px',
                bottom: '-48px',
                width: '190px',
                height: '190px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,184,150,0.70) 0%, rgba(210,176,255,0.40) 48%, rgba(210,176,255,0) 72%)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '17px', fontWeight: 600, color: INK }}>{isPremium ? t.proTitle : t.freeTitle}</div>
              <div style={{ marginTop: '4px', fontSize: '13.5px', lineHeight: 1.4, color: INK, opacity: 0.68, maxWidth: '88%' }}>
                {isPremium ? t.proSub : t.freeSub}
              </div>
              <button
                type="button"
                onClick={() => (isPremium ? (signedIn ? props.onOpenProfile('subscription') : goTo('/pricing/')) : goTo('/pricing/'))}
                style={{
                  marginTop: '14px',
                  width: '100%',
                  height: '50px',
                  borderRadius: '25px',
                  border: '1px solid rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fff',
                  background: 'linear-gradient(180deg, #7FB487 0%, #5E9168 100%)',
                  boxShadow: '0 8px 20px rgba(80,130,90,0.32), inset 0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                {isPremium ? t.manage : t.seePro}
              </button>
            </div>
          </div>

          <Section title={t.account}>
            {signedIn
              ? <Row icon={<PersonIcon />} title={t.myAccount} onClick={() => props.onOpenProfile('profile')} last />
              : <Row icon={<PersonIcon />} title={t.signIn} onClick={props.onSignIn} last />}
          </Section>

          <Section title={t.personalize}>
            {signedIn && (
              <Row icon={<BellIcon />} title={t.notifications} onClick={() => props.onOpenProfile('account')} />
            )}
            <Row
              icon={<GlobeIcon />}
              title={t.language}
              onClick={props.onToggleLanguage}
              last
              trailing={
                <span
                  style={{
                    display: 'flex',
                    padding: '3px',
                    borderRadius: '999px',
                    background: 'rgba(92,112,97,0.10)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  {(['en', 'ko'] as const).map((l) => (
                    <span
                      key={l}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '999px',
                        color: language === l ? '#fff' : INK,
                        background: language === l ? 'linear-gradient(180deg,#7FB487,#5E9168)' : 'transparent',
                        opacity: language === l ? 1 : 0.7,
                      }}
                    >
                      {l === 'en' ? 'EN' : '한국어'}
                    </span>
                  ))}
                </span>
              }
            />
          </Section>

          <Section title={t.explore}>
            <Row icon={<BagIcon />} title={t.pricing} onClick={() => goTo('/pricing/')} />
            <Row icon={<StarIcon />} title={t.archetype} onClick={() => goTo('/archetype-test/')} last />
          </Section>

          <Section title={t.about}>
            <Row icon={<MailIcon />} title={t.contact} href="mailto:hello@novakitz.com" />
            <Row icon={<CameraIcon />} title={t.instagram} href="https://instagram.com/novakitz" />
            {legal(t.terms, '/legal/terms/')}
            {legal(t.privacy, '/legal/privacy/')}
            {legal(t.refund, '/legal/refund/', true)}
          </Section>

          {signedIn && (
            <Section title="">
              <Row icon={<LogoutIcon />} title={t.signOut} onClick={props.onSignOut} trailing={<span />} last />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
