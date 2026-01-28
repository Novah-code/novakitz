'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { User } from '@supabase/supabase-js';
import CommunityFeed from '../../src/components/CommunityFeed';
import ImageUploadModal from '../../src/components/ImageUploadModal';

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const t = {
    title: language === 'ko' ? '꿈 갤러리' : 'Dream Gallery',
    subtitle: language === 'ko' ? '꿈의 이미지를 공유하세요' : 'Share images from your dreams',
    upload: language === 'ko' ? '공유하기' : 'Share',
    back: language === 'ko' ? '홈' : 'Home',
    loginToShare: language === 'ko' ? '로그인하고 공유하기' : 'Login to share',
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fdf8 0%, #fdf8fd 50%, #f8fafd 100%)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(127, 176, 105, 0.2)',
          borderTopColor: '#7FB069',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fdf8 0%, #fdf8fd 50%, #f8fafd 100%)',
      fontFamily: language === 'ko'
        ? "'S-CoreDream', -apple-system, sans-serif"
        : "'Roboto', -apple-system, sans-serif"
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(127, 176, 105, 0.1)',
        zIndex: 100,
        padding: '1rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'rgba(127, 176, 105, 0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                color: 'var(--matcha-dark, #4a6741)',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {t.back}
            </button>
            <div>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: 'var(--matcha-dark, #4a6741)',
                margin: 0,
                fontFamily: language === 'ko' ? 'inherit' : "'Georgia', serif"
              }}>
                {t.title}
              </h1>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--sage, #6b8e63)',
                margin: 0
              }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Upload Button */}
          <button
            onClick={() => {
              if (user) {
                setShowUploadModal(true);
              } else {
                window.location.href = '/';
              }
            }}
            style={{
              background: user
                ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
                : 'rgba(127, 176, 105, 0.2)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              cursor: 'pointer',
              color: user ? 'white' : 'var(--matcha-dark, #4a6741)',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: user ? '0 4px 12px rgba(127, 176, 105, 0.3)' : 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {user ? t.upload : t.loginToShare}
          </button>
        </div>
      </header>

      {/* Feed */}
      <main style={{ padding: '1.5rem' }}>
        <CommunityFeed
          user={user}
          language={language}
          refreshKey={refreshKey}
        />
      </main>

      {/* Upload Modal */}
      {showUploadModal && user && (
        <ImageUploadModal
          user={user}
          language={language}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
