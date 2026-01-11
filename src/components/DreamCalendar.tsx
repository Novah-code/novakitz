'use client';

import { useState, useMemo } from 'react';
import { Dream } from '../lib/supabase';

interface DreamCalendarProps {
  dreams: Dream[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const moodEmojis = {
  peaceful: '',
  excited: '😃',
  confused: '😵',
  scared: '',
  happy: '',
  sad: '',
  mysterious: '🤔',
  surreal: ''
};

export default function DreamCalendar({ dreams, onDateSelect, selectedDate }: DreamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month/year info
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Group dreams by date
  const dreamsByDate = useMemo(() => {
    const grouped: { [key: string]: Dream[] } = {};
    dreams.forEach(dream => {
      // Use the 'date' field if available (formatted date string from SimpleDreamInterface)
      // Otherwise fall back to created_at
      let dreamDate: string;
      if (dream.date && typeof dream.date === 'string') {
        // Convert formatted date like "November 19, 2025" to Date object for toDateString()
        const parsedDate = new Date(dream.date);
        dreamDate = parsedDate.toDateString();
      } else if (dream.created_at) {
        dreamDate = new Date(dream.created_at).toDateString();
      } else {
        dreamDate = new Date().toDateString();
      }

      if (!grouped[dreamDate]) {
        grouped[dreamDate] = [];
      }
      grouped[dreamDate].push(dream);
    });
    return grouped;
  }, [dreams]);

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toDateString();
    const dayDreams = dreamsByDate[dateString] || [];
    
    calendarDays.push({
      day,
      date: dateString,
      dreams: dayDreams,
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: dateString === selectedDate
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="dream-calendar glass">
      {/* Calendar Header */}
      <div className="calendar-header">
        <button
          onClick={goToPreviousMonth}
          className="calendar-nav-btn"
          title="Previous month"
        >
          ←
        </button>

        <div className="calendar-title-header">
          <h3>{monthNames[currentMonth]} {currentYear}</h3>
          <button onClick={goToToday} className="today-btn">
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="calendar-nav-btn"
          title="Next month"
        >
          →
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarDays.map((dayData, index) => {
          if (!dayData) {
            return <div key={index} className="calendar-day empty"></div>;
          }

          const { day, date, dreams, isToday, isSelected } = dayData;
          const hasDreams = dreams.length > 0;

          return (
            <div
              key={date}
              className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasDreams ? 'has-dreams' : ''}`}
              onClick={() => onDateSelect(date)}
              style={{
                position: 'relative',
                cursor: hasDreams ? 'pointer' : 'default'
              }}
            >
              <div className="day-number">{day}</div>
              {hasDreams && (
                <div className="dream-badges" style={{display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', paddingTop: '4px'}}>
                  {dreams.slice(0, 2).map((dream, idx) => {
                    // Check if this is a "no dream" marker
                    const isNoDream = dream.tags?.includes('꿈안꿈') || dream.tags?.includes('no-dream') || dream.title?.includes('꿈 안 꿈') || dream.title?.includes('No Dream');
                    const dreamTitle = dream.title || 'Untitled Dream';
                    return (
                      <button
                        key={dream.id || idx}
                        className="dream-badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect(date);
                        }}
                        title={dreamTitle}
                        style={{
                          fontSize: '0.65rem',
                          padding: '3px 6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          backgroundColor: isNoDream ? 'rgba(100, 100, 100, 0.6)' : 'rgba(127, 176, 105, 0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: '500',
                          maxWidth: '100%'
                        }}
                      >
                        {dreamTitle}
                      </button>
                    );
                  })}
                  {dreams.length > 2 && (
                    <div className="more-dreams" style={{fontSize: '0.6rem', padding: '2px 4px', color: '#7FB069', textAlign: 'center'}}>
                      +{dreams.length - 2}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-indicator today-indicator"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}