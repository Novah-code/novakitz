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
import ProfileSettings from './ProfileSettings';
import { identify, forgetUser } from '../lib/revenuecat';
import { isPremiumNow } from '../lib/premium';
import AccountButton from './AccountButton';
import AccountMenu from './AccountMenu';
import SettingsSheet from './SettingsSheet';
import BottomTabBar, { TAB_BAR_HEIGHT, subSwitchSpace, type TabId, type SubId } from './BottomTabBar';
import AffirmationsDisplay from './AffirmationsDisplay';

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
  const [showSettings, setShowSettings] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'account' | 'subscription'>('profile');
  // What the account button shows: their photo, or the first letter of their name.
  const [avatarInfo, setAvatarInfo] = useState<{ url: string | null; initial: string; name: string }>({ url: null, initial: '', name: '' });
  // True while the home screen is in a full-screen step (see SimpleDreamInterface).
  const [immersive, setImmersive] = useState(false);

  /*
   * The drawer's panels are one at a time.
   *
   * Each button used to set only its own flag, so opening Monthly Review from
   * the menu left the Calendar mounted underneath it — the calendar had to be
   * closed by hand before the report was reachable. Only Inner Journal cleared
   * the others, and it did it by listing all four at every call site, which is
   * how the other three came to be missed.
   */
  const openPanel = (panel: 'history' | 'calendar' | 'insights' | 'streak' | 'monthly' | null) => {
    setShowHistory(panel === 'history');
    setShowCalendar(panel === 'calendar');
    setShowInsights(panel === 'insights');
    setShowStreak(panel === 'streak');
    setShowMonthlyReport(panel === 'monthly');
  };
  const [isPremium, setIsPremium] = useState(false);
  const [dreams, setDreams] = useState<any[]>([]);
  /*
   * Mornings where a mood was tapped, keyed by `YYYY-MM-DD`.
   *
   * The calendar rendered here is a second copy — SimpleDreamInterface has its
   * own — and this one is what the menu actually opens. Teaching only the other
   * one to read check-ins left this one still showing an empty month.
   */
  const [checkinsByDate, setCheckinsByDate] = useState<Record<string, { emotion: string | null }>>({});
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
    /*
     * Language on first launch follows the phone, not the network.
     *
     * It used to default to English for everyone and only reach Korean later,
     * from inside the profile form, by sending the request IP to ipapi.co and
     * checking whether the country came back KR. So a Korean speaker opened
     * the app to an English screen, and the fix for that was a round trip to a
     * third party — which is also the reason the App Privacy questionnaire has
     * to declare Coarse Location.
     *
     * `navigator.language` is instant, offline, and more accurate: a Korean
     * speaker abroad still gets Korean, because it follows the phone rather
     * than the address the request came from.
     *
     * A saved choice still wins. Someone who has used the toggle has said what
     * they want, and the system should not overrule that on the next launch.
     */
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    const deviceLanguage = typeof navigator !== 'undefined'
      && navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
    setLanguage(savedLanguage ?? deviceLanguage);

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

  /*
   * Premium status.
   *
   * This used to return early when there was no `user`, because the only
   * source was a `user_subscriptions` row keyed on the Supabase id. That is
   * no longer true: a purchase made while signed out lives on RevenueCat's
   * anonymous app user id, and `isPremiumNow` asks the store when the
   * database has nothing to say. So it now runs whether or not anyone is
   * signed in — otherwise the person who just paid without an account would
   * watch the paywall stay shut.
   *
   * It re-runs on sign-in as well, which is when `identify()` has aliased any
   * anonymous purchase onto the account.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const premium = await isPremiumNow(user?.id ?? null);
      if (!cancelled) setIsPremium(premium);
    })();

    return () => { cancelled = true; };
  }, [user]);

  /*
   * The account button's face. Read once per account rather than from
   * `userProfile`, which is only filled in when settings are opened — the button
   * is on screen long before that.
   */
  useEffect(() => {
    if (!user) {
      setAvatarInfo({ url: null, initial: '', name: '' });
      return;
    }
    let cancelled = false;
    const fallback = (user.user_metadata?.name || user.email || '').toString().trim();
    setAvatarInfo({ url: null, initial: fallback.charAt(0), name: fallback.split('@')[0] });

    (async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('avatar_url, display_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled || !data) return;
        const name = (data.display_name || fallback).toString().trim();
        setAvatarInfo({ url: data.avatar_url || null, initial: name.charAt(0), name: name.split('@')[0] });
      } catch {
        // The letter from the account's own name is already showing.
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Load dreams for calendar
  const loadDreams = useCallback(async () => {
      if (!user) {
        setDreams([]);
        setCheckinsByDate({});
        return;
      }

      try {
        /* Loaded whether or not any dream exists — a month of pebbles and no
           writing is the ordinary case, not an edge one. */
        /*
         * Every check-in for the day, not only the ones filed as 'morning'.
         *
         * The pebble used to be written as an 'evening' row whenever it was
         * tapped after noon, and this query asked for mornings — so an
         * afternoon pebble saved correctly and then never appeared anywhere.
         * New ones are always 'morning' now (see handleEmotionSelect), but the
         * rows already written that way are still in the table and are still
         * days that happened.
         *
         * Keyed by date, so a date holding both an old evening row and a
         * morning row collapses to one square rather than counting twice; the
         * morning wins because the ritual is what that colour is describing.
         */
        const { data: checkinRows } = await supabase
          .from('checkins')
          .select('check_date, time_of_day, emotion')
          .eq('user_id', user.id);
        if (checkinRows) {
          const map: Record<string, { emotion: string | null }> = {};
          const isMorning: Record<string, boolean> = {};
          checkinRows.forEach((c: any) => {
            if (map[c.check_date] && isMorning[c.check_date]) return;
            map[c.check_date] = { emotion: c.emotion ?? null };
            isMorning[c.check_date] = c.time_of_day === 'morning';
          });
          setCheckinsByDate(map);
        }

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
  }, [user]);

  useEffect(() => {
    loadDreams();
  }, [loadDreams]);

  /*
   * And again every time the calendar is opened.
   *
   * This ran on sign-in and never again, so `dreams` and `checkinsByDate` were
   * whatever existed when the app launched. Record a dream at 4am, open the
   * menu, tap Calendar — the morning you just wrote is not there, and will not
   * be until the app is killed and relaunched. It saved correctly every time;
   * the calendar was reading a list fetched before it existed.
   *
   * Refetching on open rather than notifying from each place that writes: the
   * mood flow, the long-press dream form and delete all change what the month
   * should look like, and they sit at different depths under this component.
   * One request when a panel opens is cheaper than keeping three call sites
   * correct, and it cannot go stale by being forgotten at a fourth.
   */
  useEffect(() => {
    if (showCalendar) loadDreams();
  }, [showCalendar, loadDreams]);

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

  const toggleLanguage = () => {
    const next = language === 'en' ? 'ko' : 'en';
    setLanguage(next);
    localStorage.setItem('preferredLanguage', next);
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

  const openProfileSettings = async (tab: 'profile' | 'account' | 'subscription' = 'profile') => {
    setProfileTab(tab);
    setShowSettings(false);
    setMenuOpen(false);
    await fetchUserProfile();
    setTimeout(() => setShowProfileSettings(true), 150);
  };

  /*
   * Which tab is showing, derived from the panel flags rather than stored, so it
   * cannot drift from what is actually on screen.
   */
  const activeTab: TabId =
    showHistory || showCalendar ? 'journal'
    : showInsights || showMonthlyReport ? 'insights'
    : 'today';
  const activeSub: SubId | null =
    showHistory ? 'history'
    : showCalendar ? 'calendar'
    : showInsights ? 'insights'
    : showMonthlyReport ? 'monthly'
    : null;

  const selectTab = (tab: TabId) => {
    setMenuOpen(false);
    if (tab === activeTab) return;
    setCalendarSelectedDate(null);
    if (tab === 'today') {
      openPanel(null);
      return;
    }
    // Guests tapping a place that needs an account get the sign-in panel.
    handleGuestAction(() => openPanel(tab === 'journal' ? 'calendar' : 'insights'));
  };

  const selectSub = (sub: SubId) => {
    setCalendarSelectedDate(null);
    openPanel(sub);
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
      {/*
        Settings gear (top right). It opens the drawer, which now only holds what
        is about the account — the places moved to the bottom tab bar.
      */}
      <AccountButton
        language={language}
        open={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      />

      {/*
        The menu under the gear, and the settings sheet it leads to. They replace
        the old right-hand drawer: the places are the tab bar now, so what is left
        is four rows and a settings screen.
      */}
      {menuOpen && (
        <AccountMenu
          language={language}
          signedIn={!!user}
          isPremium={isPremium}
          name={avatarInfo.name}
          avatarUrl={avatarInfo.url}
          initial={avatarInfo.initial}
          onClose={() => setMenuOpen(false)}
          onProfile={() => openProfileSettings('profile')}
          onSignIn={() => { setMenuOpen(false); setIsGuestMode(true); }}
          onPro={() => { setMenuOpen(false); goTo('/pricing/'); }}
          onArchetype={() => { setMenuOpen(false); goTo('/archetype-test/'); }}
          onSettings={() => { setMenuOpen(false); setShowSettings(true); }}
        />
      )}

      {showSettings && (
        <SettingsSheet
          language={language}
          signedIn={!!user}
          isPremium={isPremium}
          onClose={() => setShowSettings(false)}
          onToggleLanguage={toggleLanguage}
          onOpenProfile={(tab) => openProfileSettings(tab)}
          onSignIn={() => { setShowSettings(false); setIsGuestMode(true); }}
          onSignOut={async () => { setShowSettings(false); await handleSignOut(); }}
        />
      )}

      <SimpleDreamInterface user={user} language={language} initialShowHistory={showHistory} onHistoryClose={() => setShowHistory(false)} onGuestAnalyze={() => setIsGuestMode(true)} onImmersiveChange={setImmersive} />

      {/* Dream Insights Modal */}
      {showInsights && user && (
        <DreamInsights user={user} language={language} onClose={() => setShowInsights(false)} isPremium={isPremium} onOpenMonthlyReview={() => openPanel('monthly')} />
      )}

      {/* Streak Modal */}
      {showStreak && user && (
        <StreakPopup user={user} language={language} onClose={() => setShowStreak(false)} />
      )}

      {/* Monthly Dream Report Modal */}
      {showMonthlyReport && user && (
        <div className="mdr-shell" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'var(--home-sky-day)', backgroundColor: '#F4EEE5', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="home-scene__grain" aria-hidden="true" style={{ position: 'fixed' }} />
          {/*
            * On a phone this is the screen, not a card on it.
            *
            * A 92%-wide card left a dark ring on every side and pushed the
            * month's content into the middle of a 6.9" display. The report is
            * the longest screen in the app, so the gutter cost the most here.
            */}
          <style>{`
            .mdr-card {
              background: transparent;
              position: relative;
              z-index: 2;
              border-radius: 20px;
              max-width: 600px;
              width: 92%;
              max-height: 90vh;
              overflow: hidden;
              box-shadow: none;
            }
            @media (max-width: 640px) {
              .mdr-card {
                width: 100%;
                max-width: none;
                height: 100%;
                max-height: 100%;
                border-radius: 0;
                box-shadow: none;
                /* The report's own header carries the top inset (see .mdr-hdr), so its paper
                   reaches the top edge instead of starting in a band below the status bar. */
                padding-bottom: env(safe-area-inset-bottom);
              }
            }
          `}</style>
          <div className="mdr-card">
            <MonthlyDreamReport user={user} language={language} onClose={() => setShowMonthlyReport(false)} />
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && user && (
        <div className="cal-shell" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'var(--home-sky-day)', backgroundColor: '#F4EEE5', zIndex: 10001, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 64px) 20px 40px' }}>
          <div className="home-scene__grain home-scene__grain--flat" aria-hidden="true" style={{ position: 'fixed' }} />
          {/*
            * No white card around the calendar any more. The sheet brings its
            * own paper, its own shadow and its own month title, so wrapping it
            * put a card inside a card and printed the word "Calendar" directly
            * above the word "August".
            */}
          <div style={{ maxWidth: '560px', width: '100%', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 16, zIndex: 3 }}>
              <button
                onClick={() => {
                  setShowCalendar(false);
                  setCalendarSelectedDate(null);
                }}
                aria-label={language === 'ko' ? '닫기' : 'Close'}
                style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '50%', boxShadow: '0 2px 10px rgba(40,60,45,0.16)', cursor: 'pointer', color: '#2E3C33', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DreamCalendar
                dreams={dreams}
                checkins={checkinsByDate}
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
                <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)', backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 8px 24px rgba(40,60,45,0.12), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#7d8f82', fontFamily: 'monospace', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {new Date(calendarSelectedDate).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedDreams.map(dream => (
                      <button
                        key={dream.id}
                        onClick={() => openCalendarDream(dream)}
                        style={{
                          padding: '14px 18px',
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: '18px',
                          border: '1px solid rgba(255,255,255,0.9)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#2E3C33' }}>
                          {dream.title || (language === 'ko' ? '제목 없음' : 'Untitled')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/*
              Today's affirmation under the calendar. The calendar is the first thing the
              Journal tab shows now, and the month is mostly empty below the grid early on.
              Same card look as the one on Entries; it reads today's saved affirmations, and
              says what fills it when there are none.
            */}
            <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)', backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: '24px', padding: '18px 22px', boxShadow: '0 8px 24px rgba(40,60,45,0.12), inset 0 1px 0 rgba(255,255,255,0.95)', position: 'relative', overflow: 'hidden' }}>
              <span aria-hidden="true" style={{ position: 'absolute', fontSize: '110px', color: '#EDA3BC', opacity: 0.18, right: '16px', top: '-18px', fontFamily: 'serif', pointerEvents: 'none', lineHeight: 1 }}>✧</span>
              <p style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '11px', color: '#7d8f82', letterSpacing: '2px', margin: '0 0 10px', textTransform: 'uppercase', position: 'relative' }}>
                Today&apos;s Affirmation
              </p>
              <div style={{ position: 'relative' }}>
                <AffirmationsDisplay
                  user={user}
                  checkInTime={new Date().getHours() < 12 ? 'morning' : 'evening'}
                  language={language || 'en'}
                  isPremium={isPremium}
                  emptyText={language === 'ko' ? '꿈을 기록하면 오늘의 확언이 여기에 나타나요.' : 'Record a dream and today\'s affirmation will appear here.'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dream Detail Modal (from Calendar) */}
      {calendarSelectedDream && (
        <div onClick={() => setCalendarSelectedDream(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(60,50,70,0.32)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 20500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundImage: 'var(--home-sky-day)', backgroundColor: '#F4EEE5', border: '1px solid rgba(255,255,255,0.85)', borderRadius: '32px', padding: 'clamp(1.5rem, 4vw, 2rem)', maxWidth: '460px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(40,30,60,0.28)', position: 'relative' }}>
            <button
              onClick={() => setCalendarSelectedDream(null)}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
              style={{ position: 'absolute', top: 14, right: 14, width: 40, height: 40, padding: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 10px rgba(40,60,45,0.16)', color: '#2E3C33', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <h3 style={{ margin: '0 0 1rem 0', fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : 'var(--font-display), Georgia, serif', fontSize: language === 'ko' ? '1.3rem' : '1.9rem', fontWeight: language === 'ko' ? 500 : 400, color: '#2E3C33', paddingRight: '3rem', lineHeight: 1.2 }}>
              {calendarSelectedDream.title || (language === 'ko' ? '제목 없음' : 'Untitled')}
            </h3>
            <p style={{ margin: 0, fontSize: '1rem', color: '#4A5D4E', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {calendarSelectedDream.content?.split('\n\n---\n\n')[0] || ''}
            </p>
            {calendarSelectedDream.tags && calendarSelectedDream.tags.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {calendarSelectedDream.tags.map((tag: string, idx: number) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: '12px', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#4A5D4E' }}>
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
          initialTab={profileTab}
        />
      )}

      {/* Auth Modal for Guest Users */}
      {isGuestMode && !user && (
        <div
          onClick={() => setIsGuestMode(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(60,50,70,0.32)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 20600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/*
            The home sky in a rounded frame, like the streak window. The close is
            a round control inside the frame's top right; the frame is padded
            enough at the top that it cannot reach the first button. Tapping the
            backdrop closes the panel as well.
          */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: 'var(--home-sky-day)',
              backgroundColor: '#F4EEE5',
              border: '1px solid rgba(255,255,255,0.85)',
              borderRadius: '32px',
              padding: '34px 24px 26px',
              maxWidth: '380px',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 24px 60px rgba(40,30,60,0.28), inset 0 1px 0 rgba(255,255,255,0.9)',
              textAlign: 'center',
            }}
          >
            <div className="home-scene__grain" aria-hidden="true" />
            <button
              onClick={() => setIsGuestMode(false)}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 3,
                width: 40, height: 40, padding: 0, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 10px rgba(40,60,45,0.16)', color: '#2E3C33', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <p style={{ position: 'relative', zIndex: 2, margin: '4px 0 24px', fontFamily: "var(--font-display), Georgia, serif", fontSize: 36, color: '#2E3C33', lineHeight: 1.1 }}>
              Novakitz
            </p>
            <div style={{ position: 'relative', zIndex: 2 }}>
            {/*
              The sales pitch that used to sit here — a headline asking whether
              you wanted to brew your dreams, and a badge counting the free
              allowance — is gone. Someone who has opened a sign-in panel has
              already decided; what they need is the shortest way to being
              inside, not another round of persuasion.
            */}
            <Auth onAuthSuccess={() => setIsGuestMode(false)} />
            </div>
          </div>
        </div>
      )}

      {/*
        Bottom tab bar — POST_LAUNCH §0.

        Steps aside for anything that wants the whole screen: the drawer, the
        sign-in panel, settings, the streak popup, a selected calendar day, and
        the home screen's own full-screen steps (writing a dream, reading a
        response, the mood flow). The mood flow also sits above it by z-index.
      */}
      {!showSettings && !isGuestMode && !showProfileSettings && !showStreak && !calendarSelectedDream && !immersive && (
        <>
          {/*
            The panels are full-screen overlays that each end at the bottom of
            the screen. Shortening them by the bar's height, rather than adding
            bottom padding inside each one, keeps their own scroll areas and
            headers untouched. The floating switch needs a little more room, so
            only the tabs that have one get it.
          */}
          <style>{`
            .dream-history, .di-shell, .mdr-shell, .cal-shell {
              bottom: calc(env(safe-area-inset-bottom, 0px) + ${TAB_BAR_HEIGHT + subSwitchSpace(activeTab)}px) !important;
            }
          `}</style>
          <BottomTabBar
            language={language}
            active={activeTab}
            sub={activeSub}
            onSelectTab={selectTab}
            onSelectSub={selectSub}
          />
        </>
      )}

    </>
  );
}
