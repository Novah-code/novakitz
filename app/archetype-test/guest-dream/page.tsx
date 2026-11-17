'use client';

import { goTo } from '../../../src/lib/platform';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import ArchetypeShell, { Heading, Body, PillButton, Progress, glass } from '../../../src/components/ArchetypeShell';
import { INK, BASE, LIGHT, PINK } from '../../../src/lib/skyUi';
import '../../globals.css';

interface Dream {
  id: string;
  content: string;
  created_at: string;
}

export default function GuestDreamRecording() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [dreamText, setDreamText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [previousDreams, setPreviousDreams] = useState<Dream[]>([]);
  const [showPreviousDreams, setShowPreviousDreams] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Check auth and load previous dreams
    checkAuthAndLoadDreams();
  }, []);

  const checkAuthAndLoadDreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);

        // Load user's previous dreams
        const { data: dreams, error } = await supabase
          .from('dreams')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && dreams) {
          setPreviousDreams(dreams);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to check auth:', err);
      setLoading(false);
    }
  };

  const handleSelectPreviousDream = (dream: Dream) => {
    const dreamOnly = dream.content.split('\n\n---\n\nAnalysis:')[0].split('\n\n---\n\n분석:')[0];
    setDreamText(dreamOnly);
    setShowPreviousDreams(false);
  };

  const handleSubmit = () => {
    if (!dreamText.trim()) {
      alert(language === 'ko' ? '꿈 내용을 입력해주세요' : 'Please enter your dream');
      return;
    }

    if (dreamText.length < 10) {
      alert(language === 'ko' ? '좀 더 자세히 작성해주세요 (최소 10자)' : 'Please write more details (min 10 chars)');
      return;
    }

    setIsSubmitting(true);

    // Save to localStorage
    localStorage.setItem('guest_dream', JSON.stringify({
      content: dreamText,
      timestamp: new Date().toISOString()
    }));

    // Move to quiz
    setTimeout(() => {
      goTo('/archetype-test/quiz/');
    }, 500);
  };

  const handleSkip = () => {
    // Save empty dream
    localStorage.setItem('guest_dream', JSON.stringify({
      content: '',
      timestamp: new Date().toISOString(),
      skipped: true
    }));
    goTo('/archetype-test/quiz/');
  };

  const ko = language === 'ko';
  const ready = dreamText.length >= 10;

  if (loading) {
    return (
      <ArchetypeShell language={language}>
        <p style={{ textAlign: 'center', marginTop: 80, fontSize: 15, color: LIGHT }}>{ko ? '불러오는 중...' : 'Loading...'}</p>
      </ArchetypeShell>
    );
  }

  const stripAnalysis = (c: string) => c.split('\n\n---\n\nAnalysis:')[0].split('\n\n---\n\n분석:')[0];

  const tips = ko
    ? ['장소나 환경을 묘사해보세요', '등장인물이나 생명체가 있었나요?', '어떤 감정을 느꼈나요? (두려움, 기쁨, 불안 등)', '꿈에서 무엇을 원했나요? 무엇을 하려고 했나요?', '특별한 사건이나 행동이 있었나요?']
    : ['Describe the location or environment', 'Were there any characters or beings?', 'What emotions did you feel? (fear, joy, anxiety, etc.)', 'What did you want? What were you trying to do?', 'Were there any special events or actions?'];

  return (
    <ArchetypeShell language={language}>
      <Progress pct={33} />
      <p style={{ margin: '12px 0 22px', textAlign: 'center', fontSize: 13, letterSpacing: 0.4, color: LIGHT }}>
        {ko ? '1단계 / 2단계' : 'Step 1 / 2'}
      </p>

      <Heading ko={ko} size={34} koSize={23} style={{ lineHeight: ko ? 1.4 : 1.15 }}>
        {ko ? '가장 기억나는 꿈 하나를 기록해주세요' : 'Record Your Most Memorable Dream'}
      </Heading>
      <Body>
        {ko
          ? '강렬하게 기억나는 꿈일수록 더 정확한 분석이 가능합니다. 편하게 작성하세요.'
          : 'The more vivid the dream, the more accurate the analysis. Write freely as you remember.'}
      </Body>

      {isLoggedIn && previousDreams.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <button
            onClick={() => setShowPreviousDreams(!showPreviousDreams)}
            style={{ ...glass, width: '100%', padding: '14px 18px', borderRadius: 20, fontFamily: 'inherit', fontSize: 14, color: BASE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>{ko ? `이전에 기록한 꿈에서 선택하기 (${previousDreams.length}개)` : `Select from previous dreams (${previousDreams.length})`}</span>
            <span aria-hidden="true" style={{ fontSize: 11, color: LIGHT }}>{showPreviousDreams ? '▲' : '▼'}</span>
          </button>

          {showPreviousDreams && (
            <div style={{ marginTop: 10, display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {previousDreams.map((dream) => (
                <button
                  key={dream.id}
                  onClick={() => handleSelectPreviousDream(dream)}
                  style={{ ...glass, width: '100%', padding: '12px 16px', borderRadius: 16, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 12, color: LIGHT, marginBottom: 4 }}>
                    {new Date(dream.created_at).toLocaleDateString(ko ? 'ko-KR' : 'en-US')}
                  </div>
                  <div style={{ fontSize: 14, color: INK, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {stripAnalysis(dream.content)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ ...glass, marginTop: 22, padding: 6, borderRadius: 24 }}>
        <textarea
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder={ko
            ? '예: 넓은 바다를 헤엄치고 있었어요. 물은 맑고 따뜻했고, 멀리 섬이 보였어요...'
            : 'e.g., I was swimming in a vast ocean. The water was clear and warm, and I could see an island in the distance...'}
          style={{ display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 190, padding: '14px 16px', border: 'none', background: 'transparent', borderRadius: 18, fontSize: 16, lineHeight: 1.65, fontFamily: 'inherit', color: INK, resize: 'none', outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 10px', fontSize: 12.5, color: LIGHT }}>
          <span>
            {!ready
              ? ko ? `최소 10자 (현재 ${dreamText.length}자)` : `Min 10 chars (current ${dreamText.length})`
              : ko ? `${dreamText.length}자` : `${dreamText.length} chars`}
          </span>
          {ready && <span style={{ color: PINK, fontWeight: 700 }}>✓</span>}
        </div>
      </div>

      <div style={{ ...glass, marginTop: 16, padding: '16px 20px', borderRadius: 22 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 8 }}>{ko ? '작성 팁' : 'Writing Tips'}</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
          {tips.map((t) => (
            <li key={t} style={{ display: 'flex', gap: 10, fontSize: 13.5, lineHeight: 1.55, color: BASE }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, marginTop: 8, flexShrink: 0 }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 26 }}>
        <PillButton onClick={handleSubmit} disabled={isSubmitting || !ready}>
          {isSubmitting ? (ko ? '저장 중...' : 'Saving...') : (ko ? '다음: 질문 답하기' : 'Next: Answer Questions')}
        </PillButton>
      </div>

      <button
        onClick={handleSkip}
        style={{ display: 'block', margin: '14px auto 0', padding: '10px 12px', background: 'transparent', border: 'none', fontFamily: 'inherit', fontSize: 14, color: BASE, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
      >
        {ko ? '꿈 기억이 안나요 (건너뛰기)' : "I don't remember (Skip)"}
      </button>

      <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: 12.5, color: LIGHT }}>
        {ko ? '입력한 꿈은 기기에만 저장되며, 테스트 완료 후 삭제됩니다' : 'Your dream is stored locally and deleted after the test'}
      </p>
    </ArchetypeShell>
  );
}
