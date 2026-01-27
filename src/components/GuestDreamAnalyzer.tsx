'use client';

import { useState } from 'react';

interface GuestDreamAnalyzerProps {
  language: 'en' | 'ko';
  onBack: () => void;
  onSignUp: () => void;
}

interface AnalysisResult {
  interpretation: string;
  symbols: string[];
  archetype: string;
  mood: string;
  affirmation: string;
}

export default function GuestDreamAnalyzer({ language, onBack, onSignUp }: GuestDreamAnalyzerProps) {
  const [dreamText, setDreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = {
    title: language === 'ko' ? '꿈을 기록하세요' : 'Write Your Dream',
    placeholder: language === 'ko'
      ? '오늘 꾼 꿈을 자유롭게 적어주세요...\n\n예: 어젯밤 바다에서 수영하는 꿈을 꿨어요. 물이 너무 맑고 따뜻했고, 돌고래들이 주변에서 함께 헤엄쳤어요...'
      : 'Write your dream freely...\n\nExample: Last night I dreamed I was swimming in the ocean. The water was so clear and warm, and dolphins were swimming around me...',
    analyze: language === 'ko' ? '꿈 분석하기' : 'Analyze My Dream',
    analyzing: language === 'ko' ? '분석 중...' : 'Analyzing...',
    back: language === 'ko' ? '뒤로' : 'Back',
    minLength: language === 'ko' ? '최소 20자 이상 입력해주세요' : 'Please enter at least 20 characters',
    resultTitle: language === 'ko' ? '꿈 분석 결과' : 'Dream Analysis',
    symbols: language === 'ko' ? '주요 상징' : 'Key Symbols',
    archetype: language === 'ko' ? '아키타입' : 'Archetype',
    mood: language === 'ko' ? '감정 톤' : 'Emotional Tone',
    affirmation: language === 'ko' ? '오늘의 확언' : "Today's Affirmation",
    savePrompt: language === 'ko'
      ? '이 분석을 저장하고 싶으신가요?'
      : 'Want to save this analysis?',
    signUpCTA: language === 'ko'
      ? '무료 가입하고 월 7회 AI 분석 받기'
      : 'Sign up free for 7 AI analyses/month',
    guestNote: language === 'ko'
      ? '* 게스트 분석은 저장되지 않습니다'
      : '* Guest analysis is not saved',
    errorMsg: language === 'ko'
      ? '분석 중 오류가 발생했습니다. 다시 시도해주세요.'
      : 'An error occurred during analysis. Please try again.',
  };

  const moodEmojis: { [key: string]: string } = {
    peaceful: '😌',
    anxious: '😰',
    happy: '😊',
    sad: '😢',
    confused: '🤔',
    excited: '🤩',
    fearful: '😨',
    nostalgic: '🥹',
    balanced: '😐'
  };

  const handleAnalyze = async () => {
    if (dreamText.trim().length < 20) {
      setError(t.minLength);
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamText: dreamText.trim(),
          language,
          isGuest: true
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();

      setAnalysisResult({
        interpretation: data.interpretation || data.analysis || '',
        symbols: data.symbols || [],
        archetype: data.archetype || 'The Seeker',
        mood: data.mood || 'balanced',
        affirmation: data.affirmation || data.intention || ''
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t.errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show result
  if (analysisResult) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 50%, #e3f2fd 100%)',
        padding: '2rem',
        fontFamily: language === 'ko'
          ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif"
          : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              ←
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#333'
            }}>
              {t.resultTitle}
            </h1>
          </div>

          {/* Analysis Card */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            {/* Mood */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '2rem' }}>{moodEmojis[analysisResult.mood] || '😐'}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>{t.mood}</div>
                <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{analysisResult.mood}</div>
              </div>
            </div>

            {/* Interpretation */}
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.8',
              color: '#333',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'linear-gradient(135deg, #f8fdf8 0%, #fdf8fd 100%)',
              borderRadius: '12px'
            }}>
              {analysisResult.interpretation}
            </div>

            {/* Symbols */}
            {analysisResult.symbols.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{t.symbols}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {analysisResult.symbols.slice(0, 5).map((symbol, idx) => (
                    <span key={idx} style={{
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 100%)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      color: '#5a6c5a'
                    }}>
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Archetype */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{t.archetype}</div>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}>
                {analysisResult.archetype}
              </div>
            </div>

            {/* Affirmation */}
            {analysisResult.affirmation && (
              <div style={{
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                padding: '1.2rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.5rem' }}>{t.affirmation}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '500', lineHeight: '1.6' }}>
                  "{analysisResult.affirmation}"
                </div>
              </div>
            )}
          </div>

          {/* Sign Up CTA */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}>
            <p style={{
              fontSize: '1rem',
              color: '#333',
              marginBottom: '1rem'
            }}>
              {t.savePrompt}
            </p>
            <button
              onClick={onSignUp}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(127, 176, 105, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t.signUpCTA}
            </button>
            <p style={{
              fontSize: '0.8rem',
              color: '#999',
              marginTop: '1rem'
            }}>
              {t.guestNote}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Input form
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #f3e5f5 50%, #e3f2fd 100%)',
      padding: '2rem',
      fontFamily: language === 'ko'
        ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif"
        : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#333'
          }}>
            {t.title}
          </h1>
        </div>

        {/* Dream Input */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          marginBottom: '1rem'
        }}>
          <textarea
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            placeholder={t.placeholder}
            style={{
              width: '100%',
              minHeight: '250px',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              lineHeight: '1.8',
              resize: 'vertical',
              fontFamily: 'inherit',
              color: '#333'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #eee'
          }}>
            <span style={{
              fontSize: '0.85rem',
              color: dreamText.length < 20 ? '#999' : '#7FB069'
            }}>
              {dreamText.length} {language === 'ko' ? '자' : 'chars'}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff3f3',
            color: '#d32f2f',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || dreamText.trim().length < 20}
          style={{
            width: '100%',
            padding: '18px',
            background: isAnalyzing || dreamText.trim().length < 20
              ? '#ccc'
              : 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: isAnalyzing || dreamText.trim().length < 20 ? 'not-allowed' : 'pointer',
            boxShadow: isAnalyzing || dreamText.trim().length < 20
              ? 'none'
              : '0 8px 24px rgba(127, 176, 105, 0.4)',
            transition: 'all 0.3s'
          }}
        >
          {isAnalyzing ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              {t.analyzing}
            </span>
          ) : t.analyze}
        </button>

        <p style={{
          fontSize: '0.8rem',
          color: '#999',
          textAlign: 'center',
          marginTop: '1rem'
        }}>
          {t.guestNote}
        </p>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
