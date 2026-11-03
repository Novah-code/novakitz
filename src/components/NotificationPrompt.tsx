'use client';

import { useState } from 'react';
import '../styles/home-scene.css';
import { scrim, skyCard, pillWhite, heading, INK, BASE, LIGHT } from '../lib/skyUi';
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
        ...scrim,
        zIndex: 22000,
        // A window in the middle, like the other small popups (it was a sheet at the bottom).
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ ...skyCard, width: '100%', maxWidth: 380, borderRadius: 32, padding: '30px 24px 20px' }}>
        <div className="home-scene__grain" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ ...heading(ko, 30, 21), margin: '0 0 8px' }}>
            {ko ? '내일 아침에도 알려드릴까요?' : 'Shall we remind you tomorrow?'}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: BASE, margin: '0 0 20px' }}>
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
                    padding: '10px 16px',
                    borderRadius: 999,
                    border: active ? '1.5px solid rgba(46,60,51,0.32)' : '1.5px solid rgba(255,255,255,0.9)',
                    background: active ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.5)',
                    boxShadow: active ? '0 4px 12px rgba(40,60,45,0.12)' : 'none',
                    color: INK,
                    fontSize: 14,
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

          <button onClick={accept} disabled={working} style={{ ...pillWhite, opacity: working ? 0.6 : 1, cursor: working ? 'default' : 'pointer' }}>
            {ko
              ? `네, ${label(TIMES[selected].hour, TIMES[selected].minute, true)}에`
              : `Yes, at ${label(TIMES[selected].hour, TIMES[selected].minute, false)}`}
          </button>

          <button
            onClick={dismiss}
            disabled={working}
            style={{ width: '100%', padding: '12px', marginTop: 6, background: 'none', border: 'none', color: LIGHT, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            {ko ? '나중에' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  );
}
