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
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching badges:', error);
        setLoading(false);
        return;
      }

      console.log('User profile data:', data);

      // Handle badges - could be array or null
      const badgesData = data?.badges || [];
      console.log('Badges data:', badgesData);

      if (Array.isArray(badgesData)) {
        setBadges(badgesData);
      } else if (typeof badgesData === 'string') {
        // If it's a string, try to parse it
        try {
          setBadges(JSON.parse(badgesData));
        } catch {
          setBadges([]);
        }
      } else {
        setBadges([]);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      setBadges([]);
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
      padding: '32px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(127, 176, 105, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(127, 176, 105, 0.2)'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        fontSize: '1.6rem',
        fontWeight: 700,
        color: 'var(--matcha-dark)',
        fontFamily: "'Cormorant', serif",
        letterSpacing: '-0.5px'
      }}>
        {language === 'en' ? 'Your Badges' : '당신의 뱃지'}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px'
      }}>
        {allBadges.map((badgeType) => {
          const isEarned = badges.includes(badgeType);

          return (
            <div
              key={badgeType}
              style={{
                padding: '24px 16px',
                background: isEarned
                  ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.12) 0%, rgba(139, 195, 74, 0.08) 100%)'
                  : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '16px',
                border: isEarned
                  ? '2px solid rgba(127, 176, 105, 0.4)'
                  : '2px solid rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isEarned ? 1 : 0.5,
                filter: isEarned ? 'none' : 'grayscale(1) opacity(0.7)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (isEarned) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(127, 176, 105, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEarned) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {/* Shine effect for earned badges */}
              {isEarned && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  animation: 'shine 3s infinite'
                }} />
              )}

              {/* Badge Icon Container */}
              <div style={{
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                {getBadgeIcon(badgeType, 68)}
              </div>

              {/* Badge Name */}
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '1rem',
                fontWeight: 700,
                color: isEarned ? 'var(--matcha-dark)' : 'rgba(0, 0, 0, 0.35)',
                letterSpacing: '-0.3px'
              }}>
                {badgeNames[badgeType as keyof typeof badgeNames]?.[language]}
              </p>

              {/* Badge Description */}
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: isEarned ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.25)',
                fontWeight: 500,
                lineHeight: 1.4
              }}>
                {badgeDescriptions[badgeType as keyof typeof badgeDescriptions]?.[language]}
              </p>

              {/* Earned indicator */}
              {isEarned && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.7rem',
                  color: '#7FB069',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ✓ {language === 'en' ? 'Earned' : '획득'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div style={{
        marginTop: '28px',
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(127, 176, 105, 0.06) 0%, rgba(139, 195, 74, 0.03) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(127, 176, 105, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--matcha-dark)'
          }}>
            {language === 'en' ? 'Progress' : '진행도'}
          </p>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#7FB069',
            fontWeight: 700
          }}>
            {badges.length}/{allBadges.length}
          </p>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0, 0, 0, 0.06)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #7FB069 0%, #8BC34A 100%)',
            width: `${(badges.length / allBadges.length) * 100}%`,
            transition: 'width 0.5s ease',
            boxShadow: '0 0 12px rgba(127, 176, 105, 0.4)'
          }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
