'use client';

import { goTo } from '../../../../src/lib/platform';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor,
  getArchetypeTagline
} from '../../../../src/lib/archetypes';
import ArchetypeShell, { Heading, Body, PillButton, glass } from '../../../../src/components/ArchetypeShell';
import { INK, BASE, LIGHT, PINK, ROSE, displayFont } from '../../../../src/lib/skyUi';
import '../../../globals.css';

export default function SharedArchetypeResult() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [result, setResult] = useState<{
    primary_archetype: string;
    secondary_archetype: string | null;
    archetype_scores: Record<string, number>;
    dream_content: string;
    language: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      setLanguage('ko');
    } else {
      setLanguage('en');
    }

    loadSharedResult();
  }, [id]);

  const loadSharedResult = async () => {
    try {
      const response = await fetch(`/api/guest-results?id=${id}`);

      if (!response.ok) {
        setError('Result not found');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);

      // Use the language from the result if available
      if (data.language) {
        setLanguage(data.language);
      }
    } catch (err) {
      console.error('Error loading result:', err);
      setError('Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeTest = () => {
    // Navigate to archetype test landing page
    goTo('/archetype-test/');
  };

  const ko = language === 'ko';
  const toLanding = () => goTo('/archetype-test/');

  if (loading) {
    return (
      <ArchetypeShell language={language} onLanguageChange={setLanguage} onBack={toLanding}>
        <p style={{ textAlign: 'center', marginTop: 80, fontSize: 15, color: LIGHT }}>{ko ? '결과를 불러오는 중...' : 'Loading result...'}</p>
      </ArchetypeShell>
    );
  }

  if (error || !result) {
    return (
      <ArchetypeShell language={language} onLanguageChange={setLanguage} onBack={toLanding}>
        <div style={{ ...glass, borderRadius: 28, marginTop: 40, padding: '34px 24px 28px', textAlign: 'center' }}>
          <Heading ko={ko} size={32} koSize={22}>{ko ? '결과를 찾을 수 없습니다' : 'Result Not Found'}</Heading>
          <Body>{ko ? '링크가 만료되었거나 올바르지 않습니다' : 'The link may have expired or is invalid'}</Body>
          <div style={{ marginTop: 24 }}>
            <PillButton onClick={toLanding}>{ko ? '테스트 하러 가기' : 'Take the test'}</PillButton>
          </div>
        </div>
      </ArchetypeShell>
    );
  }

  const primaryArchetype = result.primary_archetype;
  const secondaryArchetype = result.secondary_archetype;
  const primaryColor = getArchetypeColor(primaryArchetype);
  const darkColor = getArchetypeDarkColor(primaryArchetype);
  const traits = getArchetypeTraits(primaryArchetype, language);

  const label: React.CSSProperties = { fontSize: 12.5, letterSpacing: 0.6, color: LIGHT, fontWeight: 600, textTransform: ko ? 'none' : 'uppercase' };

  return (
    <ArchetypeShell language={language} onLanguageChange={setLanguage} onBack={toLanding}>
      <Heading ko={ko} size={32} koSize={21}>
        {ko ? '친구의 무의식 아키타입' : "Your Friend's Unconscious Archetype"}
      </Heading>

      <div style={{ ...glass, borderRadius: 28, marginTop: 22, padding: '30px 22px 26px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${primaryColor} 0%, ${darkColor} 100%)`, opacity: 0.38 }} />
        <div style={{ position: 'relative' }}>
          <div style={label}>{ko ? '주요 아키타입' : 'Primary archetype'}</div>
          <div style={{ margin: '10px 0 6px', fontFamily: displayFont(ko), fontSize: ko ? 26 : 38, fontWeight: ko ? 500 : 400, lineHeight: 1.15, color: INK, textWrap: 'balance' as React.CSSProperties['textWrap'] }}>
            {getArchetypeName(primaryArchetype, language)}
          </div>
          <div style={{ fontFamily: displayFont(ko), fontStyle: ko ? 'normal' : 'italic', fontSize: ko ? 15 : 21, color: ROSE, lineHeight: 1.3 }}>
            {getArchetypeTagline(primaryArchetype, language)}
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 14.5, lineHeight: 1.7, color: BASE }}>
            {getArchetypeDescription(primaryArchetype, language)}
          </p>
        </div>
      </div>

      <div style={{ ...glass, borderRadius: 24, marginTop: 16, padding: '22px' }}>
        <div style={{ ...label, textAlign: 'center', marginBottom: 12 }}>{ko ? '주요 특성' : 'Key traits'}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.8, color: BASE, whiteSpace: 'pre-wrap' }}>{traits}</div>
      </div>

      {secondaryArchetype && (
        <div style={{ ...glass, borderRadius: 24, marginTop: 16, padding: '22px', textAlign: 'center' }}>
          <div style={label}>{ko ? '잘 어울리는 유형' : 'Compatible type'}</div>
          <div style={{ marginTop: 8, fontFamily: displayFont(ko), fontSize: ko ? 21 : 30, fontWeight: ko ? 500 : 400, color: INK }}>
            {getArchetypeName(secondaryArchetype, language)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 34, textAlign: 'center' }}>
        <Heading ko={ko} size={30} koSize={20}>
          {ko ? '당신의 무의식 아키타입은 무엇일까요?' : 'What is Your Unconscious Archetype?'}
        </Heading>
        <div style={{ marginTop: 22 }}>
          <PillButton onClick={handleTakeTest}>{ko ? '테스트 시작하기' : 'Start Test'}</PillButton>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: 1.8, color: LIGHT }}>
          {ko ? '12가지 아키타입 · 3-5분 · 로그인 불필요' : '12 archetypes · 3-5 minutes · No login required'}
        </p>
      </div>
    </ArchetypeShell>
  );
}
