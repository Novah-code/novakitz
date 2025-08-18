'use client';

import { useState, useEffect } from 'react';
import { supabase, UserProfile, UserProfileUpdate } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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

export default function UserProfileForm({ user, profile, onComplete, onCancel }: UserProfileFormProps) {
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
      setError('Please fill in all required fields: date of birth and occupation');
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
    <div className="profile-form-container">
      <div className="profile-form glass-strong">
        <div className="profile-form-header">
          <div className="hero-teacup">👤</div>
          <h2>Profile Setup</h2>
          <p>Tell us about yourself for a more personalized dream interpretation experience</p>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="profile-form-content">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="full_name">Name</label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Your name or nickname"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
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
            </div>

            {error && currentStep === 1 && (
              <div className="error-message">{error}</div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Next
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
              <label htmlFor="bio">About Yourself (Optional)</label>
              <textarea
                id="bio"
                rows={2}
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself or anything else you'd like us to know"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

            <div className="form-actions">
              <button type="button" onClick={handlePrevStep} className="btn-secondary">
                Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}