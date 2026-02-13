'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { User } from '@supabase/supabase-js';
import CommunityFeed from '../../src/components/CommunityFeed';
import ImageUploadModal from '../../src/components/ImageUploadModal';
import Auth from '../../src/components/Auth';

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const t = {
    searchPlaceholder: language === 'ko' ? '꿈 검색...' : 'Search dreams...',
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 0, 0, 0.1)',
          borderTopColor: '#333',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: language === 'ko'
        ? "'S-CoreDream', -apple-system, sans-serif"
        : "'Roboto', -apple-system, sans-serif"
    }}>
      {/* Header - Cosmos Style */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        zIndex: 100,
        padding: '0.75rem clamp(0.75rem, 3vw, 1.5rem)',
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          position: 'relative',
        }}>
          {/* Home Icon - Left */}
          <button
            onClick={() => window.location.href = '/'}
            style={{
              position: 'absolute',
              left: 0,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#9BC88B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>

          {/* Search Bar - Centered */}
          <div style={{
            width: '100%',
            maxWidth: '480px',
            position: 'relative'
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '12px 14px 12px 44px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                fontSize: '0.95rem',
                background: '#fafafa',
                outline: 'none',
                color: '#333',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = '#fafafa';
              }}
            />
          </div>

          {/* Right buttons container */}
          <div style={{
            position: 'absolute',
            right: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {/* Add Button */}
            <button
              onClick={() => {
                if (user) {
                  setShowUploadModal(true);
                } else {
                  window.location.href = '/';
                }
              }}
              style={{
                background: '#9BC88B',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.3s',
              }}
            >
              <div style={{ width: '18px', height: '2px', background: '#333', borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }}></div>
              <div style={{ width: '18px', height: '2px', background: '#333', borderRadius: '2px', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }}></div>
              <div style={{ width: '18px', height: '2px', background: '#333', borderRadius: '2px', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }}></div>
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Menu Sidebar */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9998,
              backdropFilter: 'blur(2px)'
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'min(280px, 80vw)',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-2px 0 20px rgba(0,0,0,0.1)',
            zIndex: 9999,
            padding: '0',
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: language === 'ko' ? "'S-CoreDream', -apple-system, sans-serif" : "'Roboto', -apple-system, sans-serif"
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

            {/* Scrollable Menu Content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingTop: '1rem' }}>
              {/* Menu Items */}
              <button
                onClick={() => { window.location.href = '/'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>{language === 'ko' ? '홈' : 'Home'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                <span>{language === 'ko' ? '드림 저널' : 'Dream Journal'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{language === 'ko' ? '캘린더' : 'Calendar'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                <span>{language === 'ko' ? '리플렉션' : 'Reflection'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{language === 'ko' ? '먼슬리 리뷰' : 'Monthly Review'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/community'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>{language === 'ko' ? '살구정원' : 'Apricot Garden'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/pricing'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>{language === 'ko' ? '요금제' : 'Pricing'}</span>
              </button>

              <button
                onClick={() => { window.location.href = '/archetype-test'; setMenuOpen(false); }}
                style={{ padding: '1rem 2rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', color: 'var(--matcha-dark)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>{language === 'ko' ? '나의 아키타입' : 'My Archetype'}</span>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(127, 176, 105, 0.2)', margin: '1rem 0' }}></div>

              {/* Language Toggle */}
              <div style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1rem', color: 'var(--matcha-dark)', fontWeight: '500' }}>
                  {language === 'ko' ? '언어' : 'Language'}
                </div>
                <button
                  onClick={() => {
                    const newLang = language === 'en' ? 'ko' : 'en';
                    setLanguage(newLang);
                    localStorage.setItem('preferredLanguage', newLang);
                  }}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '36px',
                    background: language === 'en' ? 'var(--matcha-green)' : '#9ca3af',
                    borderRadius: '18px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: language === 'en' ? '44px' : '4px',
                    width: '28px',
                    height: '28px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}></div>
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: language === 'en' ? '10px' : '48px',
                    transform: 'translateY(-50%)',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    opacity: 0.9
                  }}>
                    {language === 'en' ? 'EN' : 'KO'}
                  </span>
                </button>
              </div>

              {/* Guest user - Show Sign In/Sign Up */}
              {!user && (
                <>
                  <div style={{ height: '1px', background: 'rgba(127, 176, 105, 0.2)', margin: '1rem 0' }}></div>
                  <div style={{ padding: '1rem 2rem' }}>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowLoginPrompt(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                        <polyline points="10 17 15 12 10 7"></polyline>
                        <line x1="15" y1="12" x2="3" y2="12"></line>
                      </svg>
                      {language === 'ko' ? '로그인 / 회원가입' : 'Sign In / Sign Up'}
                    </button>
                  </div>
                </>
              )}

              {/* Divider before social links */}
              <div style={{ height: '1px', background: 'rgba(127, 176, 105, 0.2)', margin: '1rem 0' }}></div>

              {/* Social Media Links */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem 2rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <a
                  href="https://instagram.com/novakitz"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(127, 176, 105, 0.1)',
                    color: '#7fb069',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37"></path>
                    <circle cx="17.5" cy="6.5" r="1.5"></circle>
                  </svg>
                </a>
                <a
                  href="mailto:contact@novakitz.shop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(127, 176, 105, 0.1)',
                    color: '#7fb069',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                >
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

      {/* Feed */}
      <main style={{ padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
        <CommunityFeed
          user={user}
          language={language}
          refreshKey={refreshKey}
        />
      </main>

      {/* Upload Modal */}
      {showUploadModal && user && (
        <ImageUploadModal
          user={user}
          language={language}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && !user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(127, 176, 105, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
            position: 'relative',
            textAlign: 'center',
            border: '1px solid rgba(127, 176, 105, 0.2)'
          }}>
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(127, 176, 105, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '16px',
                cursor: 'pointer',
                color: 'var(--matcha-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
              }}
            >
              ✕
            </button>

            {/* Friendly Welcome Message */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: '600',
                color: 'var(--matcha-dark)',
                marginBottom: '0.75rem',
                fontFamily: language === 'ko' ? "'S-CoreDream', -apple-system, sans-serif" : "'Georgia', serif",
                letterSpacing: language === 'ko' ? '0' : '0.5px'
              }}>
                {language === 'ko'
                  ? '꿈을 Brew 하고 싶으신가요?'
                  : 'Want to brew your dreams?'}
              </h2>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--sage)',
                lineHeight: '1.6',
                marginBottom: '0.5rem'
              }}>
                {language === 'ko'
                  ? '가입하고 무의식의 메시지를 발견하세요'
                  : 'Join us and discover messages from your unconscious'}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--matcha-green)',
                fontWeight: '500',
                background: 'rgba(127, 176, 105, 0.1)',
                padding: '6px 12px',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                {language === 'ko'
                  ? 'Free: 월 7회 AI 분석'
                  : 'Free: 7 AI analyses/month'}
              </p>
            </div>

            {/* Google Sign In Button */}
            <Auth onAuthSuccess={() => setShowLoginPrompt(false)} />

            {/* Maybe Later */}
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{
                marginTop: '1rem',
                padding: '8px 20px',
                background: 'none',
                border: 'none',
                color: 'var(--sage)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--matcha-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--sage)';
              }}
            >
              {language === 'ko' ? '나중에 할게요' : 'Maybe later'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
