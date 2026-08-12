'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArchetypeTestNavProps {
  language: 'en' | 'ko';
  onLanguageChange?: (lang: 'en' | 'ko') => void;
  isLoggedIn?: boolean;
}

export default function ArchetypeTestNav({ language, onLanguageChange, isLoggedIn = false }: ArchetypeTestNavProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const t = {
    home: language === 'ko' ? '홈' : 'Home',
    dreamJournal: language === 'ko' ? '내면의 기록' : 'Inner Journal',
    calendar: language === 'ko' ? '캘린더' : 'Calendar',
    insights: language === 'ko' ? '리플렉션' : 'Reflection',
    monthlyReport: language === 'ko' ? '먼슬리 리뷰' : 'Monthly Review',
    pricing: language === 'ko' ? '요금제' : 'Pricing',
    archetype: language === 'ko' ? '나의 아키타입' : 'My Archetype',
    language: language === 'ko' ? '언어' : 'Language',
    signIn: language === 'ko' ? '로그인 / 회원가입' : 'Sign In / Sign Up',
  };

  const navBtnStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 14,
    padding: '13px 16px',
    borderRadius: 16,
    border: '1px solid transparent',
    background: 'transparent',
    color: '#4A5D4E',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer' as const,
    textAlign: 'left' as const,
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    width: '100%',
  };

  const iconSpanStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 22,
    opacity: 0.6,
    flexShrink: 0,
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '12px',
          cursor: 'pointer',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          transition: 'all 0.3s',
          zIndex: 10000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)'
        }}
        aria-label="Menu"
      >
        <div style={{ width: '24px', height: '2.5px', background: 'var(--matcha-dark)', borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none' }}></div>
        <div style={{ width: '24px', height: '2.5px', background: 'var(--matcha-dark)', borderRadius: '2px', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }}></div>
        <div style={{ width: '24px', height: '2.5px', background: 'var(--matcha-dark)', borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none' }}></div>
      </button>

      {/* Menu Overlay */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,35,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 9998 }}
          />

          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: 'min(280px, 80vw)', height: '100vh',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            borderLeft: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '-15px 0 50px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            padding: '40px 20px 32px', boxSizing: 'border-box',
            animation: 'slideInRight 0.3s ease-out',
            overflow: 'hidden'
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
              <button onClick={() => setMenuOpen(false)} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4A5D4E', boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.5)', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Menu items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
              {/* Home */}
              <button onClick={() => { router.push('/'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </span>
                {t.home}
              </button>

              {/* Dream Journal */}
              <button onClick={() => { router.push('/'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </span>
                {t.dreamJournal}
              </button>

              {/* Calendar */}
              <button onClick={() => { router.push('/'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                {t.calendar}
              </button>

              {/* Reflection */}
              <button onClick={() => { router.push('/'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </span>
                {t.insights}
              </button>

              {/* Monthly Review */}
              <button onClick={() => { router.push('/'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </span>
                {t.monthlyReport}
              </button>

              {/* Pricing */}
              <button onClick={() => { router.push('/pricing'); setMenuOpen(false); }} style={navBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(122,179,130,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <span style={iconSpanStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </span>
                {t.pricing}
              </button>

              {/* My Archetype - current page, highlighted */}
              <button onClick={() => setMenuOpen(false)} style={{ ...navBtnStyle, border: '1px solid rgba(122,179,130,0.4)', background: 'rgba(122,179,130,0.15)', fontWeight: 700, boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' }}>
                <span style={{ ...iconSpanStyle, opacity: 1, color: '#7AB382' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                {t.archetype}
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sign In for guests */}
              {!isLoggedIn && (
                <button
                  onClick={() => { router.push('/'); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(127,176,105,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {t.signIn}
                </button>
              )}

              {/* Language Toggle */}
              {onLanguageChange && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <span style={{ fontSize: '1rem', color: '#4A5D4E', fontWeight: 500 }}>{t.language}</span>
                  <button
                    onClick={() => onLanguageChange(language === 'en' ? 'ko' : 'en')}
                    style={{ position: 'relative', width: '80px', height: '36px', background: language === 'ko' ? '#9ca3af' : 'var(--matcha-green)', borderRadius: '18px', border: 'none', cursor: 'pointer', transition: 'background 0.3s ease', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
                  >
                    <div style={{ position: 'absolute', top: '4px', left: language === 'ko' ? '4px' : '44px', width: '28px', height: '28px', background: 'white', borderRadius: '50%', transition: 'left 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                    <span style={{ position: 'absolute', top: '50%', left: language === 'ko' ? '48px' : '10px', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: 'white', opacity: 0.9 }}>
                      {language === 'ko' ? 'KO' : 'EN'}
                    </span>
                  </button>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(127,176,105,0.2)' }}></div>

              {/* Social icons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a href="https://instagram.com/novakitz" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(127,176,105,0.1)', color: '#7fb069', textDecoration: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37"></path>
                    <circle cx="17.5" cy="6.5" r="1.5"></circle>
                  </svg>
                </a>
                <a href="mailto:contact@novakitz.com"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(127,176,105,0.1)', color: '#7fb069', textDecoration: 'none' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
