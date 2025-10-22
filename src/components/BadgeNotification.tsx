'use client';

import { useEffect, useState } from 'react';
import { getBadgeIcon } from './BadgeIcons';

interface BadgeNotificationProps {
  badgeType: string;
  onClose: () => void;
  language: 'en' | 'ko';
}

const badgeNames = {
  first_record: {
    en: 'First Dream Recorded!',
    ko: '첫 꿈 기록!'
  },
  '3_records': {
    en: '3 Dreams Recorded!',
    ko: '3개의 꿈 기록!'
  },
  '7_records': {
    en: '7 Dreams Recorded!',
    ko: '7개의 꿈 기록!'
  },
  '30_records': {
    en: '30 Dreams Recorded!',
    ko: '30개의 꿈 기록!'
  }
};

const badgeDescriptions = {
  first_record: {
    en: 'You\'ve taken your first step into the world of dreams',
    ko: '꿈의 세계로의 첫 걸음을 내딛었습니다'
  },
  '3_records': {
    en: 'You\'re building a dream collection',
    ko: '꿈 컬렉션을 만들어가고 있습니다'
  },
  '7_records': {
    en: 'Your dream journey is flourishing',
    ko: '당신의 꿈 여정이 번성하고 있습니다'
  },
  '30_records': {
    en: 'You\'re a dedicated dream explorer!',
    ko: '당신은 헌신적인 꿈 탐험가입니다!'
  }
};

export default function BadgeNotification({ badgeType, onClose, language }: BadgeNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 100);

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Badge Notification Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.8})`,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px 32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(127, 176, 105, 0.3), 0 0 0 1px rgba(127, 176, 105, 0.2)',
          zIndex: 10001,
          opacity: visible ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          textAlign: 'center'
        }}
      >
        {/* Celebratory Badge Icon */}
        <div style={{
          marginBottom: '24px',
          animation: visible ? 'bounce 0.6s ease' : 'none'
        }}>
          {getBadgeIcon(badgeType, 96)}
        </div>

        {/* Badge Title */}
        <h2 style={{
          margin: '0 0 12px 0',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--matcha-dark)',
          fontFamily: "'Cormorant', serif"
        }}>
          {badgeNames[badgeType as keyof typeof badgeNames]?.[language] || 'New Badge!'}
        </h2>

        {/* Badge Description */}
        <p style={{
          margin: '0 0 28px 0',
          fontSize: '0.95rem',
          color: 'rgba(0, 0, 0, 0.6)',
          lineHeight: 1.5
        }}>
          {badgeDescriptions[badgeType as keyof typeof badgeDescriptions]?.[language] || 'Congratulations!'}
        </p>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.3)';
          }}
        >
          {language === 'en' ? 'Continue' : '계속하기'}
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}
