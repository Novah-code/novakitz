'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface LocationData {
  ip: string;
  country_code: string;
  country_name: string;
  city: string;
  timezone: string;
  isMock?: boolean;
}

interface UserOnboardingProps {
  user: User;
  onComplete: () => void;
}

const translations = {
  en: {
    welcome: 'Welcome to Novakitz!',
    subtitle: 'Let\'s personalize your dream journal experience',
    displayName: 'Display Name',
    namePlaceholder: 'How should we call you?',
    country: 'Country',
    selectCountry: 'Select your country',
    language: 'Preferred Language',
    english: 'English',
    korean: '한국어',
    detectingLocation: 'Detecting your location...',
    continue: 'Continue',
    skip: 'Skip for now'
  },
  ko: {
    welcome: 'Novakitz에 오신 것을 환영합니다!',
    subtitle: '꿈 일기 경험을 개인화해볼까요?',
    displayName: '표시 이름',
    namePlaceholder: '어떻게 불러드릴까요?',
    country: '국가',
    selectCountry: '국가를 선택하세요',
    language: '선호 언어',
    english: 'English',
    korean: '한국어',
    detectingLocation: '위치를 감지하는 중...',
    continue: '계속하기',
    skip: '나중에 하기'
  }
};

// Common countries list
const countries = [
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

export default function UserOnboarding({ user, onComplete }: UserOnboardingProps) {
  const [displayName, setDisplayName] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [countryName, setCountryName] = useState('United States');
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [signupIp, setSignupIp] = useState('');

  const t = translations[language];

  useEffect(() => {
    // Get user's location on mount
    const fetchLocation = async () => {
      try {
        const response = await fetch('/api/get-location');
        const data: LocationData = await response.json();

        setCountryCode(data.country_code);
        setCountryName(data.country_name);
        setCity(data.city);
        setTimezone(data.timezone);
        setSignupIp(data.ip);

        // Auto-detect language based on country
        if (data.country_code === 'KR') {
          setLanguage('ko');
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      } finally {
        setDetectingLocation(false);
      }
    };

    fetchLocation();

    // Set default display name from user email
    if (user.email) {
      const defaultName = user.email.split('@')[0];
      setDisplayName(defaultName);
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create user profile
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: displayName || null,
          country_code: countryCode,
          country_name: countryName,
          city: city || null,
          timezone: timezone,
          preferred_language: language,
          signup_ip: signupIp,
          last_login_ip: signupIp,
          last_login_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Create minimal profile
    supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        country_code: countryCode,
        country_name: countryName,
        timezone: timezone,
        preferred_language: language,
        signup_ip: signupIp,
        last_login_ip: signupIp,
        last_login_at: new Date().toISOString()
      })
      .then(() => onComplete());
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        padding: '48px 40px',
        borderRadius: '24px',
        backdropFilter: 'blur(30px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid rgba(127, 176, 105, 0.3)',
        boxShadow: '0 8px 32px rgba(127, 176, 105, 0.2), 0 2px 8px rgba(0, 0, 0, 0.05)',
        fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: 'var(--matcha-dark)',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {t.welcome}
        </h1>

        <p style={{
          fontSize: '15px',
          color: 'var(--sage)',
          lineHeight: '1.5',
          textAlign: 'center',
          marginBottom: '32px',
          opacity: 0.85
        }}>
          {t.subtitle}
        </p>

        {detectingLocation && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--matcha-green)',
            fontSize: '14px'
          }}>
            {t.detectingLocation}
          </div>
        )}

        {!detectingLocation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Display Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--matcha-dark)',
                marginBottom: '8px'
              }}>
                {t.displayName}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.namePlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(127, 176, 105, 0.2)',
                  fontSize: '15px',
                  fontFamily: "'Roboto', sans-serif",
                  outline: 'none',
                  transition: 'border 0.3s',
                  background: 'rgba(255, 255, 255, 0.8)'
                }}
                onFocus={(e) => e.target.style.border = '2px solid var(--matcha-green)'}
                onBlur={(e) => e.target.style.border = '2px solid rgba(127, 176, 105, 0.2)'}
              />
            </div>

            {/* Country */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--matcha-dark)',
                marginBottom: '8px'
              }}>
                {t.country}
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  const selected = countries.find(c => c.code === e.target.value);
                  setCountryCode(e.target.value);
                  setCountryName(selected?.name || e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid rgba(127, 176, 105, 0.2)',
                  fontSize: '15px',
                  fontFamily: "'Roboto', sans-serif",
                  outline: 'none',
                  background: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer'
                }}
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--matcha-dark)',
                marginBottom: '8px'
              }}>
                {t.language}
              </label>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setLanguage('en')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: language === 'en' ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                    background: language === 'en' ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--matcha-dark)',
                    fontSize: '15px',
                    fontWeight: language === 'en' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontFamily: "'Roboto', sans-serif"
                  }}
                >
                  {t.english}
                </button>
                <button
                  onClick={() => setLanguage('ko')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: language === 'ko' ? 'var(--matcha-green)' : 'rgba(127, 176, 105, 0.2)',
                    background: language === 'ko' ? 'rgba(127, 176, 105, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--matcha-dark)',
                    fontSize: '15px',
                    fontWeight: language === 'ko' ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontFamily: "'Roboto', sans-serif"
                  }}
                >
                  {t.korean}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px'
            }}>
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '2px solid rgba(127, 176, 105, 0.3)',
                  background: 'transparent',
                  color: 'var(--matcha-dark)',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.3s',
                  fontFamily: "'Roboto', sans-serif"
                }}
              >
                {t.skip}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--matcha-green)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.3s',
                  fontFamily: "'Roboto', sans-serif",
                  boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
                }}
              >
                {loading ? '...' : t.continue}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
