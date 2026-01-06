'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';
import UserProfileForm from './UserProfileForm';
import DreamInsights from './DreamInsights';
import StreakPopup from './StreakPopup';
import MonthlyDreamReport from './MonthlyDreamReport';
import DreamCalendar from './DreamCalendar';
import DreamPlaylist from './DreamPlaylist';
import AIUsageWidget from './AIUsageWidget';

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
    language: 'Language',
    signOut: 'Sign Out'
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [dreams, setDreams] = useState<any[]>([]);

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
              {user && (
                <div style={{
                  padding: '1rem 1rem',
                  borderBottom: '1px solid rgba(127, 176, 105, 0.1)',
                  flexShrink: 0
                }}>
                  <AIUsageWidget user={user} />
                </div>
              )}

              {/* Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setShowCalendar(false);
                  setShowPlaylist(false);
                  setShowInsights(false);
                  setShowStreak(false);
                  setShowBadges(false);
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
                onClick={() => {
                  console.log('Dream Journal button clicked!');
                  console.log('Current showHistory state:', showHistory);
                  // Close all other modals first
                  setShowCalendar(false);
                  setShowPlaylist(false);
                  setShowInsights(false);
                  setShowStreak(false);
                  setShowBadges(false);
                  setShowMonthlyReport(false);
                  // Then open history
                  setShowHistory(true);
                  console.log('Setting showHistory to true');
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
                <span>{t.dreamJournal}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Calendar button clicked!');
                  setShowCalendar(true);
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{t.calendar}</span>
              </button>

              <button
                onClick={() => {
                  console.log('Dream Playlist button clicked!');
                  alert(language === 'ko' ? '🎵 준비 중입니다\n\n드림 플레이리스트 기능은 현재 개발 중입니다.\n곧 만나보실 수 있습니다!' : '🎵 Coming Soon\n\nDream Playlist feature is currently under development.\nStay tuned!');
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
                  <circle cx="11" cy="5" r="2"></circle>
                  <path d="M11 7v10"></path>
                  <circle cx="8" cy="14" r="2"></circle>
                  <circle cx="14" cy="14" r="2"></circle>
                  <path d="M8 14v6"></path>
                  <path d="M14 14v6"></path>
                </svg>
                <span>{t.dreamPlaylist}</span>
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
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

      {/* Calendar Modal */}
      {showCalendar && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button
              onClick={() => setShowCalendar(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: '0 0 1.5rem 0' }}>📅 {t.calendar}</h2>
            <div onClick={(e) => e.stopPropagation()}>
              <DreamCalendar
                dreams={dreams}
                onDateSelect={() => {
                  // Handle date selection if needed
                }}
                selectedDate={null}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}
