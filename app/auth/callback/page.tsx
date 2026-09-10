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

  /*
   * Inline styles, and English.
   *
   * This was Tailwind, which emits nothing in this project, so the screen that
   * shows while a Google or Apple sign-in comes back was unstyled black text on
   * white. It is brief, but it is the first thing a person sees after handing
   * over their account, and App Review sees it too — in Korean, hardcoded,
   * whatever language the rest of the app was showing.
   */
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #E8F5E8 0%, #FFFFFF 55%, #D9EBDC 100%)',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🍵</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#2F3B33', margin: '0 0 6px' }}>
          Signing you in…
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>One moment.</p>
      </div>
    </div>
  );
}