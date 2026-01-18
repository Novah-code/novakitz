'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../../styles/unsubscribe.css';

export default function UnsubscribePage() {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState({
    email_daily_affirmations: true,
    email_weekly_reports: true,
    email_retention_nudges: true
  });

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as 'en' | 'ko' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Load current preferences if user is logged in
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('email_daily_affirmations, email_weekly_reports, email_retention_nudges')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError(language === 'ko' ? '로그인이 필요합니다.' : 'Please log in first.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(language === 'ko' ? '설정 저장에 실패했습니다.' : 'Failed to save preferences.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    en: {
      title: 'Email Preferences',
      subtitle: 'Choose which emails you'd like to receive',
      dailyAffirmations: 'Daily Affirmations',
      dailyAffirmationsDesc: 'Personalized affirmations based on your archetype every morning',
      weeklyReports: 'Weekly Dream Reports',
      weeklyReportsDesc: 'Insights and patterns from your dream journal every Monday',
      retentionNudges: 'Gentle Reminders',
      retentionNudgesDesc: 'Occasional check-ins if you haven\'t journaled in a while',
      saveButton: 'Save Preferences',
      saving: 'Saving...',
      successMessage: 'Preferences saved successfully! Redirecting...',
      unsubscribeAll: 'Unsubscribe from all emails',
      backToApp: 'Back to NovaKitz'
    },
    ko: {
      title: '이메일 설정',
      subtitle: '받고 싶은 이메일을 선택하세요',
      dailyAffirmations: '일일 확언',
      dailyAffirmationsDesc: '매일 아침 아키타입 기반 맞춤 확언 메시지',
      weeklyReports: '주간 꿈 리포트',
      weeklyReportsDesc: '매주 월요일 꿈 일기 인사이트 및 패턴 분석',
      retentionNudges: '부드러운 알림',
      retentionNudgesDesc: '일정 기간 기록하지 않으면 보내는 체크인 메시지',
      saveButton: '설정 저장',
      saving: '저장 중...',
      successMessage: '설정이 저장되었습니다! 리다이렉팅 중...',
      unsubscribeAll: '모든 이메일 수신 거부',
      backToApp: 'NovaKitz로 돌아가기'
    }
  };

  const t = translations[language];

  const handleUnsubscribeAll = async () => {
    if (confirm(language === 'ko' ? '정말 모든 이메일 수신을 거부하시겠습니까?' : 'Are you sure you want to unsubscribe from all emails?')) {
      setPreferences({
        email_daily_affirmations: false,
        email_weekly_reports: false,
        email_retention_nudges: false
      });
      // Auto-save after unsubscribing all
      setTimeout(() => handleSave(), 100);
    }
  };

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-container">
        <button
          onClick={() => window.location.href = '/'}
          className="back-link"
        >
          ← {t.backToApp}
        </button>

        <h1>{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>

        {success && (
          <div className="success-message">
            {t.successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="preferences-list">
          <label className="preference-item">
            <div className="preference-info">
              <input
                type="checkbox"
                checked={preferences.email_daily_affirmations}
                onChange={(e) => setPreferences({ ...preferences, email_daily_affirmations: e.target.checked })}
              />
              <div>
                <h3>{t.dailyAffirmations}</h3>
                <p>{t.dailyAffirmationsDesc}</p>
              </div>
            </div>
          </label>

          <label className="preference-item">
            <div className="preference-info">
              <input
                type="checkbox"
                checked={preferences.email_weekly_reports}
                onChange={(e) => setPreferences({ ...preferences, email_weekly_reports: e.target.checked })}
              />
              <div>
                <h3>{t.weeklyReports}</h3>
                <p>{t.weeklyReportsDesc}</p>
              </div>
            </div>
          </label>

          <label className="preference-item">
            <div className="preference-info">
              <input
                type="checkbox"
                checked={preferences.email_retention_nudges}
                onChange={(e) => setPreferences({ ...preferences, email_retention_nudges: e.target.checked })}
              />
              <div>
                <h3>{t.retentionNudges}</h3>
                <p>{t.retentionNudgesDesc}</p>
              </div>
            </div>
          </label>
        </div>

        <button
          className="save-button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? t.saving : t.saveButton}
        </button>

        <button
          className="unsubscribe-all-button"
          onClick={handleUnsubscribeAll}
          disabled={loading}
        >
          {t.unsubscribeAll}
        </button>
      </div>
    </div>
  );
}
