'use client';

import type { ReactNode } from 'react';
import { PersonIcon, SparkIcon, StarIcon, GearIcon, ChevronIcon } from './menuIcons';

/**
 * The small glass menu that opens under the gear.
 *
 * It used to be a seven-row drawer sliding over the whole right side of the
 * screen. Now that the places live in the bottom tab bar there are four things
 * left, and four rows do not need a drawer — they need a card under the thing
 * that was tapped, which is what the reference apps do.
 *
 *   signed in   their name and "View profile"
 *   guest       "Sign in / Sign up", since there is no profile to view
 *   Pro         "Get Pro" while on the free plan, "Active" once subscribed
 *   Archetype   the test
 *   Settings    the sheet that holds everything else
 *
 * Inline styles only: Tailwind is not imported here (§16).
 */

interface AccountMenuProps {
  language: 'en' | 'ko';
  signedIn: boolean;
  isPremium: boolean;
  name: string;
  avatarUrl: string | null;
  initial: string;
  onClose: () => void;
  onProfile: () => void;
  onSignIn: () => void;
  onPro: () => void;
  onArchetype: () => void;
  onSettings: () => void;
}

// Titles in a deep green-grey, icons and accents in the app's green, so the two
// read as different things instead of one wash of colour.
const INK = '#2E3C33';
const ACCENT = '#5d6e63';

const COPY = {
  en: {
    viewProfile: 'View profile',
    signIn: 'Sign in / Sign up',
    signInSub: 'Keep your mornings',
    getPro: 'Get Pro',
    getProSub: 'Monthly review and patterns',
    pro: 'Novakitz Pro',
    proSub: 'Active',
    archetype: 'My Archetype',
    archetypeSub: 'Take the test',
    settings: 'Settings',
    guest: 'Guest',
  },
  ko: {
    viewProfile: '프로필 보기',
    signIn: '로그인 / 회원가입',
    signInSub: '아침을 저장해두세요',
    getPro: 'Pro 시작하기',
    getProSub: '월간 리뷰와 패턴',
    pro: 'Novakitz Pro',
    proSub: '이용 중',
    archetype: '나의 아키타입',
    archetypeSub: '테스트 해보기',
    settings: '설정',
    guest: '게스트',
  },
} as const;

function Row({ icon, title, subtitle, onClick, chevron = true }: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  chevron?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 12px',
        border: 'none',
        borderRadius: '18px',
        background: 'transparent',
        color: INK,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0, color: ACCENT }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '15.5px', fontWeight: 600 }}>{title}</span>
        {subtitle && <span style={{ fontSize: '12.5px', fontWeight: 500, opacity: 0.62, marginTop: '1px' }}>{subtitle}</span>}
      </span>
      {chevron && <span style={{ opacity: 0.4, display: 'flex' }}><ChevronIcon size={16} /></span>}
    </button>
  );
}

function Face({ url, initial }: { url: string | null; initial: string }) {
  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: ACCENT,
        // The pebbles' own tones, so the face belongs with what it opens.
        background:
          'radial-gradient(circle at 28% 24%, rgba(255,214,190,0.95) 0%, rgba(255,214,190,0) 58%), radial-gradient(circle at 78% 80%, rgba(190,178,255,0.85) 0%, rgba(190,178,255,0) 62%), linear-gradient(180deg, #F4F8EF 0%, #E2EEDF 100%)',
        border: '1px solid rgba(255,255,255,0.9)',
      }}
    >
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial}
    </span>
  );
}

export default function AccountMenu(props: AccountMenuProps) {
  const { language, signedIn, isPremium, name, avatarUrl, initial, onClose } = props;
  const t = COPY[language];

  const divider = <div style={{ height: 1, margin: '4px 12px', background: 'rgba(92,112,97,0.12)' }} />;

  return (
    <>
      {/* Catches the tap that means "never mind". Invisible: the screen is not dimmed. */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />

      <div
        role="menu"
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 12px + 46px + 10px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 18px)',
          width: 'min(304px, calc(100vw - 36px))',
          boxSizing: 'border-box',
          zIndex: 9999,
          padding: '8px',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(248,245,237,0.84) 100%)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 18px 48px rgba(40,60,45,0.22), 0 2px 8px rgba(40,60,45,0.08), inset 0 1px 0 rgba(255,255,255,1)',
          transformOrigin: 'top right',
          animation: 'accountMenuIn 0.18s ease-out',
        }}
      >
        <style>{`@keyframes accountMenuIn { from { opacity: 0; transform: scale(0.94) translateY(-6px); } to { opacity: 1; transform: none; } }`}</style>

        {signedIn ? (
          <Row
            icon={<Face url={avatarUrl} initial={initial} />}
            title={name || t.guest}
            subtitle={t.viewProfile}
            onClick={props.onProfile}
          />
        ) : (
          <Row icon={<PersonIcon />} title={t.signIn} subtitle={t.signInSub} onClick={props.onSignIn} />
        )}

        {divider}

        <Row
          icon={<SparkIcon />}
          title={isPremium ? t.pro : t.getPro}
          subtitle={isPremium ? t.proSub : t.getProSub}
          onClick={props.onPro}
        />
        <Row icon={<StarIcon />} title={t.archetype} subtitle={t.archetypeSub} onClick={props.onArchetype} />

        {divider}

        <Row icon={<GearIcon size={22} />} title={t.settings} onClick={props.onSettings} />
      </div>
    </>
  );
}
