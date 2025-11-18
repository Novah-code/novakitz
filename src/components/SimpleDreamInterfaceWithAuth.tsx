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
import MonthlyDreamReport from './MonthlyDreamReport';
import AIUsageWidget from './AIUsageWidget';

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    dreamJournal: 'Dream Journal',
    history: 'History',
    insights: 'Insights',
    streak: 'Streak',
    badges: 'Badges',
    monthlyReport: 'Monthly Report',
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
    monthlyReport: '월간 리포트',
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
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const t = translations[language];

  // Check if user has a completed profile
  const checkUserProfile = async (userId: string) => {
    console.log('checkUserProfile called for userId:', userId);
    try {
      // Shorter timeout - 5 seconds max
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('Profile query timeout - returning true (assume completed)');
          resolve(true); // Return true on timeout to avoid showing profile form
        }, 5000);
      });

      const queryPromise = (async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', userId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking profile:', error);
            return true; // Default to true on error
          }

          if (data && (data.profile_completed === true || data.profile_completed === 'true')) {
            console.log('Profile completed');
            return true;
          }

          console.log('Profile not completed');
          return false;
        } catch (queryError) {
          console.error('Exception in queryPromise:', queryError);
          return true; // Default to true on exception
        }
      })();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log('checkUserProfile final result:', result);
      return result;
    } catch (error) {
      console.error('Error checking profile:', error);
      return true; // Default to true on error
    }
  };

  useEffect(() => {
    // Load preferred language from localStorage on mount
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Get initial session
    const initAuth = async () => {
      try {
        // Add timeout for entire initialization - max 10 seconds
        const initTimeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('Auth initialization timeout - forcing to complete');
            setLoading(false);
            setCheckingProfile(false);
            resolve();
          }, 10000);
        });

        const initPromise = (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            console.log('Initial session check - user:', currentUser?.id);
            setUser(currentUser);

            if (currentUser) {
              // Check if user has profile
              const profileExists = await checkUserProfile(currentUser.id);
              console.log('Initial profile check result:', profileExists);
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
        })();

        await Promise.race([initPromise, initTimeoutPromise]);
      } catch (error) {
        console.error('Unexpected error in initAuth:', error);
        setLoading(false);
        setCheckingProfile(false);
      }
    };

    initAuth();

    // Listen for auth changes (only on login/logout, skip INITIAL_SESSION to avoid race condition)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);

      // Only handle SIGNED_IN (actual sign in) and SIGNED_OUT
      // Skip INITIAL_SESSION and TOKEN_REFRESHED to avoid race conditions
      if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN - updating user state');
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser && hasProfile === null) {
          // Only check profile if we haven't checked yet
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
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT - clearing user');
        setUser(null);
        setHasProfile(null);
        setCheckingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check premium status when user changes
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        return;
      }

      try {
        // Get premium plan ID first
        const { data: premiumPlans } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('plan_slug', 'premium')
          .maybeSingle();

        const premiumPlanId = premiumPlans?.id;
        console.log('📋 Premium plan ID:', premiumPlanId);

        if (!premiumPlanId) {
          console.log('❌ Could not find premium plan');
          setIsPremium(false);
          return;
        }

        // Get user subscription
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('id, status, plan_id, expires_at')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .maybeSingle();

        if (subscription) {
          // Check if subscription is not expired
          const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();

          console.log('📋 Subscription details:', {
            subscription_id: subscription.id,
            status: subscription.status,
            plan_id: subscription.plan_id,
            premium_plan_id: premiumPlanId,
            expires_at: subscription.expires_at,
            isExpired
          });

          if (!isExpired) {
            const isPremiumValue = subscription.plan_id === premiumPlanId;
            console.log('✅ Setting isPremium to:', isPremiumValue, 'because plan_id matches premium_plan_id');
            setIsPremium(isPremiumValue);
          } else {
            console.log('⏳ Subscription expired, setting isPremium to false');
            setIsPremium(false);
          }
        } else {
          console.log('❌ No subscription found');
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

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
          console.log('Profile completed, setting hasProfile to true');
          setHasProfile(true);
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

              <button
                onClick={() => {
                  console.log('Monthly Report button clicked!');
                  setShowMonthlyReport(true);
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
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>{t.monthlyReport}</span>
              </button>

              <div style={{
                height: '1px',
                background: 'rgba(127, 176, 105, 0.2)',
                margin: '1rem 2rem'
              }}></div>

              {/* Subscription Status */}
              <button
                onClick={() => {
                  if (!isPremium) {
                    window.open(process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL || 'https://novakitz.gumroad.com/l/novakitz', '_blank');
                  }
                  setMenuOpen(false);
                }}
                style={{
                  padding: '1rem 2rem',
                  background: isPremium ? 'rgba(127, 176, 105, 0.1)' : 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: isPremium ? 'default' : 'pointer',
                  fontSize: '1rem',
                  color: isPremium ? 'var(--matcha-green)' : 'var(--matcha-dark)',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!isPremium) {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPremium) {
                    e.currentTarget.style.background = 'none';
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: '600' }}>
                    {isPremium ? '👑 Premium' : '💎 Upgrade to Premium'}
                  </span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: '400' }}>
                    {isPremium ? 'You have Premium access' : 'Unlimited AI & More'}
                  </span>
                </div>
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
                  onClick={() => {
                    const newLanguage = language === 'en' ? 'ko' : 'en';
                    setLanguage(newLanguage);
                    localStorage.setItem('preferredLanguage', newLanguage);
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

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'rgba(127, 176, 105, 0.2)',
                margin: '1rem 0'
              }}></div>

              {/* Social Media Links */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '0 2rem',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* Instagram */}
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
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37"></path>
                    <circle cx="17.5" cy="6.5" r="1.5"></circle>
                  </svg>
                </a>

                {/* Email */}
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
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Email"
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

      {/* AI Usage Widget - Top Left */}
      {user && (
        <AIUsageWidget user={user} />
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

      {/* Monthly Dream Report Modal */}
      {showMonthlyReport && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: 0 }}>📊 {t.monthlyReport}</h2>
              <button
                onClick={() => setShowMonthlyReport(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>
            <MonthlyDreamReport user={user} language={language} />
          </div>
        </div>
      )}
    </>
  );
}
