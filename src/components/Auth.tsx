'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
    <div className="auth-container">
      <div className="auth-form-container glass-strong">
        <div className="auth-header">
          <h2 className="auth-title">Welcome to Novakitz</h2>
          <p className="auth-subtitle">
            Start your dream journaling journey with Google
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="google-auth-simple">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="google-signin-btn-large"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Connecting to Google...
              </>
            ) : (
              <>
                Continue with Google
              </>
            )}
          </button>

          {message && (
            <div className="auth-message error">
              {message}
            </div>
          )}
        </div>

        <div className="auth-footer">
          <p>Your dreams are private and secure</p>
          <p className="auth-note">Sign in with Google to save and sync your dreams across devices</p>
        </div>
      </div>
    </div>
  );
}