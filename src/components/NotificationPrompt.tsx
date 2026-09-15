'use client';

import { useState } from 'react';
import {
  loadReminders,
  saveReminders,
  markAsked,
  requestPermission,
  applyReminders,
} from '../lib/notifications';

/**
 * The in-app ask that comes before the system one.
 *
 * iOS asks for notification permission exactly once. A refusal cannot be
 * retried — the only way back is asking someone to go into Settings, which
 * nobody does. So the reversible question is asked here first, and the
 * irreversible one only reaches people who have already said yes.
 *
 * It appears after a morning has been recorded, never at launch: at launch the
 * person has experienced nothing yet and "can we send you notifications" is a
 * request with nothing behind it. Right after the first pebble, the answer to
 * "shall we remind you tomorrow?" is about something they just did.
 *
 * POST_LAUNCH.md §0-8 has the rest of the design.
 */

const TIMES = [
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 8, minute: 0 },
  { hour: 8, minute: 30 },
  { hour: 9, minute: 0 },
];

function label(hour: number, minute: number, ko: boolean): string {
  const mm = String(minute).padStart(2, '0');
  if (ko) return `${hour}:${mm}`;
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${mm} ${hour < 12 ? 'AM' : 'PM'}`;
}

export default function NotificationPrompt({
  language,
  onClose,
}: {
  language: 'en' | 'ko';
  onClose: () => void;
}) {
  const ko = language === 'ko';
  const [selected, setSelected] = useState(2); /* 7:30 */
  const [working, setWorking] = useState(false);

  const dismiss = () => {
    /* Answered, and the system dialog was never reached — so the reminder can
       still be switched on later from Profile without having spent the one
       permission prompt iOS allows. */
    markAsked();
    onClose();
  };

  const accept = async () => {
    if (working) return;
    setWorking(true);
    const { hour, minute } = TIMES[selected];
    try {
      markAsked();
      const granted = await requestPermission();
      if (granted) {
        /* Written through the same settings the Profile screen edits, so the
           toggle there shows this straight away rather than disagreeing with
           what is actually scheduled. */
        const next = {
          ...loadReminders(),
          morningEnabled: true,
          morningTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        };
        saveReminders(next);
        await applyReminders(next, language);
      }
    } finally {
      setWorking(false);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 22000,
        background: 'rgba(45, 58, 48, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 16,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#FBFCFB',
          borderRadius: 24,
          padding: '28px 24px 20px',
          boxShadow: '0 20px 60px rgba(47, 59, 51, 0.25)',
        }}
      >
        <h3
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 24,
            fontWeight: 400,
            color: '#2F3B33',
            margin: '0 0 8px',
            lineHeight: 1.25,
          }}
        >
          {ko ? '내일 아침에도 알려드릴까요?' : 'Shall we remind you tomorrow?'}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5C7061', margin: '0 0 20px' }}>
          {ko
            ? '하루 한 번, 일어난 시간에 조용히. 언제든 끌 수 있어요.'
            : 'Once a day, around the time you wake. You can turn it off whenever.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {TIMES.map((t, i) => {
            const active = i === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 999,
                  border: active ? '1.5px solid #7AB382' : '1.5px solid rgba(47,59,51,0.12)',
                  background: active ? 'rgba(122,179,130,0.16)' : 'transparent',
                  color: active ? '#3d6044' : '#5C7061',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {label(t.hour, t.minute, ko)}
              </button>
            );
          })}
        </div>

        <button
          onClick={accept}
          disabled={working}
          style={{
            width: '100%',
            padding: 15,
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg, #7AB382 0%, #5C8D63 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: working ? 'default' : 'pointer',
            opacity: working ? 0.6 : 1,
            boxShadow: '0 8px 20px rgba(122,179,130,0.3)',
          }}
        >
          {ko
            ? `네, ${label(TIMES[selected].hour, TIMES[selected].minute, true)}에`
            : `Yes, at ${label(TIMES[selected].hour, TIMES[selected].minute, false)}`}
        </button>

        <button
          onClick={dismiss}
          disabled={working}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: 6,
            background: 'none',
            border: 'none',
            color: '#829689',
            fontSize: 14,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {ko ? '나중에' : 'Not now'}
        </button>
      </div>
    </div>
  );
}
