'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import {
  ARCHETYPES,
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor
} from '../../src/lib/archetypes';

interface UnconsciousProfile {
  primary_archetype: string;
  secondary_archetype: string | null;
  archetype_scores: Record<string, number>;
  recurring_symbols: Array<{
    symbol: string;
    count: number;
    emotions: string[];
  }>;
  emotion_distribution: Record<string, number>;
  dominant_emotion: string | null;
  dream_style: {
    vividness: number;
    abstractness: number;
    avg_length: number;
  };
  total_dreams_analyzed: number;
  last_updated: string;
}

export default function UnconsciousProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UnconsciousProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('unconscious_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // 프로파일이 없음
          setError('프로파일을 생성하려면 최소 5개의 꿈을 기록해주세요.');
        } else {
          setError('프로파일을 불러오는데 실패했습니다.');
        }
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('프로파일을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const share = () => {
    // TODO: 이미지 생성 또는 URL 공유
    alert('공유 기능은 곧 추가됩니다!');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>프로파일을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem',
      }}>
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '60px', marginBottom: '1rem' }}>📊</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            프로파일이 아직 없습니다
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '2rem' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 24px',
              background: '#7FB069',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            꿈 기록하러 가기
          </button>
        </div>
      </div>
    );
  }

  const primaryColor = getArchetypeColor(profile.primary_archetype);
  const primaryDarkColor = getArchetypeDarkColor(profile.primary_archetype);
  const secondaryColor = profile.secondary_archetype
    ? getArchetypeColor(profile.secondary_archetype)
    : primaryColor;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      padding: '2rem 1rem',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            ← 홈으로
          </button>
          <button
            onClick={share}
            style={{
              padding: '8px 16px',
              background: '#7FB069',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            📤 공유하기
          </button>
        </div>

        {/* 메인 카드 */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginBottom: '2rem',
        }}>
          {/* 타이틀 */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              당신의 무의식 프로파일
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              {profile.total_dreams_analyzed}개의 꿈을 분석한 결과
            </p>
          </div>

          {/* 주요 아키타입 */}
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDarkColor} 100%)`,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>
              주요 아키타입
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              {getArchetypeName(profile.primary_archetype, language)}
            </div>
            <div style={{ fontSize: '16px', color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {getArchetypeDescription(profile.primary_archetype, language)}
            </div>
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.8',
              textAlign: 'center',
            }}>
              {getArchetypeTraits(profile.primary_archetype, language)}
            </div>
          </div>

          {/* 잘 어울리는 유형 */}
          {profile.secondary_archetype && (
            <div style={{
              background: '#f9fafb',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                잘 어울리는 유형
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                {getArchetypeName(profile.secondary_archetype, language)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {getArchetypeDescription(profile.secondary_archetype, language)}
              </div>
            </div>
          )}

          {/* 반복 상징 TOP 5 */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              🔮 반복 상징 TOP 5
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {profile.recurring_symbols.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f9fafb',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                      {item.symbol}
                    </div>
                    {item.emotions.length > 0 && (
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {item.emotions.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    background: primaryDarkColor,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}>
                    {item.count}회
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 감정 패턴 */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              💭 감정 패턴
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {Object.entries(profile.emotion_distribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([emotion, percentage], idx) => (
                  <div key={idx}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                        {emotion}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>
                        {Math.round(percentage * 100)}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${percentage * 100}%`,
                        height: '100%',
                        background: primaryDarkColor,
                        borderRadius: '4px',
                      }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 꿈 스타일 */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              ✨ 꿈 스타일
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  생생함
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                  {Math.round(profile.dream_style.vividness * 100)}%
                </div>
              </div>
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  추상성
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                  {Math.round(profile.dream_style.abstractness * 100)}%
                </div>
              </div>
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                  평균 길이
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                  {Math.round(profile.dream_style.avg_length)}자
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          <p>마지막 업데이트: {new Date(profile.last_updated).toLocaleDateString('ko-KR')}</p>
          <p style={{ marginTop: '0.5rem' }}>
            꿈을 더 많이 기록할수록 프로파일이 더 정확해집니다
          </p>
        </div>
      </div>
    </div>
  );
}
