'use client';

import { goTo } from '../../../src/lib/platform';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ARCHETYPE_QUIZ_QUESTIONS, getQuizProgress } from '../../../src/lib/archetypeQuiz';
import ArchetypeShell, { Heading, PillButton, Progress, glass } from '../../../src/components/ArchetypeShell';
import { INK, BASE, LIGHT, PINK, displayFont } from '../../../src/lib/skyUi';
import '../../globals.css';

export default function ArchetypeQuiz() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    // Check if guest dream was saved
    const guestDream = localStorage.getItem('guest_dream');
    if (!guestDream) {
      goTo('/archetype-test/');
    }

    // Load language from localStorage
    const savedLanguage = localStorage.getItem('test_language') as 'ko' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
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
      goTo('/archetype-test/result/');
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

  const ko = language === 'ko';
  const total = ARCHETYPE_QUIZ_QUESTIONS.length;

  return (
    <ArchetypeShell
      language={language}
      onBack={currentQuestion > 0 ? handlePrevious : undefined}
    >
      <Progress pct={((currentQuestion + 1) / total) * 100} />
      <p style={{ margin: '12px 0 22px', textAlign: 'center', fontSize: 13, letterSpacing: 0.4, color: LIGHT }}>
        {ko ? `질문 ${currentQuestion + 1} / ${total}` : `Question ${currentQuestion + 1} / ${total}`}
      </p>

      <Heading ko={ko} size={32} koSize={22} style={{ lineHeight: ko ? 1.45 : 1.2 }}>
        {question.question[language]}
      </Heading>

      <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
        {question.options.map((option, index) => {
          const on = selectedOption === index;
          return (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              aria-pressed={on}
              style={{
                ...glass,
                width: '100%',
                padding: '16px 18px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: 15,
                lineHeight: 1.55,
                color: INK,
                cursor: 'pointer',
                ...(on ? { background: 'rgba(255,255,255,0.97)', border: `1.5px solid ${INK}` } : {}),
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  border: `1.5px solid ${on ? PINK : 'rgba(74,93,78,0.35)'}`,
                  background: on ? PINK : 'transparent',
                  boxShadow: on ? 'inset 0 0 0 4px rgba(255,255,255,0.95)' : 'none',
                }}
              />
              <span style={{ flex: 1 }}>{option.text[language]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 28 }}>
        <PillButton onClick={handleNext} disabled={selectedOption === null}>
          {isLastQuestion ? (ko ? '결과 보기' : 'See Results') : (ko ? '다음 질문' : 'Next Question')}
        </PillButton>
      </div>

      <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 12.5, color: LIGHT }}>
        {ko ? '모든 답변은 익명으로 처리되며 외부에 공유되지 않습니다' : 'All answers are anonymous and not shared externally'}
      </p>
    </ArchetypeShell>
  );
}
