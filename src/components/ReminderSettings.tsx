'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_REMINDERS,
  ReminderSettings as Settings,
  applyReminders,
  loadReminders,
  remindersSupported,
  requestPermission,
  saveReminders,
} from '../lib/notifications';
import '../styles/reminder-settings.css';

const copy = {
  en: {
    heading: 'Daily reminders',
    morning: 'Morning — record your dream',
    evening: 'Evening — reflect on today',
    webNote: 'Reminders are available in the Novakitz app.',
    denied: 'Notifications are turned off for Novakitz. Enable them in your device settings to use reminders.',
  },
  ko: {
    heading: '데일리 리마인더',
    morning: '아침 — 꿈 기록하기',
    evening: '저녁 — 하루 돌아보기',
    webNote: '리마인더는 Novakitz 앱에서 사용할 수 있습니다.',
    denied: '알림이 꺼져 있습니다. 기기 설정에서 Novakitz 알림을 허용해 주세요.',
  },
};

export default function ReminderSettings({ language = 'en' }: { language?: 'en' | 'ko' }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_REMINDERS);
  const [denied, setDenied] = useState(false);
  const supported = remindersSupported();
  const t = copy[language];

  useEffect(() => {
    setSettings(loadReminders());
  }, []);

  const update = async (next: Settings) => {
    // Only ask for permission when a reminder is actually being switched on.
    const turningOn =
      (next.morningEnabled && !settings.morningEnabled) ||
      (next.eveningEnabled && !settings.eveningEnabled);

    if (turningOn && !(await requestPermission())) {
      setDenied(true);
      return;
    }

    setDenied(false);
    setSettings(next);
    saveReminders(next);
    await applyReminders(next, language);
  };

  return (
    <div className="reminder-settings">
      <h4 className="reminder-heading">{t.heading}</h4>

      {!supported && <p className="reminder-note">{t.webNote}</p>}
      {denied && <p className="reminder-note reminder-note--warn">{t.denied}</p>}

      <div className="reminder-row">
        <label className="reminder-label">
          <input
            type="checkbox"
            checked={settings.morningEnabled}
            disabled={!supported}
            onChange={(e) => update({ ...settings, morningEnabled: e.target.checked })}
          />
          <span>{t.morning}</span>
        </label>
        <input
          type="time"
          className="reminder-time"
          value={settings.morningTime}
          disabled={!supported || !settings.morningEnabled}
          onChange={(e) => update({ ...settings, morningTime: e.target.value })}
        />
      </div>

      <div className="reminder-row">
        <label className="reminder-label">
          <input
            type="checkbox"
            checked={settings.eveningEnabled}
            disabled={!supported}
            onChange={(e) => update({ ...settings, eveningEnabled: e.target.checked })}
          />
          <span>{t.evening}</span>
        </label>
        <input
          type="time"
          className="reminder-time"
          value={settings.eveningTime}
          disabled={!supported || !settings.eveningEnabled}
          onChange={(e) => update({ ...settings, eveningTime: e.target.value })}
        />
      </div>
    </div>
  );
}
