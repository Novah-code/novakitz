'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  getArchetypeName,
  getArchetypeDescription,
  getArchetypeTraits,
  getArchetypeColor,
  getArchetypeDarkColor
} from '../../../../src/lib/archetypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PublicProfile {
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
  total_dreams_analyzed: number;
  last_updated: string;
}

export default function SharedProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    loadPublicProfile();
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      if (!userId) {
        setError('잘못된 링크입니다.');
        setLoading(false);
        return;
      }

      // Call the public profile function
      const { data, error: fetchError } = await supabase
        .rpc('get_public_profile', { profile_user_id: userId });

      if (fetchError) {
        console.error('Error fetching public profile:', fetchError);
        setError('프로필을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('프로필을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setProfile(data[0]);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load public profile:', err);
      setError('프로필을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push('/?action=signup');
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
        <p style={{ fontSize: '18px', color: '#666' }}>프로필을 불러오는 중...</p>
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
          <div style={{ fontSize: '60px', marginBottom: '1rem' }}>😢</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            프로필을 찾을 수 없습니다
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '2rem' }}>
            {error}
          </p>
          <button
            onClick={handleSignUp}
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
            나도 내 프로필 만들기
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
        {/* 상단 헤더 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#1f2937',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🌙 친구의 무의식 프로파일
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {profile.total_dreams_analyzed}개의 꿈을 분석한 결과
          </p>
        </div>

        {/* 메인 프로필 카드 */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem 2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          marginBottom: '2rem',
        }}>
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
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {getArchetypeTraits(profile.primary_archetype, language).map((trait, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#4b5563',
                    fontWeight: '500',
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 부 아키타입 */}
          {profile.secondary_archetype && (
            <div style={{
              background: '#f9fafb',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>
                부 아키타입
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                {getArchetypeName(profile.secondary_archetype, language)}
              </div>
            </div>
          )}

          {/* 반복 상징 (최대 3개만 표시) */}
          {profile.recurring_symbols.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', textAlign: 'center' }}>
                🔮 주요 상징
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {profile.recurring_symbols.slice(0, 3).map((item, idx) => (
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
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                      {item.symbol}
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
          )}

          {/* 감정 패턴 (상위 3개만) */}
          {Object.keys(profile.emotion_distribution).length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem', textAlign: 'center' }}>
                💭 감정 패턴
              </h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.entries(profile.emotion_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
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
          )}
        </div>

        {/* 강력한 CTA */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem 2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>✨</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            나도 내 아키타입을 알고 싶다면?
          </h2>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', marginBottom: '2rem' }}>
            첫 꿈 1개 + 7개 질문 (30초 소요)으로<br />
            무료로 당신의 무의식 프로파일을 발급받으세요!
          </p>

          <button
            onClick={handleSignUp}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #7FB069 0%, #6d9a5a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.4)';
            }}
          >
            🚀 무료로 시작하기
          </button>

          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '1rem' }}>
            회원가입 후 바로 이용 가능 · 신용카드 불필요
          </p>
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '14px' }}>
          <p>Powered by Novakitz 🌙</p>
        </div>
      </div>
    </div>
  );
}
