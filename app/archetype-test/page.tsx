'use client';

import { goTo } from '../../src/lib/platform';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import ArchetypeShell, { Heading, Subline, Body, PillButton, glass } from '../../src/components/ArchetypeShell';
import '../globals.css';
import { INK, BASE, LIGHT, PINK } from '../../src/lib/skyUi';

export default function ArchetypeTestLanding() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    checkAuth();
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    setLoading(false);
  };

  const handleLanguageChange = (newLang: 'ko' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('test_language', newLang);
  };

  const startGuestTest = () => {
    // Clear any previous guest data
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    // Save language preference
    localStorage.setItem('test_language', language);
    goTo('/archetype-test/guest-dream/');
  };

  const goToProfileTest = () => {
    // If logged in, check if they have enough dreams for profile
    goTo('/profile/');
  };

  const ko = language === 'ko';

  if (loading) {
    return (
      <ArchetypeShell language={language} backHome>
        <p style={{ textAlign: 'center', fontSize: 16, color: LIGHT, paddingTop: 120 }}>{ko ? '로딩 중...' : 'Loading...'}</p>
      </ArchetypeShell>
    );
  }

  const features = ko
    ? ['12가지 아키타입 분석', '개인화된 무의식 프로파일', '친구와 결과 공유하기', '소요 시간: 약 3-5분']
    : ['12 archetypes', 'Personalized unconscious profile', 'Share results with friends', 'Takes only 3-5 minutes'];

  return (
    <ArchetypeShell language={language} onLanguageChange={handleLanguageChange} backHome>
      <div style={{ textAlign: 'center' }}>
        <Heading ko={ko} size={42} koSize={26}>
          {ko ? '나의 무의식 아키타입 찾기' : 'Discover Your Unconscious Archetype'}
        </Heading>
        <Subline ko={ko}>
          {ko ? '당신의 꿈은 이미 당신이 누구인지 알고 있습니다.' : 'Your dreams already know who you are.'}
        </Subline>
        <Body>
          {ko
            ? '간단한 꿈 하나와 15개의 질문으로 당신의 무의식 속 진짜 자아를 발견하세요'
            : 'Discover your true self through one dream and 15 simple questions'}
        </Body>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: LIGHT }}>
          {ko ? '직관으로 가장 끌리는 선택지를 골라주세요' : 'Choose the option that resonates with your intuition'}
        </p>
      </div>

      <div style={{ ...glass, borderRadius: 28, padding: '8px 22px', margin: '30px 0 28px' }}>
        {features.map((f, i) => (
          <div
            key={f}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px 0',
              borderBottom: i < features.length - 1 ? '1px solid rgba(46,60,51,0.08)' : 'none',
              fontSize: 15,
              color: INK,
            }}
          >
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: PINK, flexShrink: 0 }} />
            {f}
          </div>
        ))}
      </div>

      {!isLoggedIn ? (
        <>
          <PillButton onClick={startGuestTest}>{ko ? '무료로 시작하기' : 'Start for Free'}</PillButton>
          <p style={{ textAlign: 'center', fontSize: 13, color: LIGHT, margin: '16px 0 0' }}>
            {ko ? '로그인 없이 바로 시작할 수 있어요' : 'No login required to start'}
          </p>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PillButton onClick={goToProfileTest}>{ko ? '내 프로파일 보기' : 'View My Profile'}</PillButton>
          <PillButton onClick={startGuestTest} quiet arrow={false}>{ko ? '퀵 테스트 하기' : 'Quick Test'}</PillButton>
        </div>
      )}
    </ArchetypeShell>
  );
}
