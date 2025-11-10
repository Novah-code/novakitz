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
          const user = data.session.user;
          console.log('로그인 성공:', user);

          // Google에서 제공하는 이름 자동 저장
          if (user.user_metadata?.name) {
            const googleName = user.user_metadata.name;

            try {
              // user_profiles에 Google 이름 저장
              const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert(
                  {
                    user_id: user.id,
                    full_name: googleName,
                    display_name: googleName, // Google 이름을 display_name으로도 저장
                  },
                  { onConflict: 'user_id' }
                );

              if (profileError) {
                console.warn('프로필 저장 오류:', profileError);
                // 에러가 있어도 로그인은 계속 진행
              } else {
                console.log('✅ Google 이름 저장 완료:', googleName);
              }
            } catch (profileSaveError) {
              console.error('프로필 저장 중 오류:', profileSaveError);
              // 에러가 있어도 로그인은 계속 진행
            }
          }

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