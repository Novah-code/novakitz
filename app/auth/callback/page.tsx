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
        // URL에서 fragment 처리
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          // 토큰이 있으면 세션 설정 대기
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('인증 오류:', error);
          router.replace('/?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('로그인 성공:', data.session.user);
          // URL 파라미터 없이 홈으로 이동
          router.replace('/');
        } else {
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
