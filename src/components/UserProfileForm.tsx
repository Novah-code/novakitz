'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfileFormProps {
  user: User;
  language: 'en' | 'ko';
  onComplete: () => void;
}

const translations = {
  en: {
    title: 'Welcome to Novakitz',
    subtitle: 'Help us personalize your dream journey',
    step: 'Step',
    of: 'of',

    // Navigation buttons
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    complete: 'Complete',

    // Step 1: Required fields
    step1Title: 'Basic Information',
    step1Subtitle: 'Required to get started',
    fullName: 'Full Name',
    namePlaceholder: 'Enter your name',
    birthDate: 'Birth Date',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    country: 'Country',
    autoDetected: 'Auto-detected',
    language: 'Preferred Language',
    english: 'English',
    korean: '한국어',
    fillRequired: 'Please fill in all required fields',

    // Occupation options
    occupations: ['Student', 'Employee', 'Freelancer', 'Entrepreneur', 'Artist', 'Healthcare', 'Educator', 'Government', 'Service Industry', 'IT/Development', 'Design', 'Marketing', 'Finance', 'Legal', 'Construction', 'Other', 'Job Seeking', 'Retired'],

    // Step 2: Occupation + Interests
    step2Title: 'Tell us about yourself',
    step2Subtitle: 'Optional - helps understand your dream context',
    occupation: 'Occupation',
    occupationPlaceholder: 'Select your occupation',
    interests: 'Interests',
    interestsSubtitle: 'Select interests that might help us understand your dreams better (multiple selection allowed)',
    interestOptions: ['Psychology', 'Self-development', 'Meditation', 'Yoga', 'Reading', 'Movies', 'Music', 'Travel', 'Cooking', 'Sports', 'Arts', 'Writing', 'Gaming', 'Technology', 'Nature', 'Animals', 'Fashion', 'Beauty'],

    // Step 3: Sleep
    step3Title: 'Tell us about your sleep',
    step3Subtitle: 'Optional - understanding your sleep patterns',
    avgSleepHours: 'Average Sleep Hours',
    sleepQuality: 'Sleep Quality',
    sleepTime: 'Usual Sleep Time',
    sleepTimePlaceholder: 'e.g., 11pm - 7am',
    sleepHourOptions: ['Less than 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', 'More than 8 hours'],
    sleepQualityOptions: ['Very Poor', 'Poor', 'Fair', 'Good', 'Very Good'],

    // Step 4: Goals + Bio
    step4Title: 'What are your dream goals?',
    step4Subtitle: 'Optional - what do you hope to achieve?',
    dreamGoals: 'Dream Goals',
    dreamGoalsSubtitle: 'What do you hope to gain from dream interpretation? (select all that apply)',
    dreamGoalOptions: [
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
    bio: 'Bio / Notes',
    bioPlaceholder: 'Any other information that might help with dream analysis',

    saving: 'Saving...',
    error: 'Error saving profile. Please try again.',
  },
  ko: {
    title: 'Novakitz에 오신 것을 환영합니다',
    subtitle: '당신의 꿈 여정을 개인화하는 데 도움을 주세요',
    step: '단계',
    of: '/',

    next: '다음',
    back: '이전',
    skip: '건너뛰기',
    complete: '완료',

    step1Title: '기본 정보',
    step1Subtitle: '시작하기 위해 필요한 정보입니다',
    fullName: '이름',
    namePlaceholder: '이름을 입력하세요',
    birthDate: '생년월일',
    year: '년',
    month: '월',
    day: '일',
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    country: '국가',
    autoDetected: '자동 감지됨',
    language: '선호 언어',
    english: 'English',
    korean: '한국어',
    fillRequired: '모든 필수 항목을 입력해주세요',

    occupations: ['학생', '직장인', '프리랜서', '사업가', '예술가', '의료인', '교육자', '공무원', '서비스업', 'IT/개발', '디자인', '마케팅', '금융', '법조인', '건설업', '기타', '구직 중', '은퇴'],

    step2Title: '자신에 대해 알려주세요',
    step2Subtitle: '선택사항 - 꿈의 맥락을 이해하는 데 도움이 됩니다',
    occupation: '직업',
    occupationPlaceholder: '직업을 선택하세요',
    interests: '관심사',
    interestsSubtitle: '꿈을 더 잘 이해하는 데 도움이 될 수 있는 관심사를 선택하세요 (다중 선택 가능)',
    interestOptions: ['심리학', '자기계발', '명상', '요가', '독서', '영화', '음악', '여행', '요리', '운동', '예술', '글쓰기', '게임', '기술', '자연', '동물', '패션', '뷰티'],

    step3Title: '수면 패턴을 알려주세요',
    step3Subtitle: '선택사항 - 수면 패턴 이해하기',
    avgSleepHours: '평균 수면 시간',
    sleepQuality: '수면의 질',
    sleepTime: '주로 자는 시간대',
    sleepTimePlaceholder: '예: 밤 11시 - 아침 7시',
    sleepHourOptions: ['5시간 미만', '5-6시간', '6-7시간', '7-8시간', '8시간 이상'],
    sleepQualityOptions: ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'],

    step4Title: '꿈 일기의 목표는 무엇인가요?',
    step4Subtitle: '선택사항 - 무엇을 이루고 싶으신가요?',
    dreamGoals: '꿈 일기 목표',
    dreamGoalsSubtitle: '꿈 해석을 통해 무엇을 얻고 싶으신가요? (모두 선택 가능)',
    dreamGoalOptions: [
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
    ],
    bio: '소개 / 메모',
    bioPlaceholder: '꿈 분석에 도움이 될 수 있는 기타 정보',

    saving: '저장 중...',
    error: '프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
  },
};

export default function UserProfileForm({ user, language, onComplete }: UserProfileFormProps) {
  const t = translations[language];
  const totalSteps = 4;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Required fields
  const [fullName, setFullName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [countryName, setCountryName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ko'>(language);

  // Step 2: Occupation + Interests
  const [occupation, setOccupation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 3: Sleep
  const [avgSleepHours, setAvgSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [sleepTime, setSleepTime] = useState('');

  // Step 4: Dream Goals + Bio
  const [selectedDreamGoals, setSelectedDreamGoals] = useState<string[]>([]);
  const [bio, setBio] = useState('');

  // IP-based geolocation
  const [signupIp, setSignupIp] = useState('');
  const [lastLoginIp, setLastLoginIp] = useState('');

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('/api/get-location');
        const data = await response.json();

        if (data.country) {
          setCountryCode(data.country);
          setCountryName(data.countryName || data.country);
          setTimezone(data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
          setSignupIp(data.ip || '');
          setLastLoginIp(data.ip || '');
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    };

    detectLocation();
  }, []);

  const handleNext = () => {
    setError('');

    // Validate Step 1 (required fields)
    if (currentStep === 1) {
      if (!fullName || !birthYear || !birthMonth || !birthDay) {
        setError(t.fillRequired);
        return;
      }
      if (!countryName || !preferredLanguage) {
        setError(t.fillRequired);
        return;
      }
    }

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

  const handleSkip = () => {
    setError('');
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const birthDate = birthYear + '-' + birthMonth.padStart(2, '0') + '-' + birthDay.padStart(2, '0');
      const age = new Date().getFullYear() - parseInt(birthYear);

      const updateData = {
        user_id: user.id,
        full_name: fullName || null,
        birth_date: birthDate,
        age: age,
        country_code: countryCode,
        country_name: countryName,
        timezone: timezone,
        preferred_language: preferredLanguage,
        occupation: occupation || null,
        interests: selectedInterests.length > 0 ? selectedInterests : null,
        bio: bio || null,
        dream_goals: selectedDreamGoals.length > 0 ? selectedDreamGoals.join(', ') : null,
        sleep_schedule: (avgSleepHours || sleepQuality || sleepTime) ? {
          avg_hours: avgSleepHours,
          quality: sleepQuality,
          sleep_time: sleepTime
        } : null,
        signup_ip: signupIp || null,
        last_login_ip: lastLoginIp || null,
        last_login_at: new Date().toISOString(),
        profile_completed: true,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(updateData, { onConflict: 'user_id' })
        .select();

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
      background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.3), rgba(159, 193, 130, 0.3), rgba(191, 210, 155, 0.3))',
      backdropFilter: 'blur(8px)',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '672px',
        margin: '32px 0',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.15), rgba(159, 193, 130, 0.15))',
          backdropFilter: 'blur(40px)',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
              fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
            }}>{t.title}</h2>
            <p style={{
              color: 'rgba(167, 243, 208, 1)',
              fontSize: '0.875rem',
              fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
              fontWeight: language === 'ko' ? 300 : 400,
            }}>{t.subtitle}</p>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(167, 243, 208, 1)',
                fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                fontWeight: language === 'ko' ? 300 : 400,
              }}>
                {t.step} {currentStep} {t.of} {totalSteps}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: 'rgba(167, 243, 208, 1)',
                fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                fontWeight: language === 'ko' ? 300 : 400,
              }}>
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(to right, rgb(52, 211, 153), rgb(20, 184, 166))',
                transition: 'all 0.3s',
                width: `${(currentStep / totalSteps) * 100}%`,
              }} />
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                }}>{t.step1Title}</h3>
                <p style={{
                  color: 'rgba(167, 243, 208, 1)',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.step1Subtitle}</p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.fullName} *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  }}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label htmlFor="birthYear" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.birthDate} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <input
                    id="birthYear"
                    name="birthYear"
                    type="number"
                    placeholder={t.year}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    autoComplete="bday-year"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                    }}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  <select
                    id="birthMonth"
                    name="birthMonth"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    autoComplete="bday-month"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                    }}
                  >
                    <option value="" style={{ background: '#065f46' }}>{t.month}</option>
                    {t.months.map((monthName, index) => (
                      <option key={index} value={String(index + 1).padStart(2, '0')} style={{ background: '#065f46' }}>
                        {monthName}
                      </option>
                    ))}
                  </select>
                  <input
                    id="birthDay"
                    name="birthDay"
                    type="number"
                    placeholder={t.day}
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    autoComplete="bday-day"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.95rem',
                      outline: 'none',
                      fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                    }}
                    min="1"
                    max="31"
                  />
                </div>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>
                  {t.country} *
                  {countryName && (
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'rgba(110, 231, 183, 1)' }}>
                      ({t.autoDetected})
                    </span>
                  )}
                </label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  autoComplete="country-name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  }}
                />
              </div>

              {/* Language */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.language} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('en')}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: preferredLanguage === 'en' ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                      background: preferredLanguage === 'en' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: preferredLanguage === 'en' ? 'white' : 'rgba(167, 243, 208, 1)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                      fontWeight: language === 'ko' ? 300 : 400,
                    }}
                  >
                    {t.english}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('ko')}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: preferredLanguage === 'ko' ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                      background: preferredLanguage === 'ko' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: preferredLanguage === 'ko' ? 'white' : 'rgba(167, 243, 208, 1)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                      fontWeight: language === 'ko' ? 300 : 400,
                    }}
                  >
                    {t.korean}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                }}>{t.step2Title}</h3>
                <p style={{
                  color: 'rgba(167, 243, 208, 1)',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.step2Subtitle}</p>
              </div>

              <div>
                <label htmlFor="occupation" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.occupation}</label>
                <select
                  id="occupation"
                  name="occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  autoComplete="organization-title"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  }}
                >
                  <option value="" style={{ background: '#065f46' }}>{t.occupationPlaceholder}</option>
                  {t.occupations.map((occ) => (
                    <option key={occ} value={occ} style={{ background: '#065f46' }}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.interests}</label>
                <p style={{
                  color: 'rgba(110, 231, 183, 0.7)',
                  fontSize: '0.75rem',
                  marginBottom: '16px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.interestsSubtitle}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {t.interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        setSelectedInterests(prev =>
                          prev.includes(interest)
                            ? prev.filter(i => i !== interest)
                            : [...prev, interest]
                        );
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: selectedInterests.includes(interest) ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: selectedInterests.includes(interest) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        color: selectedInterests.includes(interest) ? 'white' : 'rgba(167, 243, 208, 1)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                        fontWeight: language === 'ko' ? 300 : 400,
                      }}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                }}>{t.step3Title}</h3>
                <p style={{
                  color: 'rgba(167, 243, 208, 1)',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.step3Subtitle}</p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.avgSleepHours}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {t.sleepHourOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAvgSleepHours(option)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: avgSleepHours === option ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: avgSleepHours === option ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        color: avgSleepHours === option ? 'white' : 'rgba(167, 243, 208, 1)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                        fontWeight: language === 'ko' ? 300 : 400,
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.sleepQuality}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {t.sleepQualityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSleepQuality(option)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: sleepQuality === option ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: sleepQuality === option ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        color: sleepQuality === option ? 'white' : 'rgba(167, 243, 208, 1)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                        fontWeight: language === 'ko' ? 300 : 400,
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="sleepTime" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.sleepTime}</label>
                <input
                  id="sleepTime"
                  name="sleepTime"
                  type="text"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  placeholder={t.sleepTimePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  }}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '8px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                }}>{t.step4Title}</h3>
                <p style={{
                  color: 'rgba(167, 243, 208, 1)',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.step4Subtitle}</p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.dreamGoals}</label>
                <p style={{
                  color: 'rgba(110, 231, 183, 0.7)',
                  fontSize: '0.75rem',
                  marginBottom: '16px',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.dreamGoalsSubtitle}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {t.dreamGoalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        setSelectedDreamGoals(prev =>
                          prev.includes(goal)
                            ? prev.filter(g => g !== goal)
                            : [...prev, goal]
                        );
                      }}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: selectedDreamGoals.includes(goal) ? '2px solid rgba(52, 211, 153, 1)' : '2px solid rgba(255, 255, 255, 0.2)',
                        background: selectedDreamGoals.includes(goal) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                        color: selectedDreamGoals.includes(goal) ? 'white' : 'rgba(167, 243, 208, 1)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                        fontWeight: language === 'ko' ? 300 : 400,
                      }}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="bio" style={{
                  display: 'block',
                  color: 'rgba(167, 243, 208, 1)',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 400,
                }}>{t.bio}</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t.bioPlaceholder}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '12px',
              color: 'rgba(252, 165, 165, 1)',
              fontSize: '0.875rem',
              fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
              fontWeight: language === 'ko' ? 300 : 400,
            }}>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {/* Back Button */}
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: loading ? 0.5 : 1,
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.back}
              </button>
            )}

            {/* Skip Button */}
            {currentStep > 1 && currentStep < totalSteps && (
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(167, 243, 208, 1)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: loading ? 0.5 : 1,
                  fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                  fontWeight: language === 'ko' ? 300 : 500,
                  fontSize: '0.95rem',
                }}
              >
                {t.skip}
              </button>
            )}

            {/* Next/Complete Button */}
            <button
              onClick={handleNext}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
                color: 'white',
                fontWeight: language === 'ko' ? 400 : 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.5 : 1,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: 'none',
                fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
                fontSize: '0.95rem',
              }}
            >
              {loading ? t.saving : currentStep === totalSteps ? t.complete : t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
