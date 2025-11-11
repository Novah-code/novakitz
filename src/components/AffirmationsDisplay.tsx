'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  generateAffirmationsFromDream,
  saveAffirmations,
  getAffirmationsByTime,
  deleteAffirmationsForTime,
  Affirmation
} from '../lib/affirmations';

interface AffirmationsDisplayProps {
  user: User | null;
  checkInTime: 'morning' | 'afternoon' | 'evening';
  dreamText?: string;
  dreamId?: string;
  language?: 'en' | 'ko';
  onClose?: () => void;
  isPremium?: boolean;
}

export default function AffirmationsDisplay({
  user,
  checkInTime,
  dreamText = '',
  dreamId,
  language = 'en',
  onClose,
  isPremium = false
}: AffirmationsDisplayProps) {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timeLabels = {
    morning: { ko: '오전', en: 'Morning' },
    afternoon: { ko: '오후', en: 'Afternoon' },
    evening: { ko: '저녁', en: 'Evening' }
  };

  // Load existing affirmations or generate new ones
  useEffect(() => {
    const loadAffirmations = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Check if affirmations already exist for this time
        const existing = await getAffirmationsByTime(user.id, checkInTime);

        if (existing.length > 0) {
          // Use existing affirmations
          setAffirmations(existing);
          setCurrentIndex(0);
        } else if (dreamText) {
          // Generate new affirmations from dream
          const generated = await generateAffirmationsFromDream(
            user.id,
            dreamText,
            language
          );

          if (generated.length > 0) {
            // Save to database
            await saveAffirmations(user.id, generated, checkInTime, dreamId);

            // Fetch saved affirmations
            const saved = await getAffirmationsByTime(user.id, checkInTime);
            setAffirmations(saved);
            setCurrentIndex(0);
          }
        }
      } catch (error) {
        console.error('Error loading affirmations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAffirmations();
  }, [user, checkInTime, dreamText, dreamId, language]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % affirmations.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? affirmations.length - 1 : prev - 1
    );
  };

  const handleRefresh = async () => {
    if (!user || !dreamText) return;

    setIsLoading(true);
    try {
      // Delete existing affirmations
      await deleteAffirmationsForTime(user.id, checkInTime);

      // Generate new ones
      const generated = await generateAffirmationsFromDream(
        user.id,
        dreamText,
        language
      );

      if (generated.length > 0) {
        await saveAffirmations(user.id, generated, checkInTime, dreamId);
        const saved = await getAffirmationsByTime(user.id, checkInTime);
        setAffirmations(saved);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error refreshing affirmations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!affirmations.length || !affirmations[currentIndex]) {
    return null;
  }

  const current = affirmations[currentIndex];
  const timeLabel = timeLabels[checkInTime][language === 'ko' ? 'ko' : 'en'];

  return (
    <div style={{
      backgroundColor: 'rgba(127, 176, 105, 0.08)',
      border: '2px solid rgba(127, 176, 105, 0.3)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#7fb069',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {language === 'ko' ? `${timeLabel} 확언` : `${timeLabel} Affirmation`}
        </h3>

        {isPremium && affirmations.length > 1 && (
          <span style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {currentIndex + 1}/{affirmations.length}
          </span>
        )}
      </div>

      {/* Affirmation Text */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px',
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '500',
          color: '#1f2937',
          lineHeight: '1.6',
          fontStyle: 'italic'
        }}>
          {current.affirmation_text}
        </p>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: isPremium ? 'space-between' : 'flex-end'
      }}>
        {isPremium && affirmations.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              {language === 'ko' ? '이전' : 'Previous'}
            </button>

            <button
              onClick={handleNext}
              disabled={isLoading || affirmations.length <= 1}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (isLoading || affirmations.length <= 1) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || affirmations.length <= 1) ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              {language === 'ko' ? '다음' : 'Next'}
            </button>
          </>
        )}

        {dreamText && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(127, 176, 105, 0.2)',
              color: '#7fb069',
              border: '1px solid rgba(127, 176, 105, 0.3)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'rgba(127, 176, 105, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(127, 176, 105, 0.2)')}
            title={language === 'ko' ? '새로운 확언 생성' : 'Generate new affirmations'}
          >
            {isLoading ? '...' : '↻'}
          </button>
        )}
      </div>

      {/* Info Text */}
      <p style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '12px',
        marginBottom: 0,
        textAlign: 'center'
      }}>
        {language === 'ko'
          ? '이 확언을 마음에 새기고 반복해보세요.'
          : 'Take a moment to internalize this affirmation.'}
      </p>
    </div>
  );
}
