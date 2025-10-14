'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import Auth from './Auth';
import SimpleDreamInterface from './SimpleDreamInterface';

export default function SimpleDreamInterfaceWithAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f0 0%, #d4e7d4 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍵</div>
          <p style={{ color: '#5a7a5a' }}>Loading...</p>
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
        background: 'linear-gradient(135deg, #f0f4f0 0%, #d4e7d4 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <Auth onAuthSuccess={() => {}} />
        </div>
      </div>
    );
  }

  // Show main app when logged in
  return (
    <>
      {/* Top Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🍵</span>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#5a7a5a'
          }}>Novakitz</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#5a7a5a' }}>
            {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #5a7a5a',
              borderRadius: '8px',
              color: '#5a7a5a',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5a7a5a';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5a7a5a';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Add padding to account for fixed nav */}
      <div style={{ paddingTop: '60px' }}>
        <SimpleDreamInterface user={user} />
      </div>
    </>
  );
}
