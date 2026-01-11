'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';
import UserProfileForm from './UserProfileForm';

export default function DreamApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load preferred language from localStorage or detect from browser
        const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
        if (savedLanguage) {
          setLanguage(savedLanguage);
        } else {
          // Auto-detect language from browser settings
          const browserLanguage = navigator.language || navigator.languages?.[0];
          const isKorean = browserLanguage?.toLowerCase().startsWith('ko');
          const detectedLanguage = isKorean ? 'ko' : 'en';
          setLanguage(detectedLanguage);
          // Save detected language to localStorage
          localStorage.setItem('preferredLanguage', detectedLanguage);
        }

        // Check for auth messages from URL params
        const error = searchParams.get('error');
        const success = searchParams.get('success');
        const payment = searchParams.get('payment');

        console.log('URL params:', { error, success, payment, hash: window.location.hash });

        if (error) {
          if (error === 'auth_failed') {
            setAuthMessage('로그인에 실패했습니다. 다시 시도해 주세요.');
          } else if (error === 'no_session') {
            setAuthMessage('세션을 찾을 수 없습니다. 다시 로그인해 주세요.');
          } else {
            setAuthMessage('인증 중 오류가 발생했습니다.');
          }
        } else if (success === 'logged_in') {
          // 로그인 성공 알림 제거
          // setAuthMessage('성공적으로 로그인되었습니다! ');
        } else if (payment === 'success') {
          setAuthMessage(language === 'ko' ? ' 결제가 완료되었습니다! 프리미엄 기능을 이용하실 수 있습니다.' : ' Payment successful! You can now enjoy premium features.');
          // Clear payment param from URL after showing message
          setTimeout(() => {
            router.replace('/');
          }, 3000);
        } else if (payment === 'failed') {
          const errorMsg = searchParams.get('error') || (language === 'ko' ? '결제에 실패했습니다.' : 'Payment failed.');
          setAuthMessage(`❌ ${errorMsg}`);
          // Clear payment param from URL
          setTimeout(() => {
            router.replace('/');
          }, 3000);
        }

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Initial session check:', { hasSession: !!session, userId: session?.user?.id, error: sessionError });

        setUser(session?.user ?? null);

        if (session?.user) {
          // Clear URL hash and params after successful auth
          if (window.location.hash || window.location.search) {
            console.log('Clearing URL hash and search params');
            router.replace('/');
          }
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }

        setInitialLoadComplete(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('User logged in, closing auth modal');
        setShowAuth(false);
        // Clear URL after auth
        if (window.location.hash || window.location.search) {
          router.replace('/');
        }
        await loadUserProfile(session.user.id);
      } else {
        console.log('User logged out');
        setUserProfile(null);
        setShowProfileForm(false);
        setLoading(false); // 로그아웃 시에만 로딩 false
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Profile query result:', { data, error });

      if (data) {
        console.log('Profile found:', data);
        setUserProfile(data);
        // Show profile form if profile is not completed
        if (!data.profile_completed) {
          console.log('Profile incomplete, showing form');
          setShowProfileForm(true);
        } else {
          console.log('Profile complete');
          setShowProfileForm(false);
        }
        setLoading(false); // 프로필 로드 완료 후 로딩 종료
      } else {
        // No profile exists - wait a moment for the DB trigger, then try again
        console.log('No profile found, waiting for trigger or creating one');
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (retryData) {
            console.log('Profile found after retry:', retryData);
            setUserProfile(retryData);
            if (!retryData.profile_completed) {
              setShowProfileForm(true);
            }
            setLoading(false);
          } else {
            console.log('Still no profile, creating manually');
            await createUserProfile(userId);
            setLoading(false);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // 오류가 있어도 계속 진행 - 프로필 생성 시도
      await createUserProfile(userId);
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      console.log('Creating profile for user:', userId);
      console.log('User metadata:', user?.user_metadata);
      
      const profileData = {
        user_id: userId,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        profile_completed: false
      };

      console.log('Profile data to insert:', profileData);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      console.log('Supabase insert result:', { data, error });

      if (error) {
        console.error('Supabase error creating profile:', error.message, error.details, error.hint);
        // 생성 실패해도 빈 프로필 객체로 설정
        setUserProfile(profileData);
        setShowProfileForm(true);
        return;
      }

      if (data) {
        console.log('Profile created successfully:', data);
        setUserProfile(data);
        setShowProfileForm(true); // 새 프로필이므로 폼 표시
      }
    } catch (err) {
      console.error('Exception in createUserProfile:', err);
      // 최후의 수단 - 빈 프로필 객체로 설정
      setUserProfile({ 
        user_id: userId, 
        profile_completed: false,
        full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || ''
      });
      setShowProfileForm(true);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleProfileComplete = () => {
    console.log('Profile complete callback triggered');
    setShowProfileForm(false);
    
    // 프로필 완성 상태로 직접 설정
    if (userProfile) {
      setUserProfile({ 
        ...userProfile, 
        profile_completed: true 
      });
    }
    
    console.log('Profile form closed, should show dream journal now');
  };

  if (loading && !initialLoadComplete) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="hero-teacup">🍵</div>
          <p>Loading your dreams...</p>
        </div>
      </div>
    );
  }

  // Show profile form for authenticated users with incomplete profiles
  if (user && showProfileForm) {
    return (
      <UserProfileForm
        user={user}
        profile={userProfile || undefined}
        onComplete={handleProfileComplete}
      />
    );
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="nav-content">
          <div className="nav-brand" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
            <span className="nav-logo">🍵</span>
            <span className="nav-title">Novakitz</span>
          </div>

          <div className="nav-actions">
            {user ? (
              <div className="user-menu">
                <span className="user-name">
                  {userProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                </span>
                <button onClick={handleSignOut} className="sign-out-btn">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button
                  onClick={() => setShowAuth(true)}
                  className="sign-in-btn"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Message */}
      {authMessage && (
        <div className={`auth-notification ${authMessage.includes('실패') || authMessage.includes('오류') ? 'error' : 'success'}`}>
          <span>{authMessage}</span>
          <button onClick={() => setAuthMessage('')}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <SimpleDreamInterface
          user={user}
          language={language}
        />
      </div>

      {/* Auth Modal */}
      {showAuth && !user && (
        <div className="auth-modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>
            <Auth onAuthSuccess={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </>
  );
}