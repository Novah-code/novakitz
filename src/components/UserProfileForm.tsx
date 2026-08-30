'use client';

import { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface LocationData {
  ip: string;
  country_code: string;
  country_name: string;
  city: string;
  timezone: string;
  isMock?: boolean;
}

interface UserProfileFormProps {
  user: User;
  profile?: UserProfile;
  onComplete?: () => void;
  onCancel?: () => void;
}

/*
 * These go into the interpretation prompt, which is the only reason to ask.
 *
 * The list used to be a hobby survey — Gaming, Fashion, Beauty, Cooking,
 * Sports — eighteen chips on the first screen after sign-up, most of which
 * tell a reading nothing. What is left is the part of a life a dream tends to
 * be about: work, people, health, what someone makes, and how they already
 * think about their inner life.
 */
const INTEREST_OPTIONS = {
  en: ['Psychology', 'Self-development', 'Meditation', 'Spirituality',
       'Reading', 'Writing', 'Art', 'Music',
       'Nature', 'Relationships', 'Career', 'Health'],
  ko: ['심리학', '자기계발', '명상', '영성',
       '독서', '글쓰기', '예술', '음악',
       '자연', '관계', '커리어', '건강']
};

const OCCUPATION_OPTIONS = {
  en: ['Student', 'Employee', 'Freelancer', 'Entrepreneur', 'Artist', 'Healthcare',
       'Educator', 'Government', 'Service Industry', 'IT/Development', 'Design', 'Marketing',
       'Finance', 'Legal', 'Construction', 'Other', 'Job Seeking', 'Retired'],
  ko: ['학생', '직장인', '프리랜서', '사업가', '예술가', '의료인',
       '교육자', '공무원', '서비스업', 'IT/개발', '디자인', '마케팅',
       '금융', '법조인', '건설업', '기타', '구직 중', '은퇴']
};

const DREAM_GOAL_OPTIONS = {
  en: [
    'Understanding inner emotions',
    'Stress relief and relaxation',
    'Creative inspiration',
    'Problem solving insights',
    'Self-discovery and growth',
    'Spiritual guidance',
    'Processing daily experiences',
    'Overcoming fears and anxieties',
    'Exploring subconscious thoughts',
    'Entertainment and curiosity',
    'Relationship insights',
    'Career guidance',
    'Health and wellness awareness',
    'Personal healing'
  ],
  ko: [
    '내면의 감정 이해하기',
    '스트레스 해소와 이완',
    '창의적 영감',
    '문제 해결 통찰',
    '자기 발견과 성장',
    '영적 안내',
    '일상 경험 처리',
    '두려움과 불안 극복',
    '무의식적 생각 탐구',
    '재미와 호기심',
    '관계 통찰',
    '커리어 안내',
    '건강과 웰빙 인식',
    '개인적 치유'
  ]
};

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'KR', name: 'South Korea (대한민국)' },
  { code: 'JP', name: 'Japan (日本)' },
  { code: 'CN', name: 'China (中国)' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RU', name: 'Russia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'IL', name: 'Israel' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' }
];

// Translations
const translations = {
  en: {
    profileSetup: 'Profile Setup',
    subtitle: 'Tell us about yourself for personalized dream interpretation',
    step: 'Step',
    of: 'of',

    // Step titles
    step2Title: 'What should we call you?',
    ageTitle: 'One more, if you like',

    // Step 1
    dateOfBirth: 'Date of Birth',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    country: 'Country',
    preferredLanguage: 'Preferred Language',
    detectingLocation: 'Detecting your location...',

    // Step 2
    name: 'Your name',
    namePlaceholder: 'Enter a unique nickname',

    // Step 3

    // Step 4

    // Step 5

    // Buttons
    next: 'Next',
    skip: 'Skip',
    skipAll: 'Set this up later',
    back: 'Back',
    complete: 'Complete',
    saving: 'Saving...',

    // Validation
    fillRequired: 'Please fill in all required fields',
    checkingNickname: 'Checking availability...'
  },
  ko: {
    profileSetup: '프로필 설정',
    subtitle: '개인화된 꿈 해석을 위해 자신에 대해 알려주세요',
    step: '단계',
    of: '/',

    // Step titles
    step2Title: '어떻게 불러드릴까요?',
    ageTitle: '하나만 더, 원하신다면',

    // Step 1
    dateOfBirth: '생년월일',
    year: '년',
    month: '월',
    day: '일',
    country: '국가',
    preferredLanguage: '선호 언어',
    detectingLocation: '위치를 감지하는 중...',

    // Step 2
    name: '이름',
    namePlaceholder: '고유한 닉네임을 입력하세요',

    // Step 3

    // Step 4

    // Step 5

    // Buttons
    next: '다음',
    skip: '건너뛰기',
    skipAll: '나중에 설정하기',
    back: '이전',
    complete: '완료',
    saving: '저장 중...',

    // Validation
    fillRequired: '필수 항목을 모두 입력해주세요',
    checkingNickname: '사용 가능 여부 확인 중...'
  }
};

const monthOptions = [
  { value: '01', label: 'January', labelKo: '1월' },
  { value: '02', label: 'February', labelKo: '2월' },
  { value: '03', label: 'March', labelKo: '3월' },
  { value: '04', label: 'April', labelKo: '4월' },
  { value: '05', label: 'May', labelKo: '5월' },
  { value: '06', label: 'June', labelKo: '6월' },
  { value: '07', label: 'July', labelKo: '7월' },
  { value: '08', label: 'August', labelKo: '8월' },
  { value: '09', label: 'September', labelKo: '9월' },
  { value: '10', label: 'October', labelKo: '10월' },
  { value: '11', label: 'November', labelKo: '11월' },
  { value: '12', label: 'December', labelKo: '12월' }
];

export default function UserProfileForm({ user, profile, onComplete }: UserProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  /*
   * Two steps, and only the first is required.
   *
   * This asked five: birth date, nickname, occupation, interests, dream goals
   * — a wall of questions between signing up and seeing the app. Of everything
   * it collected, exactly one value is read anywhere that matters: the nickname,
   * which appears on the card, the profile and the community.
   *
   * `birth_date` was stored and never read by anything; only the age derived
   * from it has any use, so the three selects became one number. Occupation,
   * interests and dream goals fed one prompt (`generateDailyIntention`) that
   * already handles them being absent, and they are still editable later in
   * Profile — they just no longer stand between a new account and the app.
   */
  const totalSteps = 2;

  /*
   * Language state (must be first to use in translations).
   *
   * Order of authority: what this account already chose, then what the app is
   * currently showing (saved by the toggle), then the phone. The IP lookup
   * below no longer gets a say — see the note on it.
   */
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ko'>(() => {
    const fromProfile = profile?.preferred_language as 'en' | 'ko' | undefined;
    if (fromProfile) return fromProfile;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
      if (saved) return saved;
      if (navigator.language?.toLowerCase().startsWith('ko')) return 'ko';
    }
    return 'en';
  });
  const t = translations[preferredLanguage];

  /*
   * It is a name now, not a handle.
   *
   * It used to be a unique nickname: no spaces, no duplicates, at least three
   * characters — the rules of a username, applied to the one field that shows
   * up as "by ___" on someone's card. Nothing needs it to be unique. Two people
   * called Anna are two people called Anna.
   *
   * So the uniqueness check is gone and spaces are allowed, because names have
   * them. Letters only, and Latin ones: this field appears on shared profiles
   * and the app ships to English-speaking markets.
   *
   * ProfileSettings edits the same field and keeps an identical copy of these
   * rules. They have drifted apart once already — Hangul was accepted here and
   * rejected there, so a name you signed up with could not be saved again — so
   * the two must be changed together.
   */
  const validateNickname = (nickname: string): { isValid: boolean; error: string } => {
    const trimmed = nickname.trim();

    if (trimmed.length < 2) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '두 글자 이상 적어주세요' : 'At least two letters' };
    }
    if (trimmed.length > 20) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '스무 글자까지 됩니다' : 'Up to twenty letters' };
    }

    // Letters and the spaces between them. Names have spaces; handles did not.
    if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(trimmed)) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '영문으로 적어주세요' : 'Letters only, please' };
    }

    return { isValid: true, error: '' };
  };

  // Form data
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [nicknameError, setNicknameError] = useState('');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');

  // Location data
  const [countryCode, setCountryCode] = useState('US');
  const [countryName, setCountryName] = useState('United States');
  const [detectingLocation, setDetectingLocation] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('/api/get-location');
        const data: LocationData = await response.json();

        /*
         * Country and city only. This used to set the language too, which meant
         * an English phone sitting in Korea had its language flipped to Korean
         * halfway through signing up — the network overruling the device, and
         * sometimes the person's own toggle. The language is decided above now,
         * from the phone, before this request has even returned.
         */
        setCountryCode(data.country_code);
        setCountryName(data.country_name);
      } catch (error) {
        console.error('Error fetching location:', error);
      } finally {
        setDetectingLocation(false);
      }
    };

    if (!profile) {
      fetchLocation();
    } else {
      setDetectingLocation(false);
    }
  }, [profile]);

  const handleNext = async () => {
    console.log('handleNext called - currentStep:', currentStep, 'totalSteps:', totalSteps, 'fullName:', fullName);
    setError('');

    // Step 1 — the nickname, and the only thing this form insists on.
    if (currentStep === 1) {
      if (!fullName || fullName.trim().length === 0) {
        setError(preferredLanguage === 'ko' ? '닉네임을 입력해주세요' : 'Please enter a nickname');
        return;
      }

      const validation = validateNickname(fullName);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      // No uniqueness check. Two people called Anna are two people called Anna,
      // and being told your own name is taken is a strange thing to read on the
      // first screen of an app.
    }

    // Step 2 is age, and it is skippable. Nothing to validate.

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSkip = () => {
    setError('');
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  /**
   * Leave the whole thing for later.
   *
   * Steps 1 and 2 were mandatory — a birth date and a nickname before the app
   * would open at all — and the per-step Skip only appeared from step 3. There
   * was no way past them, so anyone who did not want to answer was simply
   * stuck, and so was anyone whose profile row went missing. App Review is in
   * that position too, on the first screen after signing in, and 5.1.1(v) does
   * not allow requiring personal information the app does not need to run.
   *
   * This writes the row, empty, so the question counts as answered and is not
   * asked again on every launch. Everything in it can be filled in later from
   * Profile, which is where it was always editable.
   */
  const handleSkipAll = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, profile_completed: false }, { onConflict: 'user_id' });
      if (error) throw error;
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('Skip profile error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const updateData: any = {
        full_name: fullName || null,
        display_name: fullName || null,  // Also save to display_name for table display
        age: age ? Number(age) : null,
        country_name: countryName || null,
        profile_completed: true
      };

      console.log('Saving profile with updateData:', updateData);
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          { user_id: user.id, ...updateData },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
      console.log('Profile saved successfully');

      // Save nickname to nicknames table for duplicate checking
      if (fullName) {
        const { error: nicknameError } = await supabase
          .from('nicknames')
          .upsert(
            { user_id: user.id, nickname: fullName },
            { onConflict: 'user_id' }
          );

        if (nicknameError) {
          console.error('Error saving nickname:', nicknameError);
          // Don't throw - profile is already saved
        }
      }

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    const titles = [t.step2Title, t.ageTitle];
    return titles[currentStep - 1];
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      // 100vh spans the whole screen, status bar included, so a centred card
      // tall enough to fill it puts its heading under the clock. The insets
      // resolve to 0 on the web, where this reads as plain 2rem padding.
      padding: '2rem',
      paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
      fontFamily: preferredLanguage === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        padding: '40px',
        borderRadius: '24px',
        backdropFilter: 'blur(30px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.85)',
        border: '2px solid rgba(127, 176, 105, 0.3)',
        boxShadow: '0 8px 32px rgba(127, 176, 105, 0.2), 0 2px 8px rgba(0, 0, 0, 0.05)',
        maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 4rem)',
        overflowY: 'auto'
      }}>
        <style>{`
          div::-webkit-scrollbar {
            width: 8px;
          }
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: white;
            border-radius: 10px;
          }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--matcha-dark)',
            marginBottom: '8px',
            lineHeight: '1.3'
          }}>{t.profileSetup}</h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--sage)',
            lineHeight: '1.4',
            opacity: 0.85,
            marginBottom: '8px'
          }}>{t.subtitle}</p>
          <p style={{
            fontSize: '12px',
            color: 'var(--matcha-green)',
            lineHeight: '1.3'
          }}>{t.step} {currentStep} {t.of} {totalSteps}</p>
        </div>

        {/* Step Title */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--matcha-dark)',
          marginBottom: '20px',
          lineHeight: '1.3',
          textAlign: 'center'
        }}>{getStepTitle()}</h3>

        {/* Step Content */}
        <div style={{ marginBottom: '24px' }}>
          {/* Step 1 — the nickname. The one answer the app actually uses. */}
          {currentStep === 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                {t.name}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFullName(newValue);
                  // 실시간 검증
                  if (newValue.length > 0) {
                    const validation = validateNickname(newValue);
                    setNicknameError(validation.error);
                  } else {
                    setNicknameError('');
                  }
                }}
                placeholder={t.namePlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: nicknameError ? '2px solid #d32f2f' : '2px solid rgba(127, 176, 105, 0.2)',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'rgba(255, 255, 255, 0.8)',
                  transition: 'border-color 0.3s'
                }}
              />
              {nicknameError && (
                <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                  {nicknameError}
                </div>
              )}
            </div>
          )}

          {/*
            Step 2 — age, optional.
            
            It used to be a birth date across three selects, and `birth_date`
            was then never read by anything. Only the derived age is of any
            use, so it is asked for directly: one field instead of three, and
            skippable, because nobody owes it before they have seen the app.
          */}
          {currentStep === 2 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                {preferredLanguage === 'ko' ? '나이 (선택)' : 'Age (optional)'}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={13}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                placeholder={preferredLanguage === 'ko' ? '예: 29' : 'e.g. 29'}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid rgba(127, 176, 105, 0.2)',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--sage)', margin: '8px 0 0' }}>
                {preferredLanguage === 'ko'
                  ? '해석의 맥락으로만 씁니다. 어디에도 표시되지 않아요.'
                  : 'Used only as context for your readings. It is never shown anywhere.'}
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '14px', lineHeight: '1.4', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid rgba(127, 176, 105, 0.2)',
                background: 'rgba(127, 176, 105, 0.08)',
                color: 'var(--matcha-dark)',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.back}
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleSkip}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid rgba(127, 176, 105, 0.2)',
                background: 'rgba(127, 176, 105, 0.08)',
                color: 'var(--matcha-dark)',
                fontSize: '15px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {t.skip}
            </button>
          )}

          <button
            onClick={currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={loading || (currentStep === 1 && detectingLocation)}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: loading ? '#9ca3af' : 'var(--matcha-green)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: (loading || (currentStep === 1 && detectingLocation)) ? 'not-allowed' : 'pointer',
              opacity: (loading || (currentStep === 1 && detectingLocation)) ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
            }}
          >
            {loading ? t.saving : (currentStep === totalSteps ? t.complete : t.next)}
          </button>
        </div>

        {/*
          * A way out, on every step. Quiet rather than hidden: this is the
          * first screen after signing in, and nothing behind it needs a birth
          * date to work.
          */}
        <button
          onClick={handleSkipAll}
          disabled={loading}
          style={{
            display: 'block',
            margin: '14px auto 0',
            padding: '6px 10px',
            background: 'none',
            border: 'none',
            color: 'rgba(90, 132, 73, 0.7)',
            fontSize: '13px',
            textDecoration: 'underline',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {t.skipAll}
        </button>
      </div>
    </div>
  );
}
