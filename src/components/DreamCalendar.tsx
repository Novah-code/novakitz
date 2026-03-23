'use client';

import { useState, useMemo } from 'react';
import { Dream } from '../lib/supabase';

interface DreamCalendarProps {
  dreams: Dream[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const C = {
  green: '#7ea886',
  greenDark: '#6b9172',
  greenDeep: '#5c8065',
  greenDeeper: '#4a6b52',
  greenText: '#4a7253',
  greenBold: '#3d6044',
  chipBg: '#dbece0',
  chipBorder: '#c6dfce',
  navBg: '#f0f5f2',
  navHover: '#e2ebe5',
  todayBg: '#ecf4ee',
  badgeBg: '#b8d6c0',
  cellBg: '#fbfcfb',
  cellBorder: '#e8efe9',
  cellBorderHover: '#c6dfce',
  weekMuted: '#8ca693',
  sun: '#d67b7b',
  noDreamBg: '#e0e0e0',
  noDreamText: '#757575',
  noDreamBorder: '#d5d5d5',
};

function ChevronLeft() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function DreamCalendar({ dreams, onDateSelect, selectedDate }: DreamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const dreamsByDate = useMemo(() => {
    const grouped: { [key: string]: Dream[] } = {};
    dreams.forEach(dream => {
      let dreamDate: string;
      if (dream.date && typeof dream.date === 'string') {
        dreamDate = new Date(dream.date).toDateString();
      } else if (dream.created_at) {
        dreamDate = new Date(dream.created_at).toDateString();
      } else {
        dreamDate = new Date().toDateString();
      }
      if (!grouped[dreamDate]) grouped[dreamDate] = [];
      grouped[dreamDate].push(dream);
    });
    return grouped;
  }, [dreams]);

  const calendarDays: Array<null | { day: number; date: string; dreams: Dream[]; isToday: boolean; isSelected: boolean }> = [];

  for (let i = 0; i < firstDayWeekday; i++) calendarDays.push(null);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toDateString();
    calendarDays.push({
      day,
      date: dateString,
      dreams: dreamsByDate[dateString] || [],
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: dateString === selectedDate,
    });
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const renderChips = (dayDreams: Dream[], date: string) => {
    if (dayDreams.length === 0) return null;

    const isNoDream = (d: Dream) =>
      d.tags?.includes('꿈안꿈') || d.tags?.includes('no-dream') ||
      d.title?.includes('꿈 안 꿈') || d.title?.includes('No Dream');

    if (isNoDream(dayDreams[0])) {
      return (
        <div style={{
          marginTop: 4, width: '100%', padding: '2px 6px',
          background: C.noDreamBg, color: C.noDreamText,
          fontSize: 10, borderRadius: 6, border: `1px solid ${C.noDreamBorder}`,
          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          No Dream
        </div>
      );
    }

    const visible = dayDreams.slice(0, 2);
    const extra = dayDreams.length - 2;

    return (
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
        {visible.map((dream, idx) => (
          <button
            key={dream.id || idx}
            onClick={(e) => { e.stopPropagation(); onDateSelect(date); }}
            style={{
              width: '100%', padding: '2px 6px',
              background: C.chipBg, color: C.greenText,
              fontSize: 10, borderRadius: 6, border: `1px solid ${C.chipBorder}`,
              fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            title={dream.title || 'Dream Entry'}
          >
            {dream.title || 'Dream Entry'}
          </button>
        ))}
        {extra > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
            <span style={{
              padding: '2px 6px', borderRadius: 99,
              background: C.badgeBg, color: C.greenBold,
              fontSize: 9, fontWeight: 700,
            }}>
              +{extra}
            </span>
          </div>
        )}
      </div>
    );
  };

  const navBtnStyle: React.CSSProperties = {
    padding: 8, borderRadius: '50%', background: C.navBg,
    color: C.greenDark, border: `1px solid ${C.chipBorder}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', color: '#334139' }}>

      {/* Month Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={goToPreviousMonth}
          style={navBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = C.navHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.navBg; }}
        >
          <ChevronLeft />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.greenDeeper }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToToday}
            style={{
              padding: '2px 12px', fontSize: 12, fontWeight: 500,
              color: C.greenDark, border: `1px solid ${C.badgeBg}`,
              borderRadius: 99, background: 'transparent', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.navBg; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          style={navBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = C.navHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.navBg; }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ width: '100%' }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {weekDays.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 600,
              color: i === 0 ? C.sun : C.weekMuted,
              padding: '4px 0',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {calendarDays.map((dayData, index) => {
            if (!dayData) {
              return <div key={index} style={{ minHeight: 80 }} />;
            }

            const { day, date, dreams: dayDreams, isToday, isSelected } = dayData;
            const colIndex = index % 7;
            const isSunday = colIndex === 0;

            return (
              <div
                key={date}
                onClick={() => onDateSelect(date)}
                style={{
                  minHeight: 80, padding: '6px 4px',
                  borderRadius: 12,
                  border: isToday
                    ? `1.5px solid ${C.green}`
                    : isSelected
                    ? `1.5px solid ${C.greenDark}`
                    : `1px solid ${C.cellBorder}`,
                  background: isToday ? C.todayBg : isSelected ? '#f0f5f2' : C.cellBg,
                  boxShadow: isToday ? `0 0 0 1px ${C.green}` : 'none',
                  cursor: dayDreams.length > 0 ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!isToday && !isSelected) e.currentTarget.style.borderColor = C.cellBorderHover;
                  if (dayDreams.length > 0) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isToday && !isSelected) e.currentTarget.style.borderColor = C.cellBorder;
                  if (!isToday) e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 600,
                  color: isToday ? C.greenBold : isSunday ? C.sun : C.greenDeep,
                }}>
                  {day}
                </span>
                <div style={{ width: '100%', flexGrow: 1 }}>
                  {renderChips(dayDreams, date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 13, color: C.weekMuted }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${C.green}`, background: C.todayBg }} />
        <span style={{ fontWeight: 500 }}>Today</span>
      </div>
    </div>
  );
}
