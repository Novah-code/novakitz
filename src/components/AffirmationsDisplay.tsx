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
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Load checked state from localStorage
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `novakitz_affirmation_checked_${user.id}_${today}`;
    const saved = localStorage.getItem(key);
    if (saved) setCheckedIds(new Set(JSON.parse(saved)));
  }, [user?.id]);

  const toggleChecked = (id: string) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `novakitz_affirmation_checked_${user.id}_${today}`;
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  };

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

  if (!affirmations.length) return null;

  const displayList = affirmations.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {displayList.map((aff) => {
        const isChecked = aff.id ? checkedIds.has(aff.id) : false;
        return (
          <button
            key={aff.id}
            onClick={() => aff.id && toggleChecked(aff.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: isChecked ? 'rgba(122,179,130,0.1)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${isChecked ? 'rgba(122,179,130,0.4)' : 'rgba(255,255,255,0.8)'}`,
              borderRadius: 12,
              padding: '10px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.2s',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 20, height: 20,
              borderRadius: 6,
              border: `2px solid ${isChecked ? '#7AB382' : 'rgba(122,179,130,0.4)'}`,
              background: isChecked ? '#7AB382' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              marginTop: 1,
              transition: 'all 0.2s',
            }}>
              {isChecked && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {/* Text */}
            <span style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: isChecked ? '#8BA390' : '#3A4A3E',
              textDecoration: isChecked ? 'line-through' : 'none',
              fontStyle: 'italic',
              transition: 'all 0.2s',
              whiteSpace: 'pre-line',
            }}>
              {aff.affirmation_text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
