'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getBadgeIcon } from './BadgeIcons';

interface BadgesDisplayProps {
  user: User;
  language: 'en' | 'ko';
}

const badgeNames = {
  first_record: {
    en: 'First Dream',
    ko: '첫 꿈'
  },
  '3_records': {
    en: '3 Dreams',
    ko: '3개의 꿈'
  },
  '7_records': {
    en: '7 Dreams',
    ko: '7개의 꿈'
  },
  '30_records': {
    en: '30 Dreams',
    ko: '30개의 꿈'
  }
};

const badgeDescriptions = {
  first_record: {
    en: 'First step into dreams',
    ko: '꿈으로의 첫 걸음'
  },
  '3_records': {
    en: 'Dream collector',
    ko: '꿈 수집가'
  },
  '7_records': {
    en: 'Dream explorer',
    ko: '꿈 탐험가'
  },
  '30_records': {
    en: 'Dream master',
    ko: '꿈 마스터'
  }
};

export default function BadgesDisplay({ user, language }: BadgesDisplayProps) {
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [user]);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('badges')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching badges:', error);
        return;
      }

      setBadges(data?.badges || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const allBadges = ['first_record', '3_records', '7_records', '30_records'];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--matcha-dark)', fontSize: '0.9rem' }}>
          {language === 'en' ? 'Loading badges...' : '뱃지 불러오는 중...'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '1.2rem',
        fontWeight: 600,
        color: 'var(--matcha-dark)',
        fontFamily: "'Cormorant', serif"
      }}>
        {language === 'en' ? 'Your Badges' : '당신의 뱃지'}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
      }}>
        {allBadges.map((badgeType) => {
          const isEarned = badges.includes(badgeType);

          return (
            <div
              key={badgeType}
              style={{
                padding: '16px',
                background: isEarned
                  ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)'
                  : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '12px',
                border: isEarned ? '2px solid rgba(127, 176, 105, 0.3)' : '2px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                transition: 'all 0.2s',
                opacity: isEarned ? 1 : 0.4,
                filter: isEarned ? 'none' : 'grayscale(1)'
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                {getBadgeIcon(badgeType, 56)}
              </div>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isEarned ? 'var(--matcha-dark)' : 'rgba(0, 0, 0, 0.4)'
              }}>
                {badgeNames[badgeType as keyof typeof badgeNames]?.[language]}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: isEarned ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)'
              }}>
                {badgeDescriptions[badgeType as keyof typeof badgeDescriptions]?.[language]}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(127, 176, 105, 0.05)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.85rem',
          color: 'var(--matcha-dark)',
          fontWeight: 500
        }}>
          {language === 'en'
            ? `${badges.length} of ${allBadges.length} badges earned`
            : `${allBadges.length}개 중 ${badges.length}개 뱃지 획득`
          }
        </p>
      </div>
    </div>
  );
}
