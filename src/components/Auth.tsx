'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
}

// Note: onAuthSuccess is kept for API compatibility but actual auth state
// is handled by Supabase's onAuthStateChange in the parent component
export default function Auth({ onAuthSuccess: _onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
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
      console.error('Google 로그인 오류:', error);
      setMessage(`로그인 중 오류가 발생했습니다: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Google Sign In Button - Matcha Theme */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
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
        {loading ? (
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

      <p style={{
        marginTop: '0.75rem',
        fontSize: '0.7rem',
        color: 'var(--sage, #6b8e63)',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        Your dreams are private and secure
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}