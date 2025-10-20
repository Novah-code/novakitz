'use client';

import { useState, useEffect } from 'react';
import { supabase, UserProfile, UserProfileUpdate } from '../lib/supabase';
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

const INTEREST_OPTIONS = [
  'Psychology', 'Self-development', 'Meditation', 'Yoga', 'Reading', 'Movies',
  'Music', 'Travel', 'Cooking', 'Sports', 'Arts', 'Writing',
  'Gaming', 'Technology', 'Nature', 'Animals', 'Fashion', 'Beauty'
];

const OCCUPATION_OPTIONS = [
  'Student', 'Employee', 'Freelancer', 'Entrepreneur', 'Artist', 'Healthcare',
  'Educator', 'Government', 'Service Industry', 'IT/Development', 'Design', 'Marketing',
  'Finance', 'Legal', 'Construction', 'Other', 'Job Seeking', 'Retired'
];

const DREAM_GOAL_OPTIONS = [
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
];

// Translations
const translations = {
  en: {
    profileSetup: 'Profile Setup',
    subtitle: 'Tell us about yourself for a more personalized dream interpretation experience',
    basicInfo: 'Basic Information',
    name: 'Name',
    namePlaceholder: 'Your name or nickname',
    dateOfBirth: 'Date of Birth',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    occupation: 'Occupation',
    selectOccupation: 'Select your occupation',
    country: 'Country',
    preferredLanguage: 'Preferred Language',
    english: 'English',
    korean: '한국어',
    detectingLocation: 'Detecting your location...',
    next: 'Next',
    back: 'Back',
    interests: 'Interests',
    interestsDescription: 'Select interests that might help us understand your dreams better (multiple selection allowed)',
    sleepPattern: 'Sleep Pattern',
    typicalBedtime: 'Typical Bedtime',
    hour: 'Hour',
    min: 'Min',
    period: 'Period',
    typicalWakeTime: 'Typical Wake Time',
    sleepQuality: 'Sleep Quality',
    poor: 'Poor',
    fair: 'Fair',
    good: 'Good',
    excellent: 'Excellent',
    dreamGoals: 'Dream Goals',
    dreamGoalsDescription: 'What do you hope to gain from dream interpretation? (select all that apply)',
    anythingElse: 'Anything else you\'d like to share? (Optional)',
    additionalNotes: 'Any additional notes or thoughts...',
    saving: 'Saving...',
    completeProfile: 'Complete Profile',
    fillRequired: 'Please fill in all required fields: date of birth and occupation'
  },
  ko: {
    profileSetup: '프로필 설정',
    subtitle: '더 개인화된 꿈 해석 경험을 위해 자신에 대해 알려주세요',
    basicInfo: '기본 정보',
    name: '이름',
    namePlaceholder: '이름 또는 닉네임',
    dateOfBirth: '생년월일',
    year: '년',
    month: '월',
    day: '일',
    occupation: '직업',
    selectOccupation: '직업을 선택하세요',
    country: '국가',
    preferredLanguage: '선호 언어',
    english: 'English',
    korean: '한국어',
    detectingLocation: '위치를 감지하는 중...',
    next: '다음',
    back: '이전',
    interests: '관심사',
    interestsDescription: '꿈을 더 잘 이해하는 데 도움이 될 수 있는 관심사를 선택하세요 (다중 선택 가능)',
    sleepPattern: '수면 패턴',
    typicalBedtime: '평균 취침 시간',
    hour: '시',
    min: '분',
    period: '오전/오후',
    typicalWakeTime: '평균 기상 시간',
    sleepQuality: '수면 질',
    poor: '나쁨',
    fair: '보통',
    good: '좋음',
    excellent: '매우 좋음',
    dreamGoals: '꿈 목표',
    dreamGoalsDescription: '꿈 해석을 통해 무엇을 얻고 싶으신가요? (모두 선택 가능)',
    anythingElse: '추가로 공유하고 싶은 내용이 있나요? (선택)',
    additionalNotes: '추가 메모나 생각...',
    saving: '저장 중...',
    completeProfile: '프로필 완성',
    fillRequired: '필수 항목을 모두 입력해주세요: 생년월일과 직업'
  }
};

// Common countries list
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
  { code: 'MY', name: 'Malaysia' }
];

export default function UserProfileForm({ user, profile, onComplete, onCancel }: UserProfileFormProps) {
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'en');
  const t = translations[preferredLanguage as 'en' | 'ko'];

  const [formData, setFormData] = useState<UserProfileUpdate>({
    user_id: user.id,
    full_name: profile?.full_name || user.user_metadata?.full_name || '',
    birth_date: profile?.birth_date || '',
    age: profile?.age || undefined,
    occupation: profile?.occupation || '',
    interests: profile?.interests || [],
    bio: profile?.bio || '',
    dream_goals: profile?.dream_goals || '',
    sleep_schedule: profile?.sleep_schedule || {
      bedtime: '',
      wake_time: '',
      sleep_quality: 'fair'
    }
  });

  // Location states
  const [countryCode, setCountryCode] = useState(profile?.country_code || 'US');
  const [countryName, setCountryName] = useState(profile?.country_name || 'United States');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [signupIp, setSignupIp] = useState(profile?.signup_ip || '');
  const [detectingLocation, setDetectingLocation] = useState(!profile);

  const [selectedDreamGoals, setSelectedDreamGoals] = useState<string[]>(
    profile?.dream_goals ? profile.dream_goals.split(', ') : []
  );

  // Sleep time states
  const [bedtimeHour, setBedtimeHour] = useState('');
  const [bedtimeMinute, setBedtimeMinute] = useState('');
  const [bedtimeAmPm, setBedtimeAmPm] = useState('PM');
  const [waketimeHour, setWaketimeHour] = useState('');
  const [waketimeMinute, setWaketimeMinute] = useState('');
  const [waketimeAmPm, setWaketimeAmPm] = useState('AM');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch location on mount (only for new profiles)
  useEffect(() => {
    if (!profile && detectingLocation) {
      const fetchLocation = async () => {
        try {
          const response = await fetch('/api/get-location');
          const data: LocationData = await response.json();

          setCountryCode(data.country_code);
          setCountryName(data.country_name);
          setTimezone(data.timezone);
          setSignupIp(data.ip);

          // Auto-detect language based on country
          if (data.country_code === 'KR') {
            setPreferredLanguage('ko');
          }
        } catch (error) {
          console.error('Error fetching location:', error);
        } finally {
          setDetectingLocation(false);
        }
      };

      fetchLocation();
    }
  }, [profile, detectingLocation]);

  const handleInterestToggle = (interest: string) => {
    const currentInterests = formData.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    setFormData(prev => ({ ...prev, interests: newInterests }));
  };

  const handleDreamGoalToggle = (goal: string) => {
    const newGoals = selectedDreamGoals.includes(goal)
      ? selectedDreamGoals.filter(g => g !== goal)
      : [...selectedDreamGoals, goal];
    
    setSelectedDreamGoals(newGoals);
    setFormData(prev => ({ 
      ...prev, 
      dream_goals: newGoals.join(', ') 
    }));
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return undefined;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  // Initialize birth date fields from existing data
  useEffect(() => {
    if (formData.birth_date) {
      const date = new Date(formData.birth_date);
      setBirthYear(date.getFullYear().toString());
      setBirthMonth((date.getMonth() + 1).toString().padStart(2, '0'));
      setBirthDay(date.getDate().toString().padStart(2, '0'));
    }
  }, [formData.birth_date]);

  // Initialize sleep time fields from existing data
  useEffect(() => {
    if (formData.sleep_schedule?.bedtime) {
      const time = parseTimeString(formData.sleep_schedule.bedtime);
      setBedtimeHour(time.hour);
      setBedtimeMinute(time.minute);
      setBedtimeAmPm(time.ampm);
    }
    if (formData.sleep_schedule?.wake_time) {
      const time = parseTimeString(formData.sleep_schedule.wake_time);
      setWaketimeHour(time.hour);
      setWaketimeMinute(time.minute);
      setWaketimeAmPm(time.ampm);
    }
  }, [formData.sleep_schedule]);

  const parseTimeString = (timeStr: string) => {
    if (!timeStr) return { hour: '', minute: '', ampm: 'AM' };
    
    const [time, ampm] = timeStr.split(' ');
    if (!time) return { hour: '', minute: '', ampm: 'AM' };
    
    const [hour, minute] = time.split(':');
    return {
      hour: hour || '',
      minute: minute || '',
      ampm: ampm || 'AM'
    };
  };

  const formatTimeString = (hour: string, minute: string, ampm: string) => {
    if (!hour || !minute) return '';
    return `${hour}:${minute} ${ampm}`;
  };

  const handleBirthDateChange = (year: string, month: string, day: string) => {
    setBirthYear(year);
    setBirthMonth(month);
    setBirthDay(day);

    if (year && month && day) {
      const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const age = calculateAge(birthDate);
      setFormData(prev => ({ 
        ...prev, 
        birth_date: birthDate,
        age: age 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        birth_date: '',
        age: undefined 
      }));
    }
  };

  // Generate year options (current year - 100 to current year - 13)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length: 87}, (_, i) => currentYear - 13 - i);

  // Generate month options
  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate day options based on selected month and year
  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31; // Default to 31 days if no month/year selected
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const dayOptions = Array.from(
    {length: getDaysInMonth(birthYear, birthMonth)}, 
    (_, i) => i + 1
  );

  // Time options
  const hourOptions = Array.from({length: 12}, (_, i) => i + 1);
  const minuteOptions = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));

  const handleBedtimeChange = (hour: string, minute: string, ampm: string) => {
    setBedtimeHour(hour);
    setBedtimeMinute(minute);
    setBedtimeAmPm(ampm);

    const timeString = formatTimeString(hour, minute, ampm);
    setFormData(prev => ({
      ...prev,
      sleep_schedule: {
        ...prev.sleep_schedule,
        bedtime: timeString
      }
    }));
  };

  const handleWaketimeChange = (hour: string, minute: string, ampm: string) => {
    setWaketimeHour(hour);
    setWaketimeMinute(minute);
    setWaketimeAmPm(ampm);

    const timeString = formatTimeString(hour, minute, ampm);
    setFormData(prev => ({
      ...prev,
      sleep_schedule: {
        ...prev.sleep_schedule,
        wake_time: timeString
      }
    }));
  };

  const handleSleepQualityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      sleep_schedule: {
        ...prev.sleep_schedule,
        sleep_quality: value as 'poor' | 'fair' | 'good' | 'excellent'
      }
    }));
  };

  const handleNextStep = () => {
    // 필수 필드 검증
    if (!birthYear || !birthMonth || !birthDay || !formData.occupation) {
      setError(t.fillRequired);
      return;
    }

    setError(''); // 에러 메시지 초기화
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting profile update...');
      console.log('Form data to save:', formData);
      
      const updateData = {
        full_name: formData.full_name,
        birth_date: formData.birth_date || null, // 빈 문자열을 null로 변환
        age: formData.age,
        occupation: formData.occupation,
        interests: formData.interests,
        bio: formData.bio,
        dream_goals: formData.dream_goals,
        sleep_schedule: formData.sleep_schedule,
        // Add location and language data
        country_code: countryCode,
        country_name: countryName,
        timezone: timezone,
        preferred_language: preferredLanguage,
        signup_ip: signupIp || null,
        last_login_ip: signupIp || null,
        last_login_at: new Date().toISOString(),
        profile_completed: true
      };

      console.log('Update data:', updateData);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      console.log('Upsert result:', { data, error });

      if (error) {
        console.error('Supabase error during profile update:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Profile update successful, calling onComplete');
      
      // 완료 콜백 호출
      if (onComplete) {
        console.log('onComplete callback exists, calling it');
        onComplete();
      } else {
        console.warn('onComplete callback not provided');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(`An error occurred while updating your profile: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-form-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      padding: '2rem',
      fontFamily: preferredLanguage === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
    }}>
      <div className="profile-form" style={{
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
          .profile-form::-webkit-scrollbar {
            width: 8px;
          }
          .profile-form::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          .profile-form::-webkit-scrollbar-thumb {
            background: white;
            border-radius: 10px;
          }
          .profile-form::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.9);
          }
        `}</style>
        <div className="profile-form-header" style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
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
            opacity: 0.85
          }}>{t.subtitle}</p>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="profile-form-content">
            {/* Basic Information */}
            <div className="form-section" style={{marginBottom: '24px'}}>
              <h3 style={{fontSize: '18px', fontWeight: '600', color: 'var(--matcha-dark)', marginBottom: '16px', lineHeight: '1.3'}}>{t.basicInfo}</h3>

              <div className="form-group" style={{marginBottom: '16px'}}>
                <label htmlFor="full_name" style={{display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3'}}>{t.name}</label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder={t.namePlaceholder}
                  style={{width: '100%', padding: '10px 14px', borderRadius: '12px', border: '2px solid rgba(127, 176, 105, 0.2)', fontSize: '14px', outline: 'none', background: 'rgba(255, 255, 255, 0.8)'}}
                />
              </div>

              <div className="form-group" style={{marginBottom: '16px'}}>
                <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3'}}>{t.dateOfBirth}</label>
                <div className="birth-date-selectors">
                  <div className="birth-selector">
                    <label htmlFor="birth_year">Year</label>
                    <select
                      id="birth_year"
                      value={birthYear}
                      onChange={(e) => handleBirthDateChange(e.target.value, birthMonth, birthDay)}
                    >
                      <option value="">Year</option>
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="birth-selector">
                    <label htmlFor="birth_month">Month</label>
                    <select
                      id="birth_month"
                      value={birthMonth}
                      onChange={(e) => handleBirthDateChange(birthYear, e.target.value, birthDay)}
                    >
                      <option value="">Month</option>
                      {monthOptions.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="birth-selector">
                    <label htmlFor="birth_day">Day</label>
                    <select
                      id="birth_day"
                      value={birthDay}
                      onChange={(e) => handleBirthDateChange(birthYear, birthMonth, e.target.value)}
                    >
                      <option value="">Day</option>
                      {dayOptions.map(day => (
                        <option key={day} value={day.toString().padStart(2, '0')}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="occupation">Occupation</label>
                <select
                  id="occupation"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                >
                  <option value="">Select your occupation</option>
                  {OCCUPATION_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Location & Language */}
              {detectingLocation && (
                <div style={{ textAlign: 'center', padding: '10px', color: 'var(--matcha-green)', fontSize: '14px', lineHeight: '1.3' }}>
                  {t.detectingLocation}
                </div>
              )}

              {!detectingLocation && (
                <>
                  <div className="form-group" style={{marginBottom: '16px'}}>
                    <label htmlFor="country" style={{display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3'}}>{t.country}</label>
                    <select
                      id="country"
                      value={countryCode}
                      onChange={(e) => {
                        const selected = COUNTRIES.find(c => c.code === e.target.value);
                        setCountryCode(e.target.value);
                        setCountryName(selected?.name || e.target.value);
                      }}
                    >
                      {COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{marginBottom: '16px'}}>
                    <label style={{display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--matcha-dark)', marginBottom: '6px', lineHeight: '1.3'}}>{t.preferredLanguage}</label>
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
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      >
                        {t.english}
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
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      >
                        {t.korean}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {error && currentStep === 1 && (
              <div className="error-message" style={{padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '14px', lineHeight: '1.4', marginBottom: '16px'}}>{error}</div>
            )}

            <div className="form-actions" style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              <button type="submit" style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--matcha-green)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
              }}>
                {t.next}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form-content">

          {/* Interests */}
          <div className="form-section">
            <h3>Interests</h3>
            <p className="form-description">Select interests that might help us understand your dreams better (multiple selection allowed)</p>
            
            <div className="interests-grid">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  className={`interest-tag ${(formData.interests || []).includes(interest) ? 'selected' : ''}`}
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Pattern */}
          <div className="form-section">
            <h3>Sleep Pattern</h3>
            
            <div className="form-group">
              <label>Typical Bedtime</label>
              <div className="time-selectors">
                <div className="time-selector">
                  <label htmlFor="bedtime_hour">Hour</label>
                  <select
                    id="bedtime_hour"
                    value={bedtimeHour}
                    onChange={(e) => handleBedtimeChange(e.target.value, bedtimeMinute, bedtimeAmPm)}
                  >
                    <option value="">Hour</option>
                    {hourOptions.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>

                <div className="time-selector">
                  <label htmlFor="bedtime_minute">Min</label>
                  <select
                    id="bedtime_minute"
                    value={bedtimeMinute}
                    onChange={(e) => handleBedtimeChange(bedtimeHour, e.target.value, bedtimeAmPm)}
                  >
                    <option value="">Min</option>
                    {minuteOptions.map(minute => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                </div>

                <div className="time-selector">
                  <label htmlFor="bedtime_ampm">Period</label>
                  <select
                    id="bedtime_ampm"
                    value={bedtimeAmPm}
                    onChange={(e) => handleBedtimeChange(bedtimeHour, bedtimeMinute, e.target.value)}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Typical Wake Time</label>
              <div className="time-selectors">
                <div className="time-selector">
                  <label htmlFor="waketime_hour">Hour</label>
                  <select
                    id="waketime_hour"
                    value={waketimeHour}
                    onChange={(e) => handleWaketimeChange(e.target.value, waketimeMinute, waketimeAmPm)}
                  >
                    <option value="">Hour</option>
                    {hourOptions.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </div>

                <div className="time-selector">
                  <label htmlFor="waketime_minute">Min</label>
                  <select
                    id="waketime_minute"
                    value={waketimeMinute}
                    onChange={(e) => handleWaketimeChange(waketimeHour, e.target.value, waketimeAmPm)}
                  >
                    <option value="">Min</option>
                    {minuteOptions.map(minute => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                </div>

                <div className="time-selector">
                  <label htmlFor="waketime_ampm">Period</label>
                  <select
                    id="waketime_ampm"
                    value={waketimeAmPm}
                    onChange={(e) => handleWaketimeChange(waketimeHour, waketimeMinute, e.target.value)}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sleep_quality">Sleep Quality</label>
              <select
                id="sleep_quality"
                value={formData.sleep_schedule?.sleep_quality || 'fair'}
                onChange={(e) => handleSleepQualityChange(e.target.value)}
              >
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>
          </div>

          {/* Dream Goals */}
          <div className="form-section">
            <h3>Dream Goals</h3>
            <p className="form-description">What do you hope to gain from dream interpretation? (select all that apply)</p>
            
            <div className="dream-goals-grid">
              {DREAM_GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  className={`dream-goal-tag ${selectedDreamGoals.includes(goal) ? 'selected' : ''}`}
                  onClick={() => handleDreamGoalToggle(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="bio">Anything else you'd like to share? (Optional)</label>
              <textarea
                id="bio"
                rows={2}
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Any additional notes or thoughts..."
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

            <div className="form-actions" style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              <button type="button" onClick={handlePrevStep} style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid rgba(127, 176, 105, 0.3)',
                background: 'transparent',
                color: 'var(--matcha-dark)',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
                {t.back}
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: loading ? '#9ca3af' : 'var(--matcha-green)',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
              }}>
                {loading ? t.saving : t.completeProfile}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}