'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArchetypeTestNav from '../../../src/components/ArchetypeTestNav';
import '../../globals.css';

export default function GuestDreamRecording() {
  const router = useRouter();
  const [language] = useState<'ko' | 'en'>('ko');
  const [dreamText, setDreamText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!dreamText.trim()) {
      alert(language === 'ko' ? '꿈 내용을 입력해주세요' : 'Please enter your dream');
      return;
    }

    if (dreamText.length < 20) {
      alert(language === 'ko' ? '좀 더 자세히 작성해주세요 (최소 20자)' : 'Please write more details (min 20 chars)');
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
      router.push('/archetype-test/quiz');
    }, 500);
  };

  const handleSkip = () => {
    // Save empty dream
    localStorage.setItem('guest_dream', JSON.stringify({
      content: '',
      timestamp: new Date().toISOString(),
      skipped: true
    }));
    router.push('/archetype-test/quiz');
  };

  return (
    <>
      <ArchetypeTestNav language={language} />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 1rem'
      }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              ← 뒤로
            </button>
            <div style={{
              flex: 1,
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '33%',
                height: '100%',
                background: 'linear-gradient(90deg, #7FB069 0%, #8BC34A 100%)'
              }} />
            </div>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
            margin: 0
          }}>
            {language === 'ko' ? '1단계 / 2단계' : 'Step 1 / 2'}
          </p>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '60px', marginBottom: '1rem' }}>💭</div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem',
              fontFamily: "'Cormorant', serif"
            }}>
              {language === 'ko' ? '가장 기억나는 꿈 하나를 기록해주세요' : 'Record Your Most Memorable Dream'}
            </h1>
            <p style={{
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              {language === 'ko'
                ? '강렬하게 기억나는 꿈일수록 더 정확한 분석이 가능합니다. 편하게 작성하세요.'
                : 'The more vivid the dream, the more accurate the analysis. Write freely as you remember.'}
            </p>
          </div>

          {/* Dream Input */}
          <div style={{ marginBottom: '2rem' }}>
            <textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder={language === 'ko'
                ? '예: 넓은 바다를 헤엄치고 있었어요. 물은 맑고 따뜻했고, 멀리 섬이 보였어요...'
                : 'e.g., I was swimming in a vast ocean. The water was clear and warm, and I could see an island in the distance...'}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#7FB069';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '13px',
              color: '#9ca3af'
            }}>
              <span>
                {dreamText.length < 20
                  ? language === 'ko'
                    ? `최소 20자 (현재 ${dreamText.length}자)`
                    : `Min 20 chars (current ${dreamText.length})`
                  : language === 'ko'
                    ? `${dreamText.length}자`
                    : `${dreamText.length} chars`}
              </span>
              {dreamText.length >= 20 && (
                <span style={{ color: '#7FB069', fontWeight: '600' }}>✓</span>
              )}
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '0.75rem'
            }}>
              💡 {language === 'ko' ? '작성 팁' : 'Writing Tips'}
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.8'
            }}>
              <li>{language === 'ko' ? '장소나 환경을 묘사해보세요' : 'Describe the location or environment'}</li>
              <li>{language === 'ko' ? '등장인물이나 생명체가 있었나요?' : 'Were there any characters or beings?'}</li>
              <li>{language === 'ko' ? '어떤 감정을 느꼈나요?' : 'What emotions did you feel?'}</li>
              <li>{language === 'ko' ? '특별한 사건이나 행동이 있었나요?' : 'Were there any special events or actions?'}</li>
            </ul>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexDirection: 'column'
          }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || dreamText.length < 20}
              style={{
                width: '100%',
                padding: '16px',
                background: dreamText.length >= 20
                  ? 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
                  : '#e5e7eb',
                color: dreamText.length >= 20 ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: dreamText.length >= 20 ? 'pointer' : 'not-allowed',
                boxShadow: dreamText.length >= 20 ? '0 4px 12px rgba(127, 176, 105, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting
                ? (language === 'ko' ? '저장 중...' : 'Saving...')
                : (language === 'ko' ? '다음: 질문 답하기' : 'Next: Answer Questions')}
            </button>

            <button
              onClick={handleSkip}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {language === 'ko' ? '꿈 기억이 안나요 (건너뛰기)' : 'I don\'t remember (Skip)'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '13px',
          color: '#9ca3af'
        }}>
          <p>
            {language === 'ko'
              ? '🔒 입력한 꿈은 로컬에만 저장되며, 테스트 완료 후 삭제됩니다'
              : '🔒 Your dream is stored locally and deleted after the test'}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
