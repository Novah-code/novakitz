'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';

export default function SimpleDreamInterfaceWithAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: 'var(--matcha-dark)',
            fontSize: '1.1rem'
          }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%'
        }}>
          <Auth onAuthSuccess={() => {}} />
        </div>
      </div>
    );
  }

  // Show main app when logged in
  return (
    <>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        fontFamily: "Georgia, 'Times New Roman', serif"
      }}>
        {/* Left: Hamburger Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'all 0.3s'
            }}
            aria-label="Menu"
          >
            <div style={{
              width: '24px',
              height: '2px',
              background: 'var(--matcha-dark)',
              borderRadius: '2px',
              transition: 'all 0.3s',
              transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none'
            }}></div>
            <div style={{
              width: '24px',
              height: '2px',
              background: 'var(--matcha-dark)',
              borderRadius: '2px',
              transition: 'all 0.3s',
              opacity: menuOpen ? 0 : 1
            }}></div>
            <div style={{
              width: '24px',
              height: '2px',
              background: 'var(--matcha-dark)',
              borderRadius: '2px',
              transition: 'all 0.3s',
              transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
            }}></div>
          </button>

          <span style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--matcha-dark)'
          }}>Novakitz</span>
        </div>

        {/* Right: User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            color: 'var(--matcha-dark)',
            fontSize: '0.9rem',
            display: window.innerWidth > 640 ? 'block' : 'none'
          }}>
            {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
          </span>
        </div>
      </div>

      {/* Hamburger Menu Sidebar */}
      {menuOpen && (
        <>
          {/* Backdrop */}
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

          {/* Sidebar */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
            zIndex: 9999,
            padding: '80px 0 20px 0',
            fontFamily: "Georgia, 'Times New Roman', serif",
            animation: 'slideIn 0.3s ease-out'
          }}>
            <style>{`
              @keyframes slideIn {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}</style>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '1rem 2rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--matcha-dark)',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🏠</span>
                <span>Dream Journal</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  // Trigger history view - we'll need to pass this to SimpleDreamInterface
                }}
                style={{
                  padding: '1rem 2rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--matcha-dark)',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📖</span>
                <span>History</span>
              </button>

              <div style={{
                height: '1px',
                background: 'rgba(127, 176, 105, 0.2)',
                margin: '1rem 2rem'
              }}></div>

              {/* Language Selection */}
              <div style={{
                padding: '1rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--sage)',
                  fontWeight: '500',
                  marginBottom: '0.25rem'
                }}>
                  Language
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => setLanguage('en')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: language === 'en' ? 'rgba(127, 176, 105, 0.2)' : 'rgba(127, 176, 105, 0.05)',
                      border: language === 'en' ? '2px solid var(--matcha-green)' : '2px solid rgba(127, 176, 105, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'var(--matcha-dark)',
                      fontWeight: language === 'en' ? '600' : '400',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => setLanguage('ko')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: language === 'ko' ? 'rgba(127, 176, 105, 0.2)' : 'rgba(127, 176, 105, 0.05)',
                      border: language === 'ko' ? '2px solid var(--matcha-green)' : '2px solid rgba(127, 176, 105, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'var(--matcha-dark)',
                      fontWeight: language === 'ko' ? '600' : '400',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                  >
                    🇰🇷 한국어
                  </button>
                </div>
              </div>

              <div style={{
                height: '1px',
                background: 'rgba(127, 176, 105, 0.2)',
                margin: '1rem 2rem'
              }}></div>

              {/* User Info */}
              <div style={{
                padding: '1rem 2rem',
                fontSize: '0.9rem',
                color: 'var(--sage)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>👤</span>
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--matcha-dark)' }}>
                    {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    {user.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  padding: '1rem 2rem',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#dc3545',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add padding to account for fixed nav */}
      <div style={{ paddingTop: '60px' }}>
        <SimpleDreamInterface user={user} />
      </div>
    </>
  );
}
