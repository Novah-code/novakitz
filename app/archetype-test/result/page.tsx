'use client';

import { goTo } from '../../../src/lib/platform';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateArchetypeFromQuiz } from '../../../src/lib/archetypeQuiz';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeLongDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor,
  getArchetypeTagline
} from '../../../src/lib/archetypes';
import { getGrowthStage } from '../../../src/lib/archetypeGrowth';
import { supabase } from '../../../src/lib/supabase';
import ArchetypeShell, { Heading, Subline, Body, PillButton, glass } from '../../../src/components/ArchetypeShell';
import { INK, BASE, LIGHT, PINK, ROSE, displayFont } from '../../../src/lib/skyUi';
import ArchetypeShareCard from '../../../src/components/ArchetypeShareCard';
import '../../globals.css';

export default function ArchetypeResult() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [result, setResult] = useState<{
    primary: string;
    secondary: string | null;
    scores: Record<string, number>;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Email gate states
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Check if already unlocked
    const unlocked = localStorage.getItem('archetype_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }

    loadResult();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const loadResult = async () => {
    const answersStr = localStorage.getItem('guest_quiz_answers');
    if (!answersStr) {
      goTo('/archetype-test/');
      return;
    }

    const answers = JSON.parse(answersStr);
    const calculatedResult = calculateArchetypeFromQuiz(answers);
    setResult(calculatedResult);

    // Save result to database for sharing
    await saveResultToDatabase(calculatedResult, answers);
  };

  const saveResultToDatabase = async (
    calculatedResult: {
      primary: string;
      secondary: string | null;
      scores: Record<string, number>;
    },
    answers: Record<string, number>
  ) => {
    // Check if already saved
    const savedId = localStorage.getItem('guest_result_id');
    if (savedId) {
      setSavedResultId(savedId);
      return;
    }

    try {
      const dreamStr = localStorage.getItem('guest_dream');
      const dreamData = dreamStr ? JSON.parse(dreamStr) : null;

      const response = await fetch('/api/guest-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary_archetype: calculatedResult.primary,
          secondary_archetype: calculatedResult.secondary,
          archetype_scores: calculatedResult.scores,
          dream_content: dreamData?.content || '',
          quiz_answers: answers,
          language: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedResultId(data.id);
        localStorage.setItem('guest_result_id', data.id);
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const handleShare = async () => {
    setSharing(true);

    // Use personalized share link if result is saved
    const shareUrl = savedResultId
      ? `${window.location.origin}/archetype-test/shared/${savedResultId}`
      : `${window.location.origin}/archetype-test`;

    // Get clean archetype name (remove English part for Korean)
    const fullName = getArchetypeName(result!.primary, language);
    const cleanName = language === 'ko' ? fullName.split(' (')[0] : fullName;
    const tagline = getArchetypeTagline(result!.primary, language);

    const shareText = language === 'ko'
      ? `나의 무의식 아키타입: ${cleanName}\n${tagline}\n\n당신의 아키타입도 알아보세요 ✨`
      : `My unconscious archetype: ${cleanName}\n${tagline}\n\nDiscover yours ✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'ko' ? '무의식 아키타입 테스트' : 'Unconscious Archetype Test',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert(language === 'ko' ? '링크가 복사되었습니다!' : 'Link copied!');
      } catch (err) {
        alert(language === 'ko' ? '공유 링크: ' + shareUrl : 'Share link: ' + shareUrl);
      }
    }
    setSharing(false);
  };

  const handleSignUp = () => {
    router.push('/');
  };

  const handleRetake = () => {
    localStorage.removeItem('guest_dream');
    localStorage.removeItem('guest_quiz_answers');
    localStorage.removeItem('guest_result_id');
    localStorage.removeItem('archetype_unlocked');
    goTo('/archetype-test/');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(language === 'ko' ? '올바른 이메일 주소를 입력해주세요' : 'Please enter a valid email address');
      return;
    }

    if (!savedResultId) {
      setEmailError(language === 'ko' ? '결과를 저장하는 중입니다. 잠시 후 다시 시도해주세요.' : 'Saving result. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/guest-results', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: savedResultId,
          email,
          is_subscribed: isSubscribed,
        }),
      });

      if (response.ok) {
        setIsUnlocked(true);
        localStorage.setItem('archetype_unlocked', 'true');
      } else {
        const data = await response.json();
        setEmailError(data.error || (language === 'ko' ? '오류가 발생했습니다' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setEmailError(language === 'ko' ? '네트워크 오류가 발생했습니다' : 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ko = language === 'ko';

  if (!result) {
    return (
      <ArchetypeShell language={language} backHome>
        <p style={{ textAlign: 'center', marginTop: 80, fontSize: 15, color: LIGHT }}>{ko ? '결과를 불러오는 중...' : 'Loading your result...'}</p>
      </ArchetypeShell>
    );
  }

  const primaryColor = getArchetypeColor(result.primary);
  const primaryDarkColor = getArchetypeDarkColor(result.primary);
  const unlocked = isUnlocked || isLoggedIn;
  const growthStage = getGrowthStage(result.primary, language);

  const label: React.CSSProperties = { fontSize: 12.5, letterSpacing: 0.6, color: LIGHT, fontWeight: 600, textTransform: ko ? 'none' : 'uppercase' };
  const cardTitle: React.CSSProperties = { margin: '0 0 12px', fontFamily: displayFont(ko), fontWeight: ko ? 500 : 400, fontSize: ko ? 18 : 26, color: INK, textAlign: 'center' };
  const card: React.CSSProperties = { ...glass, borderRadius: 24, padding: '22px 22px', marginTop: 16 };
  const prose: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.8, color: BASE, whiteSpace: 'pre-wrap' };

  return (
    <>
      <ArchetypeShell language={language} backHome>
        <Heading ko={ko} size={34} koSize={22}>{ko ? '당신의 아키타입' : 'Your Archetype'}</Heading>

        {/* The archetype itself: its own two colours as a soft wash behind the name. */}
        <div style={{ ...glass, borderRadius: 28, marginTop: 22, padding: '30px 22px 26px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`, opacity: 0.38 }} />
          <div style={{ position: 'relative' }}>
            <div style={label}>{ko ? '당신의 주요 아키타입' : 'Your primary archetype'}</div>
            <div style={{ margin: '10px 0 6px', fontFamily: displayFont(ko), fontSize: ko ? 26 : 38, fontWeight: ko ? 500 : 400, lineHeight: 1.15, color: INK, textWrap: 'balance' as React.CSSProperties['textWrap'] }}>
              {getArchetypeName(result.primary, language)}
            </div>
            <div style={{ fontFamily: displayFont(ko), fontStyle: ko ? 'normal' : 'italic', fontSize: ko ? 15 : 21, color: ROSE, lineHeight: 1.3 }}>
              {getArchetypeTagline(result.primary, language)}
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 14.5, lineHeight: 1.7, color: BASE }}>
              {getArchetypeDescription(result.primary, language)}
            </p>
          </div>
        </div>

        {!unlocked && (
          <div style={{ ...card, textAlign: 'center' }}>
            <h2 style={cardTitle}>{ko ? '심층 분석 리포트' : 'Deep Analysis Report'}</h2>
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.65, color: BASE }}>
              {ko ? "'그림자(Shadow)' 분석과 성장 가이드를 확인하세요." : "Unlock your Jung-based 'Shadow' analysis and growth guide."}
            </p>
            <form onSubmit={handleEmailSubmit} style={{ maxWidth: 340, margin: '0 auto' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={ko ? '이메일 주소' : 'Email address'}
                style={{ width: '100%', boxSizing: 'border-box', height: 50, padding: '0 18px', borderRadius: 25, border: `1.5px solid ${emailError ? '#d9534f' : 'rgba(255,255,255,0.9)'}`, background: 'rgba(255,255,255,0.85)', fontSize: 16, fontFamily: 'inherit', color: INK, outline: 'none' }}
              />
              {emailError && <p style={{ color: '#c0443f', fontSize: 13, margin: '8px 4px 0', textAlign: 'left' }}>{emailError}</p>}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: BASE, margin: '14px 0 16px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isSubscribed} onChange={(e) => setIsSubscribed(e.target.checked)} style={{ width: 16, height: 16, accentColor: PINK }} />
                {ko ? '노바키츠 뉴스레터 받기' : 'Subscribe to Novakitz newsletter'}
              </label>
              <PillButton onClick={() => { /* submit handled by the form */ }} disabled={isSubmitting} arrow={false} submit>
                {isSubmitting ? (ko ? '처리 중...' : 'Processing...') : (ko ? '전체 결과 보기' : 'View Full Results')}
              </PillButton>
            </form>
            <p style={{ margin: '14px 0 0', fontSize: 12.5, color: LIGHT }}>{ko ? '스팸 없이 유용한 콘텐츠만 보내드려요' : 'No spam, only valuable content'}</p>
          </div>
        )}

        <div style={{ ...card, background: 'rgba(255,255,255,0.55)', boxShadow: 'none' }}>
          <div style={prose}>{getArchetypeLongDescription(result.primary, language)}</div>
        </div>

        <div style={{ filter: unlocked ? 'none' : 'blur(5px)', pointerEvents: unlocked ? 'auto' : 'none', userSelect: unlocked ? 'auto' : 'none', transition: 'filter 0.5s ease' }}>
          <div style={card}>
            <h2 style={cardTitle}>{ko ? '당신의 특징' : 'Your Traits'}</h2>
            <div style={prose}>{getArchetypeTraits(result.primary, language)}</div>
          </div>

          {growthStage && (
            <div style={card}>
              <h2 style={cardTitle}>{ko ? '성장 시스템' : 'Growth System'}</h2>

              <div style={label}>{ko ? '현재 단계' : 'Current stage'}</div>
              <div style={{ margin: '6px 0 12px', fontFamily: displayFont(ko), fontSize: ko ? 18 : 24, fontWeight: ko ? 500 : 400, color: INK }}>{growthStage.current[language]}</div>
              <div style={{ display: 'grid', gap: 7 }}>
                {growthStage.characteristics[language].map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, fontSize: 14, lineHeight: 1.55, color: BASE }}>
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, marginTop: 8, flexShrink: 0 }} />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...label, marginTop: 22 }}>{ko ? '성장 퀘스트' : 'Growth quests'}</div>
              <div style={{ fontSize: 13.5, color: LIGHT, margin: '4px 0 10px' }}>{ko ? '다음 단계로 나아가기 위한 실천' : 'Actions to move to the next stage'}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {growthStage.quests[language].map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.7)' }}>
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${PINK}`, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, lineHeight: 1.55, color: INK }}>{q}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '16px', borderRadius: 18, textAlign: 'center', background: `linear-gradient(160deg, ${primaryColor}99, ${primaryDarkColor}66)` }}>
                <div style={label}>{ko ? '다음 단계' : 'Next stage'}</div>
                <div style={{ marginTop: 4, fontFamily: displayFont(ko), fontSize: ko ? 18 : 24, fontWeight: ko ? 500 : 400, color: INK }}>{growthStage.next[language]}</div>
              </div>
            </div>
          )}

          {result.secondary && (
            <div style={{ ...card, textAlign: 'center' }}>
              <div style={label}>{ko ? '잘 어울리는 유형' : 'Compatible type'}</div>
              <div style={{ margin: '8px 0 6px', fontFamily: displayFont(ko), fontSize: ko ? 21 : 30, fontWeight: ko ? 500 : 400, color: INK }}>{getArchetypeName(result.secondary, language)}</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: BASE }}>{getArchetypeDescription(result.secondary, language)}</div>
            </div>
          )}
        </div>

        <div style={{ ...card, textAlign: 'center' }}>
          <h2 style={cardTitle}>{ko ? '더 깊은 성장을 위해' : 'For Deeper Growth'}</h2>
          <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.7, color: BASE }}>
            {ko
              ? `당신의 유형인 ${getArchetypeName(result.primary, language)}에게 가장 필요한 어퍼메이션을 매일 아침 꿈에 맞춰 보내드립니다.`
              : `We'll send daily affirmations tailored to your ${getArchetypeName(result.primary, language)} archetype, matched with your dreams.`}
          </p>
          <PillButton onClick={() => goTo('/pricing/')}>{ko ? 'Novakitz Pro 알아보기' : 'Learn About Novakitz Pro'}</PillButton>
        </div>

        {!isLoggedIn && (
          <div style={{ ...card, textAlign: 'center' }}>
            <h2 style={cardTitle}>{ko ? '더 깊은 분석을 원하시나요?' : 'Want deeper analysis?'}</h2>
            <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.7, color: BASE }}>
              {ko ? '가입하고 꿈 일기를 작성하면 AI가 더 정확한 무의식 프로파일을 만들어드립니다' : 'Sign up and journal your dreams for a more accurate unconscious profile'}
            </p>
            <PillButton onClick={handleSignUp}>{ko ? '무료로 시작하기' : 'Start for Free'}</PillButton>
          </div>
        )}

        <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
          <PillButton onClick={() => setShowShareCard(true)}>{ko ? '공유하기' : 'Share'}</PillButton>
          <PillButton onClick={handleRetake} quiet arrow={false}>{ko ? '다시 테스트' : 'Retake Test'}</PillButton>
        </div>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 12.5, color: LIGHT }}>
          {ko ? '이 테스트는 융의 12가지 아키타입 이론을 기반으로 합니다' : "This test is based on Jung's 12 archetypes theory"}
        </p>
      </ArchetypeShell>

      {showShareCard && (
        <ArchetypeShareCard
          archetypeName={getArchetypeName(result.primary, language)}
          tagline={getArchetypeTagline(result.primary, language)}
          primaryColor={primaryColor}
          darkColor={primaryDarkColor}
          language={language}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </>
  );
}
