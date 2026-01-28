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
  const [searchQuery, setSearchQuery] = useState('');

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
    title: 'Space',
    searchPlaceholder: language === 'ko' ? '꿈 검색...' : 'Search dreams...',
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
        padding: '0.75rem 1.5rem',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {/* Home Icon */}
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'rgba(127, 176, 105, 0.1)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              color: 'var(--matcha-dark, #4a6741)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>

          {/* Title */}
          <h1 style={{
            fontSize: '1.3rem',
            fontWeight: '600',
            color: 'var(--matcha-dark, #4a6741)',
            margin: 0,
            flexShrink: 0
          }}>
            {t.title}
          </h1>

          {/* Search Bar */}
          <div style={{
            flex: 1,
            maxWidth: '400px',
            position: 'relative'
          }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--sage, #6b8e63)"
              strokeWidth="2"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.6
              }}
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid rgba(127, 176, 105, 0.2)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                background: 'rgba(255, 255, 255, 0.8)',
                outline: 'none',
                color: 'var(--matcha-dark, #4a6741)',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Add Button (+ icon only) */}
          <button
            onClick={() => {
              if (user) {
                setShowUploadModal(true);
              } else {
                window.location.href = '/';
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
              flexShrink: 0
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
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
