'use client';

import { useState, useMemo } from 'react';
import { Dream } from '../lib/supabase';
import '../styles/dream-calendar.css';

interface DreamCalendarProps {
  dreams: Dream[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
  /*
   * Mornings where a mood was tapped, keyed by `YYYY-MM-DD`.
   *
   * Without this the month could only ever show days that carried a written
   * dream, because a mood check-in is a row in `checkins` and never becomes a
   * row in `dreams`. Someone who taps a pebble every morning and writes
   * nothing saw an empty calendar and `0 MORNINGS THIS MONTH` — the one
   * screen meant to show that something is accumulating showed nothing
   * accumulating.
   */
  checkins?: Record<string, { emotion?: string | null }>;
}

/* Local calendar date, not UTC — `toISOString` would roll the day over for
   anyone east of Greenwich in the evening. */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

/*
 * The pebble's own outline, carried over from the morning picker.
 *
 * Each mood is a different shape there, not only a different colour, and that
 * shape is the thing someone actually presses. Printing the month as flat
 * colour blocks threw half of it away — a month of squares says less than a
 * month of the shapes you chose.
 *
 * These are the `border-radius` values from `getEmotionPebble` in
 * MoodCardFlow. Two of them were written in pixels for a 110px pebble; at a
 * calendar cell's size that would have rounded almost nothing, so they are
 * converted to the percentages they work out to (15/110 ≈ 14%, 30/110 ≈ 27%).
 * Keep this table and that one in step: the shape someone taps in the morning
 * should be the shape the day turns in the month.
 */
const MOOD_SHAPES: Record<string, string> = {
  peaceful: '50%', calm: '50%', serene: '50%', content: '50%', balanced: '50%',
  joyful: '45% 55% 45% 55% / 65% 55% 45% 35%',
  happy: '45% 55% 45% 55% / 65% 55% 45% 35%',
  excited: '45% 55% 45% 55% / 65% 55% 45% 35%',
  grateful: '45% 55% 45% 55% / 65% 55% 45% 35%',
  hopeful: '50% 50% 50% 50% / 70% 70% 40% 40%',
  curious: '50% 50% 50% 50% / 70% 70% 40% 40%',
  anxious: '40% 60% 30% 70% / 60% 40% 70% 30%',
  stressed: '40% 60% 30% 70% / 60% 40% 70% 30%',
  worried: '40% 60% 30% 70% / 60% 40% 70% 30%',
  nervous: '40% 60% 30% 70% / 60% 40% 70% 30%',
  overwhelmed: '40% 60% 30% 70% / 60% 40% 70% 30%',
  confused: '40% 60% 30% 70% / 60% 40% 70% 30%',
  fear: '50% 50% 60% 60% / 40% 40% 70% 70%',
  fearful: '50% 50% 60% 60% / 40% 40% 70% 70%',
  scared: '50% 50% 60% 60% / 40% 40% 70% 70%',
  lonely: '50% 50% 40% 40% / 40% 40% 60% 60%',
  sad: '50% 50% 40% 40% / 40% 40% 60% 60%',
  melancholic: '50% 50% 40% 40% / 40% 40% 60% 60%',
  anger: '14% 27% 14% 27%',
  angry: '14% 27% 14% 27%',
  low: '15%',
  tired: '15%',
};

/* Anything unrecognised still gets a block — a logged day should never look
   like an empty one just because the mood was typed rather than tapped. */
const MOOD_FALLBACK = '#e8eee6';
const SHAPE_FALLBACK = '42%';

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

export default function DreamCalendar({ dreams, onDateSelect, selectedDate, checkins }: DreamCalendarProps) {
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
    /* The mood tapped that morning, when no dream was written for the day. */
    checkinMood: string | null;
    isToday: boolean;
    isSelected: boolean;
  };

  const cells: Array<Cell | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);

  const todayString = new Date().toDateString();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const date = d.toDateString();
    cells.push({
      day,
      date,
      entries: dreamsByDate[date] || [],
      checkinMood: checkins?.[isoDate(d)]?.emotion ?? null,
      isToday: date === todayString,
      isSelected: date === selectedDate,
    });
  }
  /* Pad to whole weeks so the ruled frame closes flush on the last row. */
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Cell | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  /* A morning counts whether it was written down or only felt. */
  const loggedDays = cells.filter(c => c && (c.entries.length > 0 || c.checkinMood)).length;

  /*
   * One place decides what a day looks like, so the legend and the grid can
   * never disagree about a colour.
   *
   * A written dream wins over the morning's check-in — it is the more
   * specific record of the day, and its mood is what the reading was made
   * from. A day with only a check-in still gets its pebble.
   */
  type Mark = { legendKey: string; fill: string; shape: string } | null;

  const markFor = (cell: Cell): Mark => {
    const first = cell.entries[0];
    if (first) {
      if (isNoDream(first)) return { legendKey: 'rest', fill: REST_COLOR, shape: '50%' };
      const key = moodKey(first.mood);
      return key
        ? { legendKey: key, fill: MOOD_COLORS[key], shape: MOOD_SHAPES[key] }
        : { legendKey: 'logged', fill: MOOD_FALLBACK, shape: SHAPE_FALLBACK };
    }
    if (cell.checkinMood) {
      const key = moodKey(cell.checkinMood);
      return key
        ? { legendKey: key, fill: MOOD_COLORS[key], shape: MOOD_SHAPES[key] }
        : { legendKey: 'logged', fill: MOOD_FALLBACK, shape: SHAPE_FALLBACK };
    }
    return null;
  };

  /*
   * Which colours this month actually used, in the order they first appear.
   * A block of colour on a day means nothing without this, and a fixed legend
   * of all eight would be a colour chart rather than a record of the month.
   */
  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    cells.forEach(cell => {
      if (!cell) return;
      const mark = markFor(cell);
      if (mark && !seen.has(mark.legendKey)) seen.set(mark.legendKey, mark.fill);
    });
    return Array.from(seen.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells]);

  return (
    <div className="dcal">
      <Sparkle className="dcal__spark dcal__spark--a" />

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
              const rest = entries.length > 1;
              const mark = markFor(cell);
              const hasEntry = entries.length > 0;

              /*
               * The mood used to be printed inside the cell. At seven columns
               * on a phone a cell is about thirty usable pixels, and every word
               * longer than five letters broke across two lines mid-word —
               * PEACE / FUL. The colour carries it now and the legend below
               * says what the colours are.
               */
              /* Only a written dream has something to open. A mood-only
                 morning is a mark on the month, not a destination. */
              const Tag = hasEntry ? 'button' : 'div';

              return (
                <Tag
                  key={date}
                  className={`dcal__cell${mark ? ' dcal__cell--filled' : ''}`}
                  style={{
                    /* The selected day is pressed into the sheet rather than
                       outlined, so it reads against any of the eight fills. */
                    boxShadow: isSelected ? 'inset 0 0 0 2px var(--ink)' : undefined,
                  }}
                  {...(hasEntry
                    ? { type: 'button' as const, onClick: () => onDateSelect(date) }
                    : {})}
                >
                  {mark && (
                    <span
                      className="dcal__pebble"
                      style={{ background: mark.fill, borderRadius: mark.shape }}
                      aria-hidden="true"
                    />
                  )}
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
        {/* Anchored to the tally box rather than to the sheet, so it cannot
            land on the box however tall that box turns out to be. */}
        <Sparkle className="dcal__spark dcal__spark--b" />
        <span className="dcal__foot-count">{loggedDays}</span>
        <span className="dcal__foot-label">
          {loggedDays === 1 ? 'morning this month' : 'mornings this month'}
        </span>
      </div>
    </div>
  );
}
