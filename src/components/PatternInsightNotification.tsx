'use client';

import { useState, useEffect } from 'react';
import { PatternInsight, markPatternAsShown } from '../lib/dreamPatterns';

interface PatternInsightNotificationProps {
  insights: PatternInsight[];
  onClose: () => void;
  language?: 'en' | 'ko';
}

const translations = {
  en: {
    patternDetected: 'Pattern Detected',
    viewDetails: 'View Details',
    dismiss: 'Dismiss',
    occurrences: 'occurrences'
  },
  ko: {
    patternDetected: '꿈 패턴 발견',
    viewDetails: '자세히 보기',
    dismiss: '닫기',
    occurrences: '회 반복'
  }
};

export default function PatternInsightNotification({
  insights,
  onClose,
  language = 'ko'
}: PatternInsightNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const t = translations[language];

  const currentInsight = insights[currentIndex];

  useEffect(() => {
    if (!currentInsight) return;

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentIndex, currentInsight]);

  const handleDismiss = () => {
    if (!currentInsight) return;

    // Mark as shown
    const patternKey = `${currentInsight.pattern.type}_${currentInsight.pattern.value}_${currentInsight.pattern.count}`;
    markPatternAsShown(patternKey);

    // Show next insight or close
    if (currentIndex < insights.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  if (!currentInsight || !isVisible) return null;

  const getIconAndColor = () => {
    switch (currentInsight.severity) {
      case 'warning':
        return { icon: '⚠️', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'insight':
        return { icon: '💡', color: '#7FB069', bgColor: '#E8F5E8' };
      default:
        return { icon: '🔍', color: '#3B82F6', bgColor: '#DBEAFE' };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        maxWidth: '400px',
        width: 'calc(100vw - 40px)',
        animation: 'slideInLeft 0.4s ease-out',
        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          border: `2px solid ${color}`
        }}
      >
        {/* Header */}
        <div
          style={{
            background: bgColor,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: `1px solid ${color}33`
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: color }}>
              {t.patternDetected}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
              {currentInsight.pattern.count} {t.occurrences}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Pattern Tag */}
          <div
            style={{
              display: 'inline-block',
              background: bgColor,
              border: `1px solid ${color}`,
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: color
            }}
          >
            {currentInsight.pattern.value}
          </div>

          {/* Message */}
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#374151'
            }}
          >
            {currentInsight.message}
          </p>

          {/* Progress indicator if multiple insights */}
          {insights.length > 1 && (
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                gap: '6px',
                justifyContent: 'center'
              }}
            >
              {insights.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: idx === currentIndex ? color : '#d1d5db',
                    transition: 'background 0.3s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
