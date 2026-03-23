'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';

export const dynamic = 'force-dynamic';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // PKCE flow: code is in URL query string (?code=xxx)
        const code = new URLSearchParams(window.location.search).get('code');

        let session = null;

        if (code) {
          // Explicitly exchange the PKCE code for a session
          console.log('Exchanging PKCE code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            router.replace('/?error=auth_failed');
            return;
          }
          session = data.session;
        } else {
          // Fallback: implicit flow (hash fragment) or already-exchanged session
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Get session error:', error);
            router.replace('/?error=auth_failed');
            return;
          }
          session = data.session;
        }

        if (session) {
          const user = session.user;
          console.log('로그인 성공:', user.id);

          // Google에서 제공하는 이름 자동 저장
          if (user.user_metadata?.name) {
            const googleName = user.user_metadata.name;
            try {
              await supabase
                .from('user_profiles')
                .upsert(
                  { user_id: user.id, full_name: googleName, display_name: googleName },
                  { onConflict: 'user_id' }
                );
              console.log('✅ Google 이름 저장 완료:', googleName);
            } catch (profileSaveError) {
              console.warn('프로필 저장 오류 (무시):', profileSaveError);
            }
          }

          // Check for pending Gumroad purchase and activate if found
          if (user.email) {
            try {
              const res = await fetch('/api/activate-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, email: user.email }),
              });
              const result = await res.json();
              if (result.activated) {
                console.log('✅ Pending purchase activated:', result.type);
              }
            } catch (e) {
              console.warn('Pending activation check failed (non-critical):', e);
            }
          }

          router.replace('/');
        } else {
          console.error('No session after exchange');
          router.replace('/?error=no_session');
        }
      } catch (error) {
        console.error('콜백 처리 오류:', error);
        router.replace('/?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-matcha-light via-white to-matcha-green">
      <div className="glass-strong p-8 rounded-xl text-center">
        <div className="hero-teacup mb-4">🍵</div>
        <h2 className="text-2xl font-semibold mb-2">로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려 주세요</p>
        <div className="spinner mt-4"></div>
      </div>
    </div>
  );
}