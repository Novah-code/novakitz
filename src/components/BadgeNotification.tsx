'use client';

import { useEffect, useState } from 'react';
import { getBadgeIcon } from './BadgeIcons';
import '../styles/home-scene.css';
import { scrim, skyCard, pillWhite, heading, BASE } from '../lib/skyUi';

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
          ...scrim,
          zIndex: 20600,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Badge Notification Card */}
      <div
        style={{
          ...skyCard,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.85})`,
          borderRadius: 32,
          padding: '40px 28px 28px',
          maxWidth: 380,
          width: '90%',
          zIndex: 20601,
          opacity: visible ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          textAlign: 'center',
        }}
      >
        <div className="home-scene__grain" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ marginBottom: 20, animation: visible ? 'bounce 0.6s ease' : 'none' }}>
            {getBadgeIcon(badgeType, 96)}
          </div>

          <h2 style={{ ...heading(language === 'ko', 32, 22), marginBottom: 10 }}>
            {badgeNames[badgeType as keyof typeof badgeNames]?.[language] || 'New Badge!'}
          </h2>

          <p style={{ margin: '0 0 26px 0', fontSize: '0.95rem', color: BASE, lineHeight: 1.6 }}>
            {badgeDescriptions[badgeType as keyof typeof badgeDescriptions]?.[language] || 'Congratulations!'}
          </p>

          <button onClick={handleClose} style={pillWhite}>
            {language === 'en' ? 'Continue' : '계속하기'}
          </button>
        </div>
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
