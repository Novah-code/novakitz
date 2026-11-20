'use client';

import { goTo } from '../../src/lib/platform';
import { useState, useEffect } from 'react';
import ArchetypeShell, { Heading, Subline, Body, PillButton, glass } from '../../src/components/ArchetypeShell';
import '../globals.css';
import { INK, BASE, LIGHT, PINK } from '../../src/lib/skyUi';

export default function ArchetypeTestLanding() {
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (newLang: 'ko' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('test_language', newLang);
  };

  const startGuestTest = () => {
    // Clear any previous guest data (guest_dream: left over from when the test asked for a dream first)
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    // Save language preference
    localStorage.setItem('test_language', language);
    goTo('/archetype-test/quiz/');
  };

  const ko = language === 'ko';

  const features = ko
    ? ['12가지 아키타입 분석', '개인화된 무의식 프로파일', '친구와 결과 공유하기', '소요 시간: 약 3분']
    : ['12 archetypes', 'Personalized unconscious profile', 'Share results with friends', 'Takes about 3 minutes'];

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
            ? '15개의 질문으로 당신의 무의식 속 진짜 자아를 발견하세요'
            : 'Discover your true self through 15 simple questions'}
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

      <PillButton onClick={startGuestTest}>{ko ? '무료로 시작하기' : 'Start for Free'}</PillButton>
      <p style={{ textAlign: 'center', fontSize: 13, color: LIGHT, margin: '16px 0 0' }}>
        {ko ? '로그인 없이 바로 시작할 수 있어요' : 'No login required to start'}
      </p>
    </ArchetypeShell>
  );
}
