'use client';

import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';
import UserProfileForm from './UserProfileForm';
import DreamInsights from './DreamInsights';
import StreakPopup from './StreakPopup';
import MonthlyDreamReport from './MonthlyDreamReport';
import DreamCalendar from './DreamCalendar';
import AIUsageWidget from './AIUsageWidget';
import LicenseModal from './LicenseModal';
import ProfileSettings from './ProfileSettings';

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    home: 'Home',
    dreamJournal: 'Dream Journal',
    dreamPlaylist: 'Dream Playlist',
    calendar: 'Calendar',
    history: 'History',
    insights: 'Insights',
    streak: 'Streak',
    badges: 'Badges',
    monthlyReport: 'Monthly Report',
    community: 'Space',
    pricing: 'Pricing',
    language: 'Language',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signIn: 'Sign In'
  },
  ko: {
    loading: '로딩 중...',
    home: '홈',
    dreamJournal: '드림 저널',
    dreamPlaylist: '드림 플레이리스트',
    calendar: '캘린더',
    history: '기록',
    insights: '인사이트',
    streak: '연속 기록',
    badges: '뱃지',
    monthlyReport: '월간 리포트',
    community: '스페이스',
    pricing: '요금제',
    language: '언어',
    signOut: '로그아웃',
    signUp: '회원가입',
    signIn: '로그인'
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);
  const [dreams, setDreams] = useState<any[]>([]);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [calendarSelectedDream, setCalendarSelectedDream] = useState<any | null>(null);

  const t = translations[language];

  // Check if user has a completed profile
  const checkUserProfile = async (userId: string) => {
    console.log('checkUserProfile called for userId:', userId);
    try {
      // Shorter timeout - 5 seconds max
      // Default to false on timeout (show profile form) for new users
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('Profile query timeout - returning false (show profile form)');
          resolve(false); // Return false on timeout to show profile form
        }, 5000);
      });

      const queryPromise = (async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('profile_completed')
            .eq('user_id', userId)
            .maybeSingle();

          console.log('Profile query result - data:', data, 'error:', error);

          // Error code PGRST116 = no matching record (new user, no profile)
          if (error && error.code !== 'PGRST116') {
            console.error('Error checking profile:', error);
            // For other errors, return false to show profile form (safer for new users)
            return false;
          }

          if (data) {
            console.log('Profile data found - profile_completed value:', data.profile_completed, 'type:', typeof data.profile_completed);
            console.log('Boolean check: data.profile_completed === true:', data.profile_completed === true);
            console.log('String check: data.profile_completed === "true":', data.profile_completed === 'true');
            if (data.profile_completed === true || data.profile_completed === 'true') {
              console.log('Profile completed - returning true');
              return true;
            } else {
              console.log('Profile data exists but profile_completed is false/null');
            }
          } else {
            console.log('No profile data found');
          }

          // No data = new user with no profile
          // Or profile not completed
          console.log('Profile not completed or user is new - returning false');
          return false;
        } catch (queryError) {
          console.error('Exception in queryPromise:', queryError);
          // Return false on error to show profile form (safer for new users)
          return false;
        }
      })();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log('checkUserProfile final result:', result);
      return result;
    } catch (error) {
      console.error('Error checking profile:', error);
      // Return false on error to show profile form (safer for new users)
      return false;
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
  }, [hasProfile]);

  // Check premium status when user changes
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setIsLifetime(false);
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
          setIsLifetime(false);
          return;
        }

        // Get user subscription with gumroad_product_id
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('id, status, plan_id, expires_at, gumroad_product_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .maybeSingle();

        if (subscription) {
          // Check if subscription is not expired
          const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date();

          // Check if it's a lifetime subscription
          const isLifetimeValue = subscription.gumroad_product_id?.includes('lifetime') ||
            (subscription.plan_id === premiumPlanId && !subscription.expires_at);

          console.log('📋 Subscription details:', {
            subscription_id: subscription.id,
            status: subscription.status,
            plan_id: subscription.plan_id,
            premium_plan_id: premiumPlanId,
            expires_at: subscription.expires_at,
            gumroad_product_id: subscription.gumroad_product_id,
            isExpired,
            isLifetime: isLifetimeValue
          });

          if (!isExpired) {
            const isPremiumValue = subscription.plan_id === premiumPlanId;
            console.log('✅ Setting isPremium to:', isPremiumValue, 'isLifetime to:', isLifetimeValue);
            setIsPremium(isPremiumValue);
            setIsLifetime(isLifetimeValue);
          } else {
            console.log('⏳ Subscription expired, setting isPremium to false');
            setIsPremium(false);
            setIsLifetime(false);
          }
        } else {
          console.log('❌ No subscription found');
          setIsPremium(false);
          setIsLifetime(false);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
        setIsLifetime(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  // Load dreams for calendar
  useEffect(() => {
    const loadDreams = async () => {
      if (!user) {
        setDreams([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dreams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading dreams:', error);
        } else if (data) {
          setDreams(data);
        }
      } catch (error) {
        console.error('Exception loading dreams:', error);
      }
    };

    loadDreams();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Helper function for guest users clicking on features that require login
  const handleGuestAction = (action: () => void) => {
    if (!user) {
      setIsGuestMode(true);
      setMenuOpen(false);
    } else {
      action();
    }
  };

  // Fetch user profile for ProfileSettings
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const openProfileSettings = async () => {
    setMenuOpen(false);
    await fetchUserProfile();
    setTimeout(() => setShowProfileSettings(true), 150);
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

  // Show profile setup if logged-in user doesn't have a profile
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

  // Show main app (for both logged-in users and guests)
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
            padding: '0',
            fontFamily: language === 'ko' ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif" : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
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

            {/* Scrollable Menu Content */}
            <div style={{
              flex: 1,
              overflow: 'y',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* AI Usage Widget - Top of Menu */}
              <div style={{
                padding: '1rem 1rem',
                borderBottom: '1px solid rgba(127, 176, 105, 0.1)',
                flexShrink: 0
              }}>
                {user ? (
                  <AIUsageWidget user={user} />
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--matcha-dark)', marginBottom: '4px' }}>
                      {language === 'ko' ? '무료 체험 중' : 'Free Trial'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sage)' }}>
                      {language === 'ko' ? '로그인하면 월 7회 AI 분석!' : 'Sign up for 7 AI analyses/month!'}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Profile Button - Only for logged in users */}
              {user && (
                <button
                  onClick={openProfileSettings}
                  style={{
                    padding: '1rem 2rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7FB069 0%, #9BC88B 50%, #B8D4A8 100%)',
                    boxShadow: '0 2px 8px rgba(127, 176, 105, 0.3)',
                  }} />
                </button>
              )}

              <button
                onClick={() => {
                  setShowHistory(false);
                  setShowCalendar(false);
                  setShowInsights(false);
                  setShowStreak(false);
                  setShowMonthlyReport(false);
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
                <span>{t.home}</span>
              </button>

              <button
                onClick={() => handleGuestAction(() => {
                  console.log('Dream Journal button clicked!');
                  // Close all other modals first
                  setShowCalendar(false);
                  setShowInsights(false);
                  setShowStreak(false);
                  setShowMonthlyReport(false);
                  // Then open history
                  setShowHistory(true);
                  setMenuOpen(false);
                })}
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
                <span>{t.dreamJournal}</span>
              </button>

              <button
                onClick={() => handleGuestAction(() => {
                  setShowCalendar(true);
                  setMenuOpen(false);
                })}
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{t.calendar}</span>
              </button>

              <button
                onClick={() => handleGuestAction(() => {
                  setShowInsights(true);
                  setMenuOpen(false);
                })}
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
                onClick={() => handleGuestAction(() => {
                  setShowMonthlyReport(true);
                  setMenuOpen(false);
                })}
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{t.monthlyReport}</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/community';
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>{t.community}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Pricing button clicked!');
                  window.location.href = '/pricing';
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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>{t.pricing}</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/archetype-test';
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
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <span>{language === 'ko' ? '나의 아키타입' : 'My Archetype'}</span>
              </button>

              {/* Subscription Status Section with Glassmorphism */}
              <div style={{
                margin: '0.5rem 0',
                padding: '1rem 0',
                background: isLifetime
                  ? 'linear-gradient(135deg, rgba(255, 182, 193, 0.25) 0%, rgba(255, 218, 233, 0.2) 100%)'
                  : isPremium
                    ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.2) 0%, rgba(144, 238, 144, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(200, 200, 200, 0.15) 0%, rgba(220, 220, 220, 0.1) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderTop: isLifetime
                  ? '1px solid rgba(255, 182, 193, 0.4)'
                  : isPremium
                    ? '1px solid rgba(127, 176, 105, 0.3)'
                    : '1px solid rgba(180, 180, 180, 0.3)',
                borderBottom: isLifetime
                  ? '1px solid rgba(255, 182, 193, 0.4)'
                  : isPremium
                    ? '1px solid rgba(127, 176, 105, 0.3)'
                    : '1px solid rgba(180, 180, 180, 0.3)',
                boxShadow: isLifetime
                  ? 'inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                  : isPremium
                    ? 'inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                    : 'inset 0 1px 2px rgba(255, 255, 255, 0.2)'
              }}>
                <button
                  onClick={() => {
                    if (!isPremium) {
                      window.open(process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL || 'https://novakitz.gumroad.com/l/novakitz', '_blank');
                    }
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: isPremium ? 'default' : 'pointer',
                    fontSize: '1rem',
                    color: isLifetime ? '#E91E63' : isPremium ? 'var(--matcha-green)' : 'var(--matcha-dark)',
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
                  <span style={{ fontSize: '1.5rem' }}>
                    {isLifetime ? '💎' : isPremium ? '👑' : '✨'}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {isLifetime
                        ? 'Lifetime'
                        : isPremium
                          ? 'Premium'
                          : (language === 'ko' ? 'Premium 업그레이드' : 'Upgrade to Premium')}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '400' }}>
                      {isLifetime
                        ? (language === 'ko' ? '평생 이용권' : 'Lifetime access')
                        : isPremium
                          ? (language === 'ko' ? 'Premium 이용 중' : 'You have Premium access')
                          : (language === 'ko' ? '무제한 AI 해석' : 'Unlimited AI & More')}
                    </span>
                  </div>
                </button>

                {/* License Key Input - Only show for non-premium users */}
                {!isPremium && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      // Small delay to allow menu to close before modal opens
                      setTimeout(() => setShowLicenseModal(true), 150);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 2rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'var(--sage)',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                      e.currentTarget.style.color = 'var(--matcha-dark)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = 'var(--sage)';
                    }}
                  >
                    <span style={{ fontWeight: '600' }}>{language === 'ko' ? '라이선스 키 입력' : 'Enter License Key'}</span>
                  </button>
                )}
              </div>

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

              {/* Guest user - Show Sign In/Sign Up */}
              {!user && (
                <div style={{ padding: '1rem 2rem' }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'var(--sage)',
                    marginBottom: '1rem'
                  }}>
                    {language === 'ko' ? '게스트 모드' : 'Guest Mode'}
                  </div>
                  <button
                    onClick={() => setIsGuestMode(true)}
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
              )}

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
          </div>
        </>
      )}

      <SimpleDreamInterface user={user} language={language} initialShowHistory={showHistory} onHistoryClose={() => setShowHistory(false)} onGuestAnalyze={() => setIsGuestMode(true)} />

      {/* Dream Insights Modal */}
      {showInsights && user && (
        <DreamInsights user={user} language={language} onClose={() => setShowInsights(false)} />
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
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: 0 }}>{t.monthlyReport}</h2>
              <button
                onClick={() => setShowMonthlyReport(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>
            <MonthlyDreamReport user={user} language={language} onClose={() => setShowMonthlyReport(false)} />
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => {
                setShowCalendar(false);
                setCalendarSelectedDate(null);
              }}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: '0 0 1.5rem 0' }}>{t.calendar}</h2>
            <div onClick={(e) => e.stopPropagation()}>
              <DreamCalendar
                dreams={dreams}
                onDateSelect={(date) => setCalendarSelectedDate(date)}
                selectedDate={calendarSelectedDate}
              />
            </div>

            {/* Selected Date Dreams */}
            {calendarSelectedDate && (() => {
              const selectedDreams = dreams.filter(dream => {
                let dreamDate: string;
                if (dream.date && typeof dream.date === 'string') {
                  dreamDate = new Date(dream.date).toDateString();
                } else if (dream.created_at) {
                  dreamDate = new Date(dream.created_at).toDateString();
                } else {
                  dreamDate = new Date().toDateString();
                }
                return dreamDate === calendarSelectedDate;
              });

              if (selectedDreams.length === 0) return null;

              return (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(127, 176, 105, 0.2)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--matcha-dark)', marginBottom: '1rem' }}>
                    {new Date(calendarSelectedDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDreams.map(dream => (
                      <button
                        key={dream.id}
                        onClick={() => setCalendarSelectedDream(dream)}
                        style={{
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.08) 0%, rgba(139, 195, 74, 0.05) 100%)',
                          borderRadius: '10px',
                          border: '1px solid rgba(127, 176, 105, 0.15)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(127, 176, 105, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(127, 176, 105, 0.08) 0%, rgba(139, 195, 74, 0.05) 100%)';
                        }}
                      >
                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--matcha-dark)' }}>
                          {dream.title || (language === 'ko' ? '제목 없음' : 'Untitled')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dream Detail Modal (from Calendar) */}
      {calendarSelectedDream && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setCalendarSelectedDream(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '600', color: 'var(--matcha-dark)', paddingRight: '2rem' }}>
              {calendarSelectedDream.title || (language === 'ko' ? '제목 없음' : 'Untitled')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--sage)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {calendarSelectedDream.content?.split('\n\n---\n\n')[0] || ''}
            </p>
            {calendarSelectedDream.tags && calendarSelectedDream.tags.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {calendarSelectedDream.tags.map((tag: string, idx: number) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'rgba(127, 176, 105, 0.15)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--matcha-dark)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* License Key Modal */}
      {user && (
        <LicenseModal
          isOpen={showLicenseModal}
          onClose={() => setShowLicenseModal(false)}
          userId={user.id}
          language={language}
          onSuccess={() => setIsPremium(true)}
        />
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && user && (
        <ProfileSettings
          user={user}
          profile={userProfile}
          language={language}
          onClose={() => setShowProfileSettings(false)}
          onSave={() => {
            setShowProfileSettings(false);
            fetchUserProfile();
          }}
          isPremium={isPremium}
          isLifetime={isLifetime}
        />
      )}

      {/* Auth Modal for Guest Users - Friendly Brew Prompt */}
      {isGuestMode && !user && (
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
            padding: '2.5rem 2rem',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(127, 176, 105, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
            position: 'relative',
            textAlign: 'center',
            border: '1px solid rgba(127, 176, 105, 0.2)'
          }}>
            <button
              onClick={() => setIsGuestMode(false)}
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
            <Auth onAuthSuccess={() => setIsGuestMode(false)} />

            {/* Maybe Later */}
            <button
              onClick={() => setIsGuestMode(false)}
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

    </>
  );
}
