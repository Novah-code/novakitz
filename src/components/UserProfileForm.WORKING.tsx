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
    occupationPlaceholder: 'e.g., Student, Designer, Developer',
    interests: 'Interests',
    interestsSubtitle: 'Select interests that might help us understand your dreams better (multiple selection allowed)',
    interestOptions: ['Psychology', 'Self-development', 'Meditation', 'Yoga', 'Reading', 'Movies', 'Music', 'Travel', 'Cooking', 'Sports', 'Arts', 'Writing', 'Gaming', 'Technology', 'Nature', 'Animals', 'Fashion', 'Beauty'],

    // Name field (now in Step 1)
    fullName: 'Full Name',
    namePlaceholder: 'Enter your name',

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

    fullName: '이름',
    namePlaceholder: '이름을 입력하세요',

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

  // Step 1: Required fields (Name, Birth Date, Country, Language)
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
      if (!countryCode || !preferredLanguage) {
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
      // Calculate age
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

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-emerald-200">
          {t.step} {currentStep} {t.of} {totalSteps}
        </span>
        <span className="text-sm text-emerald-200">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
          style={{ width: (currentStep / totalSteps) * 100 + '%' }}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.step1Title}</h3>
        <p className="text-emerald-200 text-sm">{t.step1Subtitle}</p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.fullName} *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t.namePlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>

      {/* Birth Date */}
      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.birthDate} *</label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            placeholder={t.year}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            min="1900"
            max={new Date().getFullYear()}
          />
          <select
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 appearance-none cursor-pointer"
          >
            <option value="" className="bg-emerald-900">{t.month}</option>
            {t.months.map((monthName, index) => (
              <option key={index} value={String(index + 1).padStart(2, '0')} className="bg-emerald-900">
                {monthName}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder={t.day}
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            min="1"
            max="31"
          />
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-emerald-100 mb-2 text-sm">
          {t.country} *
          {countryName && (
            <span className="ml-2 text-xs text-emerald-300">({t.autoDetected})</span>
          )}
        </label>
        <input
          type="text"
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>

      {/* Language */}
      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.language} *</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPreferredLanguage('en')}
            className={'px-4 py-3 rounded-xl border transition-all ' + (
              preferredLanguage === 'en'
                ? 'bg-emerald-500/30 border-emerald-400 text-white'
                : 'bg-white/10 border-white/20 text-emerald-200 hover:bg-white/20'
            )}
          >
            {t.english}
          </button>
          <button
            type="button"
            onClick={() => setPreferredLanguage('ko')}
            className={'px-4 py-3 rounded-xl border transition-all ' + (
              preferredLanguage === 'ko'
                ? 'bg-emerald-500/30 border-emerald-400 text-white'
                : 'bg-white/10 border-white/20 text-emerald-200 hover:bg-white/20'
            )}
          >
            {t.korean}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.step2Title}</h3>
        <p className="text-emerald-200 text-sm">{t.step2Subtitle}</p>
      </div>

      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.occupation}</label>
        <select
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 appearance-none cursor-pointer"
        >
          <option value="" className="bg-emerald-900">{t.occupationPlaceholder}</option>
          {t.occupations.map((occ) => (
            <option key={occ} value={occ} className="bg-emerald-900">
              {occ}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-emerald-100 mb-3 text-sm">{t.interests}</label>
        <p className="text-emerald-300/70 text-xs mb-4">{t.interestsSubtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              className={'px-4 py-3 rounded-xl border-2 transition-all text-sm ' + (
                selectedInterests.includes(interest)
                  ? 'bg-emerald-500/30 border-emerald-400 text-white'
                  : 'bg-white/5 border-white/20 text-emerald-200 hover:bg-white/10'
              )}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.step3Title}</h3>
        <p className="text-emerald-200 text-sm">{t.step3Subtitle}</p>
      </div>

      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.avgSleepHours}</label>
        <div className="grid grid-cols-1 gap-2">
          {t.sleepHourOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAvgSleepHours(option)}
              className={'px-4 py-3 rounded-xl border-2 transition-all text-sm ' + (
                avgSleepHours === option
                  ? 'bg-emerald-500/30 border-emerald-400 text-white'
                  : 'bg-white/5 border-white/20 text-emerald-200 hover:bg-white/10'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.sleepQuality}</label>
        <div className="grid grid-cols-1 gap-2">
          {t.sleepQualityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSleepQuality(option)}
              className={'px-4 py-3 rounded-xl border-2 transition-all text-sm ' + (
                sleepQuality === option
                  ? 'bg-emerald-500/30 border-emerald-400 text-white'
                  : 'bg-white/5 border-white/20 text-emerald-200 hover:bg-white/10'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.sleepTime}</label>
        <input
          type="text"
          value={sleepTime}
          onChange={(e) => setSleepTime(e.target.value)}
          placeholder={t.sleepTimePlaceholder}
          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.step4Title}</h3>
        <p className="text-emerald-200 text-sm">{t.step4Subtitle}</p>
      </div>

      <div>
        <label className="block text-emerald-100 mb-3 text-sm">{t.dreamGoals}</label>
        <p className="text-emerald-300/70 text-xs mb-4">{t.dreamGoalsSubtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className={'px-4 py-3 rounded-xl border-2 transition-all text-sm ' + (
                selectedDreamGoals.includes(goal)
                  ? 'bg-emerald-500/30 border-emerald-400 text-white'
                  : 'bg-white/5 border-white/20 text-emerald-200 hover:bg-white/10'
              )}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-emerald-100 mb-2 text-sm">{t.bio}</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t.bioPlaceholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 resize-none"
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-cyan-900/95 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{t.title}</h2>
            <p className="text-emerald-200 text-sm">{t.subtitle}</p>
          </div>

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {/* Back Button (steps 2-7) */}
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.back}
              </button>
            )}

            {/* Skip Button (steps 2-6 only) */}
            {currentStep > 1 && currentStep < totalSteps && (
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.skip}
              </button>
            )}

            {/* Next/Complete Button */}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? t.saving : currentStep === totalSteps ? t.complete : t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
