'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ARCHETYPE_QUIZ_QUESTIONS, getQuizProgress } from '../../../src/lib/archetypeQuiz';
import ArchetypeTestNav from '../../../src/components/ArchetypeTestNav';
import '../../globals.css';

export default function ArchetypeQuiz() {
  const router = useRouter();
  const [language] = useState<'ko' | 'en'>('ko');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    // Check if guest dream was saved
    const guestDream = localStorage.getItem('guest_dream');
    if (!guestDream) {
      router.push('/archetype-test');
    }

    // Load any existing answers
    const savedAnswers = localStorage.getItem('guest_quiz_answers');
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [router]);

  const question = ARCHETYPE_QUIZ_QUESTIONS[currentQuestion];
  const progress = getQuizProgress(answers);
  const isLastQuestion = currentQuestion === ARCHETYPE_QUIZ_QUESTIONS.length - 1;

  const handleSelectOption = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) {
      alert(language === 'ko' ? '답변을 선택해주세요' : 'Please select an answer');
      return;
    }

    // Save answer
    const newAnswers = {
      ...answers,
      [question.id]: selectedOption
    };
    setAnswers(newAnswers);
    localStorage.setItem('guest_quiz_answers', JSON.stringify(newAnswers));

    if (isLastQuestion) {
      // Go to results
      router.push('/archetype-test/result');
    } else {
      // Next question
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      // Load previous answer
      const prevAnswer = answers[ARCHETYPE_QUIZ_QUESTIONS[currentQuestion - 1].id];
      setSelectedOption(prevAnswer !== undefined ? prevAnswer : null);
    }
  };

  if (!question) {
    return null;
  }

  return (
    <>
      <ArchetypeTestNav language={language} />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 1rem'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header with Progress */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              style={{
                padding: '8px 16px',
                background: currentQuestion === 0 ? '#f3f4f6' : '#7FB069',
                color: currentQuestion === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                marginRight: '1rem'
              }}
            >
              ← 이전
            </button>
            <div style={{
              flex: 1,
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentQuestion + 1) / ARCHETYPE_QUIZ_QUESTIONS.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #7FB069 0%, #8BC34A 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            margin: 0
          }}>
            {language === 'ko'
              ? `질문 ${currentQuestion + 1} / ${ARCHETYPE_QUIZ_QUESTIONS.length}`
              : `Question ${currentQuestion + 1} / ${ARCHETYPE_QUIZ_QUESTIONS.length}`}
          </p>
        </div>

        {/* Question Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginBottom: '2rem'
        }}>
          {/* Question */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#7FB069',
              marginBottom: '1rem'
            }}>
              Q{currentQuestion + 1}
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              lineHeight: '1.4',
              margin: 0
            }}>
              {question.question[language]}
            </h2>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                style={{
                  width: '100%',
                  padding: '20px',
                  background: selectedOption === index
                    ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)'
                    : 'white',
                  border: `2px solid ${selectedOption === index ? '#7FB069' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: '#1f2937',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedOption !== index) {
                    e.currentTarget.style.borderColor = 'rgba(127, 176, 105, 0.5)';
                    e.currentTarget.style.background = 'rgba(249, 250, 251, 1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedOption !== index) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Radio Button */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedOption === index ? '#7FB069' : '#d1d5db'}`,
                    marginRight: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {selectedOption === index && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#7FB069'
                      }} />
                    )}
                  </div>
                  {/* Option Text */}
                  <span style={{ flex: 1 }}>
                    {option.text[language]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={selectedOption === null}
          style={{
            width: '100%',
            padding: '16px',
            background: selectedOption !== null
              ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
              : '#e5e7eb',
            color: selectedOption !== null ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedOption !== null ? 'pointer' : 'not-allowed',
            boxShadow: selectedOption !== null ? '0 4px 12px rgba(127, 176, 105, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {isLastQuestion
            ? (language === 'ko' ? '결과 보기' : 'See Results')
            : (language === 'ko' ? '다음 질문' : 'Next Question')}
        </button>

        {/* Skip Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '13px',
          color: '#9ca3af'
        }}>
          <p>
            {language === 'ko'
              ? '🔒 모든 답변은 익명으로 처리되며 외부에 공유되지 않습니다'
              : '🔒 All answers are anonymous and not shared externally'}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
