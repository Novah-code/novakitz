'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  generateAffirmationsFromDream,
  saveAffirmations,
  deleteAffirmationsForTime,
  getTodayAffirmations,
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
  /** Shown when there is nothing for today (the card around it stays visible). */
  emptyText?: string;
}

export default function AffirmationsDisplay({
  user,
  checkInTime,
  dreamText = '',
  dreamId,
  language = 'en',
  onClose,
  isPremium = false,
  emptyText
}: AffirmationsDisplayProps) {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all today's affirmations
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const existing = await getTodayAffirmations(user.id);

        if (existing.length > 0) {
          // Check language mismatch for dream-generated affirmations
          const dreamBased = existing.filter(a => a.check_in_time === checkInTime);
          if (dreamBased.length > 0 && dreamBased[0].language !== language && dreamText) {
            await deleteAffirmationsForTime(user.id, checkInTime);
            const generated = await generateAffirmationsFromDream(user.id, dreamText, language);
            if (generated.length > 0) {
              await saveAffirmations(user.id, generated, checkInTime, dreamId, language);
            }
            setAffirmations(await getTodayAffirmations(user.id));
          } else {
            setAffirmations(existing);
          }
        } else if (dreamText) {
          const generated = await generateAffirmationsFromDream(user.id, dreamText, language);
          if (generated.length > 0) {
            await saveAffirmations(user.id, generated, checkInTime, dreamId, language);
            setAffirmations(await getTodayAffirmations(user.id));
          }
        }
      } catch (error) {
        console.error('Error loading affirmations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id, checkInTime, dreamText, dreamId, language]);

  if (isLoading) {
    return (
      <div style={{ padding: '8px 0', color: '#8BA390', fontSize: 13, fontStyle: 'italic' }}>
        {language === 'ko' ? '확언 불러오는 중...' : 'Loading affirmations...'}
      </div>
    );
  }

  if (!affirmations.length) {
    return emptyText ? (
      <div style={{ padding: '2px 0', color: '#7d8f82', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>{emptyText}</div>
    ) : null;
  }

  // One a day. Older rows from when it was three may still be there today; show the first.
  const todays = affirmations[0];

  return (
    <p style={{
      margin: 0,
      fontSize: 16,
      lineHeight: 1.7,
      color: '#3A4A3E',
      fontStyle: 'italic',
      whiteSpace: 'pre-line',
    }}>
      {todays.affirmation_text}
    </p>
  );
}
