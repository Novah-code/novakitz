'use client';

import { goTo } from '../lib/platform';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import ProfileSettings from './ProfileSettings';
import { identify, forgetUser } from '../lib/revenuecat';

// Translations
const translations = {
  en: {
    loading: 'Loading...',
    home: 'Home',
    dreamJournal: 'Inner Journal',
    dreamPlaylist: 'Dream Playlist',
    calendar: 'Calendar',
    history: 'History',
    insights: 'Reflection',
    streak: 'Streak',
    badges: 'Badges',
    monthlyReport: 'Monthly Review',
    community: 'Apricot Garden',
    pricing: 'Pricing',
    language: 'Language',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signIn: 'Sign In'
  },
  ko: {
    loading: '로딩 중...',
    home: '홈',
    dreamJournal: '내면의 기록',
    dreamPlaylist: '드림 플레이리스트',
    calendar: '캘린더',
    history: '기록',
    insights: '리플렉션',
    streak: '연속 기록',
    badges: '뱃지',
    monthlyReport: '먼슬리 리뷰',
    community: '살구정원',
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
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [calendarSelectedDream, setCalendarSelectedDream] = useState<any | null>(null);

  // Ref to track hasProfile without causing useEffect re-runs
  const hasProfileRef = useRef<boolean | null>(null);

  /*
   * Keep the same person the same object.
   *
   * Supabase hands back a freshly built User on every auth event — a token
   * refresh, a tab regaining focus, a second SIGNED_IN — even when nothing
   * about the account changed. Passing that straight to setUser gives every
   * effect keyed on `user` a new identity to react to, which is why one
   * sign-in showed up in the log as three subscription lookups and three full
   * dream loads. Same id, same object, and those effects go quiet.
   */
  const setUserStable = useCallback((next: User | null) => {
    setUser((prev) => (prev?.id === next?.id ? prev : next));
  }, []);

  const t = translations[language];

  // Keep RevenueCat's identity in step with Supabase auth. Purchases must
  // attach to the signed-in account, since the webhook maps app_user_id
  // straight onto user_subscriptions.user_id.
  useEffect(() => {
    if (user) {
      identify(user.id);
    } else {
      forgetUser();
    }
  }, [user]);

  // Check if user has a completed profile
  /*
   * Does this account already have a profile?
   *
   * Only a definite "no row, or a row with nothing in it" should send someone
   * to Profile Setup. Every other outcome — the query timing out, an error,
   * an exception — used to return false as well, which meant a slow morning
   * put established accounts through a five-step form for a profile they had
   * already filled in. "We could not tell" is not the same answer as "you are
   * new", and guessing wrong in that direction is much worse: a returning user
   * is asked to invent a nickname the database will reject as taken, while a
   * genuinely new user who slips past simply gets a less personal reading
   * until they fill it in from Profile.
   *
   * Three seconds was also short for a cold connection on mobile data, which
   * is exactly when this runs — first launch of the morning.
   */
  const checkUserProfile = async (userId: string) => {
    console.log('checkUserProfile called for userId:', userId);
    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.warn('Profile query timed out; assuming the profile exists rather than re-asking.');
          resolve(true);
        }, 10000);
      });

      const queryPromise = (async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('profile_completed, full_name, display_name')
            .eq('user_id', userId)
            .maybeSingle();

          console.log('Profile query result - data:', data, 'error:', error);

          // Error code PGRST116 = no matching record (new user, no profile).
          // Anything else is a failed lookup, not evidence of a missing profile.
          if (error && error.code !== 'PGRST116') {
            console.error('Could not check profile; assuming it exists:', error);
            return true;
          }

          /*
           * A row at all is an answer.
           *
           * Nothing creates one automatically — no signup trigger writes to
           * this table — so a row exists only because someone finished the
           * form or explicitly chose to set it up later. Requiring a name or
           * profile_completed on top of that meant "set this up later" was not
           * actually later: the form came back on the next launch, every time.
           */
          if (data) {
            console.log('Profile row exists - not asking again');
            return true;
          }
          /*
           * No profile row — but that is not the same as a new account.
           *
           * Rows have gone missing (an abandoned setup, a save that failed),
           * and the person on the other side of that has months of mornings in
           * the app and no interest in filling in a birth date again. So
           * before treating anyone as new, ask whether they have ever used it.
           *
           * Having done anything at all is proof enough. The row is written on
           * the way past so this costs one extra pair of queries once, ever,
           * and never on the path a real new user takes.
           */
          const [dreams, checkins] = await Promise.all([
            supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('user_id', userId),
            supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          ]);
          const used = (dreams.count ?? 0) > 0 || (checkins.count ?? 0) > 0;

          if (used) {
            console.log('No profile row, but this account has history - not a new user');
            await supabase
              .from('user_profiles')
              .upsert({ user_id: userId, profile_completed: false }, { onConflict: 'user_id' });
            return true;
          }

          console.log('No profile row and no history - new user');
          return false;
        } catch (queryError) {
          console.error('Could not check profile; assuming it exists:', queryError);
          return true;
        }
      })();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      console.log('checkUserProfile final result:', result);
      return result;
    } catch (error) {
      console.error('Could not check profile; assuming it exists:', error);
      return true;
    }
  };

  useEffect(() => {
    // Load preferred language
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) setLanguage(savedLanguage);

    let cancelled = false;

    const setupAuth = async () => {
      try {
        // Check for OAuth tokens in URL hash (implicit flow return from Google)
        // We do this manually because Supabase's detectSessionInUrl handler
        // throws an uncaught error when there's also a stale stored session.
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
          const params = new URLSearchParams(hash.slice(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            console.log('OAuth tokens found in hash, calling setSession...');
            // Sign out any stale session first to prevent 401 race conditions
            await supabase.auth.signOut({ scope: 'local' });
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);

            if (!error && data.session && !cancelled) {
              console.log('setSession success, user:', data.session.user.id);
              setUserStable(data.session.user);
              setCheckingProfile(true);
              const profileExists = await checkUserProfile(data.session.user.id);
              if (cancelled) return;
              hasProfileRef.current = profileExists;
              setHasProfile(profileExists);
              setCheckingProfile(false);
              setLoading(false);
              return;
            }
            console.error('setSession error:', error);
          }
        }

        // Normal load: read session from storage
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        const currentUser = session?.user ?? null;
        console.log('Stored session user:', currentUser?.id ?? 'null');
        setUserStable(currentUser);

        if (currentUser && hasProfileRef.current === null) {
          setCheckingProfile(true);
          const profileExists = await checkUserProfile(currentUser.id);
          if (cancelled) return;
          hasProfileRef.current = profileExists;
          setHasProfile(profileExists);
          setCheckingProfile(false);
        } else {
          setCheckingProfile(false);
        }

        if (!cancelled) setLoading(false);
      } catch (error) {
        console.error('Auth setup error:', error);
        if (!cancelled) {
          setLoading(false);
          setCheckingProfile(false);
        }
      }
    };

    setupAuth();

    // Listen for future auth events (sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, '| user:', session?.user?.id ?? 'null');

      if (event === 'TOKEN_REFRESHED') {
        if (!cancelled) setUserStable(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        if (cancelled) return;
        setUserStable(null);
        hasProfileRef.current = null;
        setHasProfile(null);
        setCheckingProfile(false);
      } else if (event === 'SIGNED_IN') {
        // Apple's native sheet signs in without leaving the page, so unlike
        // Google's redirect there is no remount for setupAuth() to catch. This
        // event used to be dropped on the assumption that setupAuth() covered
        // it — true only for a sign-in that happens before mount. The result
        // was a session that existed while the app still showed the sign-in
        // screen, with its spinner running forever.
        if (cancelled || !session?.user) return;
        setUserStable(session.user);
        setIsGuestMode(false);
        if (hasProfileRef.current === null) {
          setCheckingProfile(true);
          const profileExists = await checkUserProfile(session.user.id);
          if (cancelled) return;
          hasProfileRef.current = profileExists;
          setHasProfile(profileExists);
          setCheckingProfile(false);
        }
      }
      // INITIAL_SESSION is handled by setupAuth() above
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          // Premium with no expiry date is a lifetime purchase.
          const isLifetimeValue = subscription.plan_id === premiumPlanId && !subscription.expires_at;

          console.log('📋 Subscription details:', {
            subscription_id: subscription.id,
            status: subscription.status,
            plan_id: subscription.plan_id,
            premium_plan_id: premiumPlanId,
            expires_at: subscription.expires_at,
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
        /*
         * The calendar needs a dot on a day and a title to tap — it does not
         * need what was written. `select('*')` pulled every dream's full text
         * *and* its interpretation, plus the image column, which holds a base64
         * data URL whenever a storage upload failed. That is megabytes of
         * payload to draw a grid of dots, downloaded again on every launch.
         * The one dream someone actually opens fetches its own text below.
         */
        const { data, error } = await supabase
          .from('dreams')
          .select('id, title, tags, mood, date, created_at')
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

  /**
   * Open one dream from the calendar, fetching the text the list left behind.
   *
   * Shown immediately with what the calendar already has, so the modal never
   * waits on the network; the body fills in when it arrives.
   */
  const openCalendarDream = async (dream: any) => {
    setCalendarSelectedDream(dream);
    const { data } = await supabase
      .from('dreams')
      .select('content')
      .eq('id', dream.id)
      .maybeSingle();
    if (data) {
      setCalendarSelectedDream((current: any) =>
        current?.id === dream.id ? { ...current, content: data.content } : current
      );
    }
  };

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
        minHeight: '100vh',
        padding: '24px 20px',
        maxWidth: '480px',
        margin: '0 auto'
      }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .skeleton {
            background: linear-gradient(90deg, rgba(127,176,105,0.08) 25%, rgba(127,176,105,0.15) 50%, rgba(127,176,105,0.08) 75%);
            background-size: 800px 100%;
            animation: shimmer 1.4s ease-in-out infinite;
            border-radius: 8px;
          }
        `}</style>
        {/* Header skeleton */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        </div>
        {/* Title skeleton */}
        <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '40%', height: 18, marginBottom: 32 }} />
        {/* Textarea skeleton */}
        <div className="skeleton" style={{ width: '100%', height: 160, marginBottom: 16, borderRadius: 12 }} />
        {/* Button skeleton */}
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 12, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 12 }} />
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
          hasProfileRef.current = true;
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
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: 'calc(env(safe-area-inset-right, 0px) + 20px)',
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
            style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,35,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 9998 }}
          />

          {/* Sidebar */}
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
            fontFamily: language === 'ko' ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif" : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: 'slideInRight 0.3s ease-out',
            overflow: 'hidden'
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

            {/*
              * Room for the hamburger, which is fixed above this panel and
              * turns into an X while the menu is open. The drawer used to carry
              * a second close button of its own, directly under that one — two
              * X's stacked in the same corner, both doing the same thing. The
              * one that stays is the one you already pressed to get here.
              */}
            <div style={{ height: 44, flexShrink: 0 }} />

            {/* Profile button - original style, only for logged in users */}
            {user && (
              <button onClick={openProfileSettings} style={{ padding: '1rem 0.5rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexShrink: 0 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(127,176,105,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7FB069 0%, #9BC88B 50%, #B8D4A8 100%)', boxShadow: '0 2px 8px rgba(127,176,105,0.3)' }} />
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="3" style={{ position: 'absolute', bottom: '-2px', right: '-4px' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>
            )}

            {/* Menu list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
              {/* Home */}
              {(() => {
                const isActive = !showHistory && !showCalendar && !showInsights && !showMonthlyReport;
                return (
                  <button onClick={() => { setShowHistory(false); setShowCalendar(false); setShowInsights(false); setShowStreak(false); setShowMonthlyReport(false); setMenuOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: isActive ? '1px solid rgba(122,179,130,0.4)' : '1px solid transparent', background: isActive ? 'rgba(122,179,130,0.15)' : 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: isActive ? 1 : 0.6, color: isActive ? '#7AB382' : 'currentColor', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </span>
                    {t.home}
                  </button>
                );
              })()}

              {/* Dream Journal */}
              {(() => {
                const isActive = showHistory;
                return (
                  <button onClick={() => handleGuestAction(() => { setShowCalendar(false); setShowInsights(false); setShowStreak(false); setShowMonthlyReport(false); setShowHistory(true); setMenuOpen(false); })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: isActive ? '1px solid rgba(122,179,130,0.4)' : '1px solid transparent', background: isActive ? 'rgba(122,179,130,0.15)' : 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: isActive ? 1 : 0.6, color: isActive ? '#7AB382' : 'currentColor', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                    </span>
                    {t.dreamJournal}
                  </button>
                );
              })()}

              {/* Calendar */}
              {(() => {
                const isActive = showCalendar;
                return (
                  <button onClick={() => handleGuestAction(() => { setShowCalendar(true); setMenuOpen(false); })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: isActive ? '1px solid rgba(122,179,130,0.4)' : '1px solid transparent', background: isActive ? 'rgba(122,179,130,0.15)' : 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: isActive ? 1 : 0.6, color: isActive ? '#7AB382' : 'currentColor', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    {t.calendar}
                  </button>
                );
              })()}

              {/* Reflection */}
              {(() => {
                const isActive = showInsights;
                return (
                  <button onClick={() => handleGuestAction(() => { setShowInsights(true); setMenuOpen(false); })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: isActive ? '1px solid rgba(122,179,130,0.4)' : '1px solid transparent', background: isActive ? 'rgba(122,179,130,0.15)' : 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: isActive ? 1 : 0.6, color: isActive ? '#7AB382' : 'currentColor', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    </span>
                    {t.insights}
                  </button>
                );
              })()}

              {/* Monthly Review */}
              {(() => {
                const isActive = showMonthlyReport;
                return (
                  <button onClick={() => handleGuestAction(() => { setShowMonthlyReport(true); setMenuOpen(false); })}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: isActive ? '1px solid rgba(122,179,130,0.4)' : '1px solid transparent', background: isActive ? 'rgba(122,179,130,0.15)' : 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: isActive ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: isActive ? 'inset 0 2px 5px rgba(255,255,255,0.6), 0 4px 12px rgba(122,179,130,0.1)' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: isActive ? 1 : 0.6, color: isActive ? '#7AB382' : 'currentColor', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </span>
                    {t.monthlyReport}
                  </button>
                );
              })()}

              {/* Pricing */}
              <button onClick={() => { goTo('/pricing/'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: '1px solid transparent', background: 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: 0.6, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </span>
                {t.pricing}
              </button>

              {/* My Archetype */}
              <button onClick={() => { goTo('/archetype-test/'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 16, border: '1px solid transparent', background: 'transparent', color: '#4A5D4E', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, opacity: 0.6, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                {language === 'ko' ? '나의 아키타입' : 'My Archetype'}
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: 20, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Sign In for guests */}
              {!user && (
                <button onClick={() => setIsGuestMode(true)}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(122,179,130,0.18)', color: '#4A5D4E', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', fontFamily: 'inherit' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  {language === 'ko' ? '로그인 / 회원가입' : 'Sign In / Sign Up'}
                </button>
              )}

              {/* Language toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#4A5D4E' }}>{t.language}</span>
                <button onClick={() => { const nl = language === 'en' ? 'ko' : 'en'; setLanguage(nl); localStorage.setItem('preferredLanguage', nl); }}
                  style={{ position: 'relative', width: 56, height: 28, background: '#7AB382', borderRadius: 20, border: 'none', cursor: 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div style={{ position: 'absolute', top: 4, left: language === 'ko' ? 4 : 28, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.3s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                  <span style={{ position: 'absolute', top: '50%', left: language === 'ko' ? 28 : 8, transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'white', letterSpacing: 0.5 }}>{language === 'ko' ? 'KO' : 'EN'}</span>
                </button>
              </div>

              {/* Social links */}
              <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>
                <a href="https://instagram.com/novakitz" target="_blank" rel="noopener noreferrer"
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5D4E', textDecoration: 'none', boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8)', transition: 'all 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="mailto:contact@novakitz.com"
                  style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A5D4E', textDecoration: 'none', boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.8)', transition: 'all 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      <SimpleDreamInterface user={user} language={language} initialShowHistory={showHistory} onHistoryClose={() => setShowHistory(false)} onGuestAnalyze={() => setIsGuestMode(true)} />

      {/* Dream Insights Modal */}
      {showInsights && user && (
        <DreamInsights user={user} language={language} onClose={() => setShowInsights(false)} isPremium={isPremium} onOpenMonthlyReview={() => { setShowInsights(false); setShowMonthlyReport(true); }} />
      )}

      {/* Streak Modal */}
      {showStreak && user && (
        <StreakPopup user={user} language={language} onClose={() => setShowStreak(false)} />
      )}

      {/* Monthly Dream Report Modal */}
      {showMonthlyReport && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', maxWidth: '600px', width: '92%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <MonthlyDreamReport user={user} language={language} onClose={() => setShowMonthlyReport(false)} />
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && user && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(1.25rem, 4vw, 2rem)', maxWidth: '700px', width: '92%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
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
                        onClick={() => openCalendarDream(dream)}
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
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(1.25rem, 4vw, 2rem)', maxWidth: '500px', width: '92%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
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
            padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 3vw, 2rem)',
            maxWidth: '380px',
            width: '92%',
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
