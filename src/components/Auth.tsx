'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { signInWithApple, isAppleSignInCancelled } from '../lib/appleAuth';

interface AuthProps {
  onAuthSuccess: () => void;
}

// Note: onAuthSuccess is kept for API compatibility but actual auth state
// is handled by Supabase's onAuthStateChange in the parent component
export default function Auth({ onAuthSuccess: _onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | null>(null);
  const [message, setMessage] = useState('');

  /*
   * Email and password, under the two social buttons.
   *
   * Until now those two were the only way in, which meant anyone unwilling to
   * attach a Google or Apple account to a dream journal simply could not have
   * one — a sharper objection here than in most apps, given what people write
   * in it. It also left App Review with a single door: if Sign in with Apple
   * failed for them, there was no second way to open the app at all, and no
   * shared login we could hand over.
   *
   * Collapsed by default so Apple stays the most prominent option, as
   * guideline 4.8 asks, but named on a visible button rather than hidden.
   */
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setNotice('');

    if (!email.trim() || !password) {
      setMessage('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setMessage('Passwords need at least 6 characters.');
      return;
    }

    setLoading('email');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // With email confirmation switched on in Supabase, the account exists
        // but there is no session yet. Saying so beats a screen that appears
        // to have done nothing.
        if (!data.session) {
          setNotice('Check your email to confirm the account, then sign in.');
          setMode('signin');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      // On success the parent's auth listener takes over and unmounts this.
    } catch (error: unknown) {
      const raw = (error as { message?: string })?.message ?? '';
      setMessage(
        /invalid login/i.test(raw)
          ? 'That email and password do not match an account.'
          : /already registered/i.test(raw)
            ? 'There is already an account with that email. Sign in instead.'
            : raw || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(null);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '15px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(127, 176, 105, 0.3)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.95rem',
    color: '#334155',
    outline: 'none',
    fontFamily: "'Roboto', -apple-system, sans-serif",
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    setMessage('');

    try {
      await signInWithApple();
    } catch (error: unknown) {
      if (!isAppleSignInCancelled(error)) {
        console.error('Apple sign-in failed:', error);
        const detail = (error as { message?: string })?.message ?? '';
        setMessage(`Could not sign in with Apple: ${detail}`);
      }
    } finally {
      // Cleared on success too. The parent unmounts this component moments
      // later, so the button barely returns to rest — but if anything upstream
      // fails to notice the new session, a stuck spinner with no error is the
      // worst thing to leave someone looking at.
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
      // 성공시 Google 페이지로 리다이렉트됨
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      setMessage(`Could not sign in with Google: ${error.message}`);
      setLoading(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/*
        Email gets a screen of its own rather than fields unfolding under the
        buttons. Stacking a form beneath two large buttons made the panel long
        and busy at exactly the moment someone is deciding whether to bother;
        choosing email replaces the choice instead of growing it, so there is
        one thing to read at a time.
      */}
      {showEmail ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            onClick={() => { setShowEmail(false); setMessage(''); setNotice(''); }}
            aria-label="Back to the other ways to sign in"
            style={{
              alignSelf: 'flex-start',
              width: '34px',
              height: '34px',
              margin: '-4px 0 -4px -6px',
              background: 'none',
              border: 'none',
              color: 'var(--matcha-dark, #4a6741)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7d63', textAlign: 'center' }}>
            {mode === 'signup' ? 'Create your account, or ' : 'Enter your details, or '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage(''); setNotice(''); }}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                font: 'inherit', fontWeight: 600,
                color: 'var(--matcha-dark, #4a6741)', textDecoration: 'underline',
              }}
            >
              {mode === 'signup' ? 'sign in' : 'sign up'}
            </button>
          </p>

          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              style={fieldStyle}
            />

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password — 6 characters or more' : 'Password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={{ ...fieldStyle, paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                  width: '34px', height: '34px', border: 'none', background: 'none',
                  cursor: 'pointer', color: '#8fa287',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {/*
              Held back until both fields have something in them, as the reference
              does. The button then never invites a tap that can only fail.
            */}
            <button
              type="submit"
              disabled={loading !== null || !email.trim() || !password}
              style={{
                width: '100%',
                marginTop: '4px',
                padding: '15px 20px',
                background: (!email.trim() || !password) ? 'rgba(127, 176, 105, 0.15)' : 'var(--matcha-green, #7FB069)',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: (!email.trim() || !password) ? '#9bab93' : '#fff',
                cursor: (loading !== null || !email.trim() || !password) ? 'default' : 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease',
                fontFamily: "'Roboto', -apple-system, sans-serif",
              }}
            >
              {loading === 'email'
                ? 'Just a moment...'
                : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/*
            Apple first, and styled to Apple's guidelines. Guideline 4.8 requires it
            to be offered at least as prominently as the other option.
          */}
          <button
            type="button"
            onClick={handleAppleSignIn}
            disabled={loading !== null}
            style={{
              width: '100%',
              padding: '14px 20px',
              marginBottom: '10px',
              background: '#000',
              border: 'none',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: '500',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading && loading !== 'apple' ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
              fontFamily: "'Roboto', -apple-system, sans-serif"
            }}
          >
            {loading === 'apple' ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 384 512" fill="#fff" aria-hidden="true">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </button>

          {/* Google Sign In Button - Matcha Theme */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(127, 176, 105, 0.3)',
              borderRadius: '14px',
              fontSize: '0.95rem',
              fontWeight: '500',
              color: 'var(--matcha-dark, #4a6741)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(127, 176, 105, 0.1)',
              fontFamily: "'Roboto', -apple-system, sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.5)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.3)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(127, 176, 105, 0.1)';
            }}
          >
            {loading === 'google' ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(127, 176, 105, 0.3)',
                  borderTopColor: 'var(--matcha-green, #7FB069)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                {/* Google Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>


        <button
          type="button"
          onClick={() => { setShowEmail(true); setMessage(''); setNotice(''); }}
          disabled={loading !== null}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            fontSize: '0.9rem',
            color: 'var(--matcha-dark, #4a6741)',
            cursor: loading ? 'not-allowed' : 'pointer',
            textDecoration: 'underline',
            fontFamily: "'Roboto', -apple-system, sans-serif",
          }}
        >
          Continue with email
        </button>
        </>
      )}

      {notice && (
        <div style={{
          marginTop: '0.75rem',
          padding: '10px 12px',
          background: 'rgba(127, 176, 105, 0.12)',
          borderRadius: '10px',
          color: 'var(--matcha-dark, #4a6741)',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          {notice}
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '0.75rem',
          padding: '10px 12px',
          background: 'rgba(220, 53, 69, 0.1)',
          borderRadius: '10px',
          color: '#c0392b',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}