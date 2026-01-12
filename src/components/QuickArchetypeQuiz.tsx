'use client';

import { useState } from 'react';
import { QUICK_ARCHETYPE_QUIZ, calculateQuickArchetype } from '../lib/quickArchetypeQuiz';
import {
  getArchetypeName,
  getArchetypeTagline,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor,
  getCompatibleArchetypes
} from '../lib/archetypes';

interface QuickArchetypeQuizProps {
  dreamText: string;
  language: 'ko' | 'en';
  onComplete: (result: {
    primaryArchetype: string;
    secondaryArchetype: string;
    archetypeScores: Record<string, number>;
    confidence: 'low' | 'medium' | 'high';
  }) => void;
  onSkip?: () => void;
}

export default function QuickArchetypeQuiz({
  dreamText,
  language,
  onComplete,
  onSkip
}: QuickArchetypeQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  const question = QUICK_ARCHETYPE_QUIZ[currentQuestion];
  const progress = ((currentQuestion + 1) / QUICK_ARCHETYPE_QUIZ.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = {
      ...answers,
      [question.id]: optionIndex
    };
    setAnswers(newAnswers);

    if (currentQuestion < QUICK_ARCHETYPE_QUIZ.length - 1) {
      // 다음 질문
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 마지막 질문 - 결과 계산
      const calculatedResult = calculateQuickArchetype(dreamText, newAnswers);
      setResult(calculatedResult);
      setShowResult(true);
      onComplete(calculatedResult);
    }
  };

  if (showResult && result) {
    const primaryColor = getArchetypeColor(result.primaryArchetype);
    const primaryDarkColor = getArchetypeDarkColor(result.primaryArchetype);

    const confidenceText = {
      high: { ko: '높음', en: 'High' },
      medium: { ko: '중간', en: 'Medium' },
      low: { ko: '낮음', en: 'Low' }
    };

    return (
      <div style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
        borderRadius: '24px',
        padding: '3rem 2rem',
        textAlign: 'center',
        animation: 'fadeIn 0.5s ease-in',
      }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '0.5rem'
        }}>
          {language === 'ko' ? '당신의 무의식 아키타입' : 'Your Unconscious Archetype'}
        </h2>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginTop: '2rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            {getArchetypeName(result.primaryArchetype, language)}
          </div>

          <div style={{
            fontSize: '15px',
            color: '#6b7280',
            fontStyle: 'italic',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            {getArchetypeTagline(result.primaryArchetype, language)}
          </div>

          <div style={{
            fontSize: '16px',
            color: '#4b5563',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            {getArchetypeDescription(result.primaryArchetype, language)}
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {getArchetypeTraits(result.primaryArchetype, language).map((trait, idx) => (
              <span
                key={idx}
                style={{
                  padding: '6px 12px',
                  background: primaryColor,
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#1f2937',
                  fontWeight: '500',
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {result.secondaryArchetype && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.25rem' }}>
              {language === 'ko' ? '잘 어울리는 유형' : 'Compatible Type'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
              {getArchetypeName(result.secondaryArchetype, language)}
            </div>
          </div>
        )}

        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          marginBottom: '1.5rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
        }}>
          {language === 'ko' ? '신뢰도' : 'Confidence'}: {confidenceText[result.confidence as 'high' | 'medium' | 'low'][language]}
          <br />
          {language === 'ko'
            ? '꿈을 더 많이 기록하면 더 정확한 프로파일을 얻을 수 있어요!'
            : 'Record more dreams for a more accurate profile!'}
        </div>

        {/* 추천 궁합 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            {language === 'ko' ? '나와 잘 맞는 아키타입' : 'Compatible Archetypes'}
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {getCompatibleArchetypes(result.primaryArchetype).map((compatibleKey, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 16px',
                  background: getArchetypeColor(compatibleKey),
                  border: `2px solid ${getArchetypeDarkColor(compatibleKey)}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: '600',
                }}
              >
                {getArchetypeName(compatibleKey, language)}
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {/* 상단: 진행바 + 건너뛰기 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
            {currentQuestion + 1} / {QUICK_ARCHETYPE_QUIZ.length}
          </span>
          {onSkip && (
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {language === 'ko' ? '건너뛰기' : 'Skip'}
            </button>
          )}
        </div>

        {/* 진행바 */}
        <div style={{
          height: '6px',
          background: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #7FB069 0%, #6d9a5a 100%)',
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* 질문 */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '2rem',
        lineHeight: '1.5',
      }}>
        {question.question[language]}
      </h3>

      {/* 선택지 */}
      <div style={{
        display: 'grid',
        gap: '1rem',
      }}>
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            style={{
              padding: '1rem 1.5rem',
              background: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              color: '#1f2937',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7FB069';
              e.currentTarget.style.borderColor = '#7FB069';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#1f2937';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {option.text[language]}
          </button>
        ))}
      </div>

      {/* 하단 힌트 */}
      <p style={{
        marginTop: '2rem',
        fontSize: '13px',
        color: '#9ca3af',
        textAlign: 'center',
      }}>
        {language === 'ko'
          ? '직관적으로 가장 먼저 떠오르는 답을 선택해주세요'
          : 'Choose the answer that comes to mind first'}
      </p>
    </div>
  );
}
