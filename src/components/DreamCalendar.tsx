'use client';

import { useState, useMemo } from 'react';
import { Dream } from '../lib/supabase';
import '../styles/dream-calendar.css';

interface DreamCalendarProps {
  dreams: Dream[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

/*
 * The eight check-in blobs, at full strength.
 *
 * DailyCheckin draws them at 0.7 alpha over white; here they fill a cell on
 * cream, so the alpha is baked out to the equivalent flat colour. Keeping the
 * two in sync matters more than either value on its own — the colour someone
 * taps in the morning should be the colour that day turns in the month.
 */
const MOOD_COLORS: Record<string, string> = {
  peaceful: '#c9e5cc',
  calm: '#c9e5cc',
  serene: '#c9e5cc',
  content: '#c9e5cc',
  balanced: '#c9e5cc',
  joyful: '#feefcc',
  happy: '#feefcc',
  excited: '#feefcc',
  grateful: '#feefcc',
  hopeful: '#e2f5dd',
  curious: '#e2f5dd',
  anxious: '#e4dfef',
  stressed: '#e4dfef',
  worried: '#e4dfef',
  nervous: '#e4dfef',
  overwhelmed: '#e4dfef',
  confused: '#e4dfef',
  fear: '#dbe9ee',
  fearful: '#dbe9ee',
  scared: '#dbe9ee',
  lonely: '#e2e7ed',
  sad: '#e2e7ed',
  /* `deriveMoodFromTags` in SimpleDreamInterface writes this one, and it is
     the value most dreams actually carry after a sad-leaning tag. */
  melancholic: '#e2e7ed',
  anger: '#fbdfd5',
  angry: '#fbdfd5',
  low: '#e9edf3',
  tired: '#e9edf3',
};

const MOOD_KO: Record<string, string> = {
  평온: 'peaceful', 기쁨: 'joyful', 행복: 'happy', 희망: 'hopeful',
  불안: 'anxious', 두려움: 'fear', 외로움: 'lonely', 분노: 'anger',
  무기력: 'low', 슬픔: 'sad', 설렘: 'excited', 호기심: 'curious',
  평화: 'peaceful', 화남: 'angry', 혼란: 'confused',
};

/* Anything unrecognised still gets a block — a logged day should never look
   like an empty one just because the mood was typed rather than tapped. */
const MOOD_FALLBACK = '#e8eee6';

/* A morning that was kept without a dream to write down. */
const REST_COLOR = '#eceae4';

function moodKey(mood?: string | null): string | null {
  if (!mood) return null;
  const raw = mood.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  return MOOD_KO[raw] ?? (MOOD_COLORS[lower] ? lower : null);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isNoDream(d: Dream) {
  return Boolean(
    d.tags?.includes('꿈안꿈') || d.tags?.includes('no-dream') ||
    d.title?.includes('꿈 안 꿈') || d.title?.includes('No Dream')
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0c.9 6.4 4.7 10.2 11.1 11.1v1.8C16.7 13.8 12.9 17.6 12 24c-.9-6.4-4.7-10.2-11.1-11.1v-1.8C7.3 10.2 11.1 6.4 12 0z" />
    </svg>
  );
}

export default function DreamCalendar({ dreams, onDateSelect, selectedDate }: DreamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dreamsByDate = useMemo(() => {
    const grouped: Record<string, Dream[]> = {};
    dreams.forEach(dream => {
      const source = dream.date || dream.created_at;
      const key = source ? new Date(source).toDateString() : new Date().toDateString();
      (grouped[key] ||= []).push(dream);
    });
    return grouped;
  }, [dreams]);

  type Cell = {
    day: number;
    date: string;
    entries: Dream[];
    isToday: boolean;
    isSelected: boolean;
  };

  const cells: Array<Cell | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);

  const todayString = new Date().toDateString();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day).toDateString();
    cells.push({
      day,
      date,
      entries: dreamsByDate[date] || [],
      isToday: date === todayString,
      isSelected: date === selectedDate,
    });
  }
  /* Pad to whole weeks so the ruled frame closes flush on the last row. */
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Cell | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const loggedDays = cells.filter(c => c && c.entries.length > 0).length;

  /*
   * Which colours this month actually used, in the order they first appear.
   * A block of colour on a day means nothing without this, and a fixed legend
   * of all eight would be a colour chart rather than a record of the month.
   */
  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    cells.forEach(cell => {
      if (!cell || cell.entries.length === 0) return;
      const first = cell.entries[0];
      if (isNoDream(first)) {
        if (!seen.has('rest')) seen.set('rest', REST_COLOR);
        return;
      }
      const key = moodKey(first.mood);
      if (key) {
        if (!seen.has(key)) seen.set(key, MOOD_COLORS[key]);
      } else if (!seen.has('logged')) {
        seen.set('logged', MOOD_FALLBACK);
      }
    });
    return Array.from(seen.entries());
  }, [cells]);

  return (
    <div className="dcal">
      <Sparkle className="dcal__spark dcal__spark--a" />
      <Sparkle className="dcal__spark dcal__spark--b" />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="dcal__month">{MONTHS[month]}</h3>
          <div className="dcal__year">{year}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="dcal__nav"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              aria-label="Previous month"
            >
              <Chevron dir="left" />
            </button>
            <button
              className="dcal__nav"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              aria-label="Next month"
            >
              <Chevron dir="right" />
            </button>
          </div>
          <button className="dcal__today-btn" onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
        </div>
      </div>

      <div className="dcal__grid">
        <div className="dcal__week">
          {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
        </div>

        {weeks.map((week, wi) => (
          <div className="dcal__row" key={wi}>
            {week.map((cell, ci) => {
              if (!cell) return <div className="dcal__cell" key={`${wi}-${ci}`} />;

              const { day, date, entries, isToday, isSelected } = cell;
              const first = entries[0];
              const rest = entries.length > 1;
              const skipped = first ? isNoDream(first) : false;

              const key = first && !skipped ? moodKey(first.mood) : null;
              const fill = entries.length === 0
                ? undefined
                : skipped
                ? REST_COLOR
                : key
                ? MOOD_COLORS[key]
                : MOOD_FALLBACK;

              /*
               * The mood used to be printed inside the cell. At seven columns
               * on a phone a cell is about thirty usable pixels, and every word
               * longer than five letters broke across two lines mid-word —
               * PEACE / FUL. The colour carries it now and the legend below
               * says what the colours are.
               */
              const Tag = entries.length > 0 ? 'button' : 'div';

              return (
                <Tag
                  key={date}
                  className={`dcal__cell${entries.length > 0 ? ' dcal__cell--filled' : ''}`}
                  style={{
                    background: fill,
                    /* The selected day is pressed into the sheet rather than
                       outlined, so it reads against any of the eight fills. */
                    boxShadow: isSelected ? 'inset 0 0 0 2px var(--ink)' : undefined,
                  }}
                  {...(entries.length > 0
                    ? { type: 'button' as const, onClick: () => onDateSelect(date) }
                    : {})}
                >
                  <span className={`dcal__num${isToday ? ' dcal__num--today' : ci === 0 ? ' dcal__num--sun' : ''}`}>
                    {day}
                  </span>
                  {rest && <span className="dcal__more">+{entries.length - 1}</span>}
                </Tag>
              );
            })}
          </div>
        ))}
      </div>

      {legend.length > 0 && (
        <div className="dcal__legend">
          {legend.map(([name, color]) => (
            <span className="dcal__legend-item" key={name}>
              <span className="dcal__swatch" style={{ background: color }} />
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="dcal__foot">
        <span className="dcal__foot-count">{loggedDays}</span>
        <span className="dcal__foot-label">
          {loggedDays === 1 ? 'morning this month' : 'mornings this month'}
        </span>
      </div>
    </div>
  );
}
