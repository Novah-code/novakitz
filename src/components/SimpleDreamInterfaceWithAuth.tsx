'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';
import UserProfileForm from './UserProfileForm';
import DreamInsights from './DreamInsights';
import BadgesDisplay from './BadgesDisplay';
import StreakPopup from './StreakPopup';

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    dreamJournal: 'Dream Journal',
    history: 'History',
    insights: 'Insights',
    streak: 'Streak',
    badges: 'Badges',
    language: 'Language',
    signOut: 'Sign Out'
  },
  ko: {
    loading: '로딩 중...',
    dreamJournal: '드림 저널',
    history: '기록',
    insights: '인사이트',
    streak: '연속 기록',
    badges: '뱃지',
    language: '언어',
    signOut: '로그아웃'
  }
};

export default function SimpleDreamInterfaceWithAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  const t = translations[language];

  // Check if user has a completed profile
  const checkUserProfile = async (userId: string) => {
    console.log('checkUserProfile called for userId:', userId);
    try {
      // Add timeout - if query takes more than 5 seconds, return false
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn('Profile query timeout - returning false');
          resolve(false);
        }, 5000);
      });

      const queryPromise = (async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        console.log('Profile query result - data:', data, 'error:', error);

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking profile:', error);
          return false;
        }

        if (data) {
          console.log('Profile found! profile_completed:', data.profile_completed);
          return data.profile_completed === true;
        }

        console.log('No profile data found - should show form');
        return false;
      })();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result as boolean;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Check if user has profile
          const profileExists = await checkUserProfile(currentUser.id);
          console.log('Profile check result:', profileExists);
          setHasProfile(profileExists);
          setCheckingProfile(false);
        } else {
          setCheckingProfile(false);
        }

        // Set loading to false AFTER all checks are done
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
        setCheckingProfile(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          setCheckingProfile(true);
          const profileExists = await checkUserProfile(currentUser.id);
          console.log('Profile check result (auth change):', profileExists);
          setHasProfile(profileExists);
          setCheckingProfile(false);
        } catch (error) {
          console.error('Error checking profile on auth change:', error);
          setCheckingProfile(false);
        }
      } else {
        setHasProfile(null);
        setCheckingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('Render check - user:', !!user, 'hasProfile:', hasProfile, 'loading:', loading, 'checkingProfile:', checkingProfile);

  // Only show loading on initial load, not on profile checks
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
            fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
            color: 'var(--matcha-dark)',
            fontSize: '1.1rem'
          }}>{t.loading}</p>
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

  // Show profile setup if user doesn't have a profile
  if (user && hasProfile === false) {
    console.log('Showing profile form for user:', user.id);
    return (
      <UserProfileForm
        user={user}
        onComplete={() => {
          setHasProfile(true);
          // Reload profile to get language preference
          checkUserProfile(user.id);
        }}
      />
    );
  }

  // Show main app when logged in
  return (
    <>
      {/* Hamburger Menu Button (Top Right) */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          transition: 'all 0.3s',
          zIndex: 10000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
        aria-label="Menu"
      >
        <div style={{
          width: '24px',
          height: '2.5px',
          background: 'var(--matcha-dark)',
          borderRadius: '2px',
          transition: 'all 0.3s',
          transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none'
        }}></div>
        <div style={{
          width: '24px',
          height: '2.5px',
          background: 'var(--matcha-dark)',
          borderRadius: '2px',
          transition: 'all 0.3s',
          opacity: menuOpen ? 0 : 1
        }}></div>
        <div style={{
          width: '24px',
          height: '2.5px',
          background: 'var(--matcha-dark)',
          borderRadius: '2px',
          transition: 'all 0.3s',
          transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'
        }}></div>
      </button>

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
            right: 0,
            width: '280px',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-2px 0 20px rgba(0,0,0,0.1)',
            zIndex: 9999,
            padding: '80px 0 20px 0',
            fontFamily: language === 'ko' ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif" : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <style>{`
              @keyframes slideInRight {
                from {
                  transform: translateX(100%);
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>{t.dreamJournal}</span>
              </button>

              <button
                onClick={() => {
                  console.log('History button clicked!');
                  setShowHistory(true);
                  setMenuOpen(false);
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>{t.history}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Insights button clicked!');
                  setShowInsights(true);
                  setMenuOpen(false);
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
                <span>{t.insights}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Streak button clicked!');
                  setShowStreak(true);
                  setMenuOpen(false);
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <span>{t.streak}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Badges button clicked!');
                  setShowBadges(true);
                  setMenuOpen(false);
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path>
                </svg>
                <span>{t.badges}</span>
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
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  fontSize: '1rem',
                  color: 'var(--matcha-dark)',
                  fontWeight: '500'
                }}>
                  {t.language}
                </div>
                <button
                  onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
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
                  {/* Toggle circle */}
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
                  {/* Text */}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>
        </>
      )}

      <SimpleDreamInterface user={user} language={language} initialShowHistory={showHistory} onHistoryClose={() => setShowHistory(false)} />

      {/* Dream Insights Modal */}
      {showInsights && user && (
        <DreamInsights user={user} language={language} onClose={() => setShowInsights(false)} />
      )}

      {/* Badges Modal */}
      {showBadges && user && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowBadges(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowBadges(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: 'var(--matcha-dark)',
                zIndex: 1,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              ×
            </button>
            <BadgesDisplay user={user} language={language} />
          </div>
        </div>
      )}

      {/* Streak Modal */}
      {showStreak && user && (
        <StreakPopup user={user} language={language} onClose={() => setShowStreak(false)} />
      )}
    </>
  );
}
