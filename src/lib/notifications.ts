'use client';

import { Capacitor } from '@capacitor/core';

/**
 * Daily ritual reminders, scheduled on-device.
 *
 * Local rather than remote push on purpose: the reminder is "at 8am their
 * time", which the OS can do without a server, an APNs certificate, or the app
 * being reachable. Remote push is only worth adding for things the server
 * initiates, like a monthly report finishing.
 *
 * Times are stored per-device rather than in user_profiles, because the
 * schedule belongs to the device holding it — someone with a phone and a tablet
 * does not necessarily want both buzzing.
 */

const STORAGE_KEY = 'novakitz.reminders';

// Stable ids so rescheduling replaces rather than stacks duplicates.
const MORNING_ID = 1;
const EVENING_ID = 2;

export interface ReminderSettings {
  morningEnabled: boolean;
  /** 24-hour local time, "HH:MM". */
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  morningEnabled: false,
  morningTime: '08:00',
  eveningEnabled: false,
  eveningTime: '22:00',
};

const copy = {
  en: {
    morningTitle: 'Good morning',
    morningBody: 'What did you dream about last night?',
    eveningTitle: 'Winding down',
    eveningBody: 'Take a moment to reflect on today.',
  },
  ko: {
    morningTitle: '좋은 아침이에요',
    morningBody: '어젯밤 어떤 꿈을 꾸셨나요?',
    eveningTitle: '하루를 마무리하며',
    eveningBody: '오늘 하루를 잠시 돌아볼까요?',
  },
};

export function remindersSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export function loadReminders(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_REMINDERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_REMINDERS, ...JSON.parse(raw) } : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export function saveReminders(settings: ReminderSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preference is not worth failing the toggle over.
  }
}

function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Returns false when the user declined, so callers can explain rather than fail silently. */
export async function requestPermission(): Promise<boolean> {
  if (!remindersSupported()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('[Notifications] permission check failed:', error);
    return false;
  }
}

/**
 * Replace the scheduled reminders with whatever `settings` describes.
 * Always clears first, so turning a reminder off actually removes it.
 */
export async function applyReminders(
  settings: ReminderSettings,
  language: 'en' | 'ko' = 'en'
): Promise<boolean> {
  if (!remindersSupported()) return false;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const t = copy[language];

    await LocalNotifications.cancel({
      notifications: [{ id: MORNING_ID }, { id: EVENING_ID }],
    });

    const scheduled = [];

    if (settings.morningEnabled) {
      const at = parseTime(settings.morningTime);
      if (at) {
        scheduled.push({
          id: MORNING_ID,
          title: t.morningTitle,
          body: t.morningBody,
          // `on` without a day repeats daily at this local time.
          schedule: { on: { hour: at.hour, minute: at.minute }, allowWhileIdle: true },
        });
      }
    }

    if (settings.eveningEnabled) {
      const at = parseTime(settings.eveningTime);
      if (at) {
        scheduled.push({
          id: EVENING_ID,
          title: t.eveningTitle,
          body: t.eveningBody,
          schedule: { on: { hour: at.hour, minute: at.minute }, allowWhileIdle: true },
        });
      }
    }

    if (scheduled.length > 0) {
      await LocalNotifications.schedule({ notifications: scheduled });
    }
    return true;
  } catch (error) {
    console.error('[Notifications] scheduling failed:', error);
    return false;
  }
}
