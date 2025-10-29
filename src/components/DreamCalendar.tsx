'use client';

import { useState, useMemo } from 'react';
import { Dream } from '../lib/supabase';

interface DreamCalendarProps {
  dreams: Dream[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

const moodEmojis = {
  peaceful: '😌',
  excited: '😃',
  confused: '😵',
  scared: '😰',
  happy: '😊',
  sad: '😢',
  mysterious: '🤔',
  surreal: '🌀'
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
      const dreamDate = dream.created_at 
        ? new Date(dream.created_at).toDateString()
        : new Date().toDateString();
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
            >
              <div className="day-number">{day}</div>
              {hasDreams && (
                <div className="dream-indicators">
                  {dreams.slice(0, 3).map((dream, idx) => (
                    <span 
                      key={dream.id || idx} 
                      className="dream-indicator"
                      title={dream.title}
                    >
                      {moodEmojis[dream.mood as keyof typeof moodEmojis] || '💭'}
                    </span>
                  ))}
                  {dreams.length > 3 && (
                    <span className="more-dreams">+{dreams.length - 3}</span>
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
        <div className="legend-item">
          <div className="legend-indicator dream-indicator-sample">💭</div>
          <span>Has Dreams</span>
        </div>
      </div>
    </div>
  );
}