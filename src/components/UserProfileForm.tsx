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

const INTEREST_OPTIONS = {
  en: ['Psychology', 'Self-development', 'Meditation', 'Yoga', 'Reading', 'Movies',
       'Music', 'Travel', 'Cooking', 'Sports', 'Arts', 'Writing',
       'Gaming', 'Technology', 'Nature', 'Animals', 'Fashion', 'Beauty'],
  ko: ['심리학', '자기계발', '명상', '요가', '독서', '영화',
       '음악', '여행', '요리', '운동', '예술', '글쓰기',
       '게임', '기술', '자연', '동물', '패션', '뷰티']
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
    step1Title: 'Basic Information',
    step2Title: 'Your Nickname',
    step3Title: 'Your Occupation',
    step4Title: 'Your Interests',
    step5Title: 'Dream Goals',

    // Step 1
    dateOfBirth: 'Date of Birth',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    country: 'Country',
    preferredLanguage: 'Preferred Language',
    detectingLocation: 'Detecting your location...',

    // Step 2
    name: 'Nickname',
    namePlaceholder: 'Enter a unique nickname',

    // Step 3
    occupation: 'Occupation',
    selectOccupation: 'Select your occupation',

    // Step 4
    interestsDesc: 'Select interests that help us understand your dreams better',

    // Step 5
    dreamGoalsDesc: 'What do you hope to gain from dream interpretation?',

    // Buttons
    next: 'Next',
    skip: 'Skip',
    back: 'Back',
    complete: 'Complete',
    saving: 'Saving...',

    // Validation
    fillRequired: 'Please fill in all required fields',
    nicknameTaken: 'This nickname is already taken. Please choose another one.',
    checkingNickname: 'Checking availability...'
  },
  ko: {
    profileSetup: '프로필 설정',
    subtitle: '개인화된 꿈 해석을 위해 자신에 대해 알려주세요',
    step: '단계',
    of: '/',

    // Step titles
    step1Title: '기본 정보',
    step2Title: '닉네임',
    step3Title: '직업',
    step4Title: '관심사',
    step5Title: '꿈 목표',

    // Step 1
    dateOfBirth: '생년월일',
    year: '년',
    month: '월',
    day: '일',
    country: '국가',
    preferredLanguage: '선호 언어',
    detectingLocation: '위치를 감지하는 중...',

    // Step 2
    name: '닉네임',
    namePlaceholder: '고유한 닉네임을 입력하세요',

    // Step 3
    occupation: '직업',
    selectOccupation: '직업을 선택하세요',

    // Step 4
    interestsDesc: '꿈을 더 잘 이해하는 데 도움이 될 관심사를 선택하세요',

    // Step 5
    dreamGoalsDesc: '꿈 해석을 통해 무엇을 얻고 싶으신가요?',

    // Buttons
    next: '다음',
    skip: '건너뛰기',
    back: '이전',
    complete: '완료',
    saving: '저장 중...',

    // Validation
    fillRequired: '필수 항목을 모두 입력해주세요',
    nicknameTaken: '이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.',
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
  const totalSteps = 5;

  // Language state (must be first to use in translations)
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ko'>(profile?.preferred_language as 'en' | 'ko' || 'en');
  const t = translations[preferredLanguage];

  // Validate nickname: 영문, 숫자, 한글만 허용, 공백 제외, 3-20자
  const validateNickname = (nickname: string): { isValid: boolean; error: string } => {
    // 공백 확인
    if (nickname.includes(' ')) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '공백은 사용할 수 없습니다' : 'Spaces are not allowed' };
    }

    // 길이 확인
    if (nickname.length < 3) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '최소 3자 이상입니다' : 'Minimum 3 characters' };
    }
    if (nickname.length > 20) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '최대 20자 이내입니다' : 'Maximum 20 characters' };
    }

    // 영문, 숫자, 한글만 허용
    const validPattern = /^[a-zA-Z0-9가-힣]+$/;
    if (!validPattern.test(nickname)) {
      return { isValid: false, error: preferredLanguage === 'ko' ? '영문, 숫자, 한글만 사용 가능합니다' : 'Only English, numbers, and Korean allowed' };
    }

    return { isValid: true, error: '' };
  };

  // Form data
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [nicknameError, setNicknameError] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [occupation, setOccupation] = useState(profile?.occupation || '');
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [dreamGoals, setDreamGoals] = useState<string[]>(
    profile?.dream_goals ? profile.dream_goals.split(', ') : []
  );

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

        setCountryCode(data.country_code);
        setCountryName(data.country_name);

        if (data.country_code === 'KR') {
          setPreferredLanguage('ko');
        }
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

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length: 87}, (_, i) => currentYear - 13 - i);

  // Generate day options
  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };
  const dayOptions = Array.from(
    {length: getDaysInMonth(birthYear, birthMonth)},
    (_, i) => i + 1
  );

  const handleNext = async () => {
    console.log('handleNext called - currentStep:', currentStep, 'totalSteps:', totalSteps, 'fullName:', fullName);
    setError('');

    // Validate Step 1 (required fields)
    if (currentStep === 1) {
      if (!birthYear || !birthMonth || !birthDay) {
        setError(t.fillRequired);
        return;
      }
    }

    // Validate Step 2 (nickname is REQUIRED)
    if (currentStep === 2) {
      // Check if nickname is empty
      if (!fullName || fullName.trim().length === 0) {
        setError(preferredLanguage === 'ko' ? '닉네임을 입력해주세요' : 'Please enter a nickname');
        return;
      }

      // Validate nickname format
      const validation = validateNickname(fullName);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      console.log('Step 2: Checking nickname uniqueness for:', fullName);
      setLoading(true);
      try {
        // Check if nickname already exists in nicknames table
        console.log('Querying nicknames table for:', fullName);
        const { data, error: queryError } = await supabase
          .from('nicknames')
          .select('id')
          .eq('nickname', fullName)
          .maybeSingle();

        console.log('Nickname query result:', { data, error: queryError });

        if (queryError) throw queryError;

        if (data) {
          console.warn('Nickname already taken:', fullName);
          setError(t.nicknameTaken);
          setLoading(false);
          return;
        }

        console.log('Nickname is available:', fullName);
      } catch (err) {
        console.error('Error checking nickname:', err);
      } finally {
        setLoading(false);
      }
    }

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

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateAge = () => {
    if (!birthYear || !birthMonth || !birthDay) return undefined;
    const today = new Date();
    const birth = new Date(`${birthYear}-${birthMonth}-${birthDay}`);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const updateData: any = {
        full_name: fullName || null,
        display_name: fullName || null,  // Also save to display_name for table display
        birth_date: birthYear && birthMonth && birthDay ? `${birthYear}-${birthMonth}-${birthDay}` : null,
        age: calculateAge(),
        country_name: countryName || null,
        occupation: occupation || null,
        interests: interests.length > 0 ? interests : null,
        dream_goals: dreamGoals.length > 0 ? dreamGoals.join(', ') : null,
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

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleDreamGoal = (goal: string) => {
    setDreamGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const getStepTitle = () => {
    const titles = [
      t.step1Title, t.step2Title, t.step3Title, t.step4Title,
      t.step5Title
    ];
    return titles[currentStep - 1];
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      padding: '2rem',
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
        maxHeight: '90vh',
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
          {/* Step 1: Birth Date, Country, Language */}
          {currentStep === 1 && (
            <>
              {detectingLocation ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--matcha-green)' }}>
                  {t.detectingLocation}
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                      {t.dateOfBirth}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <option value="">{t.year}</option>
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <option value="">{t.month}</option>
                        {monthOptions.map(month => (
                          <option key={month.value} value={month.value}>
                            {preferredLanguage === 'ko' ? month.labelKo : month.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', background: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        <option value="">{t.day}</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day.toString().padStart(2, '0')}>{day}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                      {t.country}
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        const selected = COUNTRIES.find(c => c.code === e.target.value);
                        setCountryCode(e.target.value);
                        setCountryName(selected?.name || e.target.value);
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', background: 'rgba(255, 255, 255, 0.8)' }}
                    >
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                      {t.preferredLanguage}
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setPreferredLanguage('en')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: preferredLanguage === 'en' ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                          background: preferredLanguage === 'en' ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                          color: 'var(--matcha-dark)',
                          fontSize: '14px',
                          fontWeight: preferredLanguage === 'en' ? '600' : '400',
                          cursor: 'pointer'
                        }}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredLanguage('ko')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: preferredLanguage === 'ko' ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                          background: preferredLanguage === 'ko' ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                          color: 'var(--matcha-dark)',
                          fontSize: '14px',
                          fontWeight: preferredLanguage === 'ko' ? '600' : '400',
                          cursor: 'pointer'
                        }}
                      >
                        한국어
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 2: Name */}
          {currentStep === 2 && (
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

          {/* Step 3: Occupation */}
          {currentStep === 3 && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                {t.occupation}
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', background: 'rgba(255, 255, 255, 0.8)' }}
              >
                <option value="">{t.selectOccupation}</option>
                {(OCCUPATION_OPTIONS[preferredLanguage] || OCCUPATION_OPTIONS.en).map((option, idx) => (
                  <option key={`${option}-${idx}`} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 4: Interests */}
          {currentStep === 4 && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--sage)', marginBottom: '16px', lineHeight: '1.4' }}>
                {t.interestsDesc}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                {(INTEREST_OPTIONS[preferredLanguage] || INTEREST_OPTIONS.en).map((interest, idx) => (
                  <button
                    key={`${interest}-${idx}`}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: interests.includes(interest) ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                      background: interests.includes(interest) ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      color: 'var(--matcha-dark)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Dream Goals */}
          {currentStep === 5 && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--sage)', marginBottom: '16px', lineHeight: '1.4' }}>
                {t.dreamGoalsDesc}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(DREAM_GOAL_OPTIONS[preferredLanguage] || DREAM_GOAL_OPTIONS.en).map((goal, idx) => (
                  <button
                    key={`${goal}-${idx}`}
                    type="button"
                    onClick={() => toggleDreamGoal(goal)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid',
                      borderColor: dreamGoals.includes(goal) ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                      background: dreamGoals.includes(goal) ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      color: 'var(--matcha-dark)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    {goal}
                  </button>
                ))}
              </div>
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

          {currentStep > 2 && currentStep < totalSteps && (
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
      </div>
    </div>
  );
}
