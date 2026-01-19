'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const handleGetStarted = () => {
    // Go to main page (dream journal interface)
    router.push('/');
  };

  const handleUpgradeClick = (plan: 'lifetime' | 'premium') => {
    if (plan === 'lifetime') {
      window.open(process.env.NEXT_PUBLIC_GUMROAD_LIFETIME_URL || 'https://novakitz.gumroad.com/l/novakitz-lifetime', '_blank');
    } else {
      window.open(process.env.NEXT_PUBLIC_GUMROAD_MONTHLY_URL || 'https://novakitz.gumroad.com/l/novakitz', '_blank');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem',
            fontFamily: "'Cormorant', serif"
          }}>
            NovaKitz 요금제
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            당신의 무의식을 탐험하고 꿈을 기록하세요
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Free Plan */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              Free
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              무료로 시작하기
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              $0
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              영원히 무료
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {[
                '월 7회 AI 꿈 해석',
                '무제한 꿈 기록',
                '융 아키타입 테스트',
                '기본 통계 및 패턴 분석'
              ].map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#7FB069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={handleGetStarted}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              {isLoggedIn ? '저널로 이동' : '무료로 시작하기'}
            </button>
          </div>

          {/* Premium Monthly */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(127, 176, 105, 0.2)',
            border: '3px solid #7FB069',
            position: 'relative'
          }}>
            {/* Popular Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
              color: 'white',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              POPULAR
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              Premium
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              매월 구독
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#7FB069',
              marginBottom: '0.5rem'
            }}>
              $4.99
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              매월 결제
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {[
                '월 200회 AI 꿈 해석 (하루 6~7회)',
                '무제한 꿈 기록 및 전체 히스토리',
                '매일 아침 맞춤 확언 이메일',
                '주간 꿈 패턴 리포트',
                '융 아키타입 심화 분석',
                '모든 미래 기능 무료 업데이트'
              ].map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: idx < 2 ? '600' : 'normal'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#7FB069" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgradeClick('premium')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(127, 176, 105, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(127, 176, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(127, 176, 105, 0.3)';
              }}
            >
              Premium 시작하기
            </button>
          </div>

          {/* Lifetime */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            border: '2px solid #bfdbfe',
            position: 'relative'
          }}>
            {/* Limited Badge */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              🔥 LIMITED 200 SPOTS
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              Lifetime
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              평생 이용권
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#9ca3af',
                textDecoration: 'line-through'
              }}>
                $199
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1e40af'
              }}>
                $129
              </div>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#7c2d12',
              fontWeight: '600',
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #bfdbfe'
            }}>
              단 한 번 결제로 평생 사용 • 35% 할인
            </div>

            {/* Features */}
            <div style={{ marginBottom: '2rem' }}>
              {[
                '✨ Premium의 모든 기능',
                '💎 평생 무제한 AI 해석 (월 200회)',
                '🎁 모든 미래 기능 평생 무료',
                '🚀 Product Hunt 론칭 특가',
                '⏰ 200명 한정 (마감 임박)',
                '💰 평생 $4.99/월 절약'
              ].map((feature, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  fontSize: '15px',
                  color: '#374151',
                  fontWeight: idx === 0 || idx === 1 ? '600' : 'normal'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: '12px', marginTop: '2px', flexShrink: 0 }}>
                    <path d="M16.6666 5L7.49992 14.1667L3.33325 10" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleUpgradeClick('lifetime')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(30, 64, 175, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 64, 175, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(30, 64, 175, 0.3)';
              }}
            >
              🎯 평생 이용권 구매하기
            </button>

            <div style={{
              marginTop: '1rem',
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              환불 불가 • 즉시 라이선스 발급
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            자주 묻는 질문
          </h2>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {[
              {
                q: '월 200회 AI 해석이면 충분한가요?',
                a: '네! 하루 평균 6~7회 해석이 가능해서 매일 여러 개의 꿈을 기록하고 분석받기에 충분합니다. 대부분의 사용자는 하루 1~2개의 꿈을 기록합니다.'
              },
              {
                q: 'Lifetime 이용권은 정말 평생인가요?',
                a: '네, 단 한 번 결제로 NovaKitz 서비스가 종료되지 않는 한 평생 Premium 기능을 사용하실 수 있습니다. 모든 미래 기능 업데이트도 무료로 제공됩니다.'
              },
              {
                q: '환불이 가능한가요?',
                a: 'Lifetime 이용권은 즉시 라이선스 키가 발급되는 디지털 상품으로 환불이 불가능합니다. 먼저 무료 플랜(월 7회 AI 해석)으로 서비스를 충분히 체험해보신 후 구매를 결정해주세요.'
              },
              {
                q: 'Premium 월 구독은 언제든 취소 가능한가요?',
                a: '네, 언제든지 구독을 취소하실 수 있습니다. 취소 후에도 다음 결제일까지는 Premium 기능을 계속 사용하실 수 있습니다.'
              },
              {
                q: '결제는 어떻게 하나요?',
                a: 'Gumroad를 통해 안전하게 결제하실 수 있습니다. 신용카드, 페이팔 등 다양한 결제 수단을 지원합니다.'
              }
            ].map((faq, idx) => (
              <div key={idx} style={{
                marginBottom: '2rem',
                paddingBottom: '2rem',
                borderBottom: idx < 4 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.75rem'
                }}>
                  {faq.q}
                </div>
                <div style={{
                  fontSize: '15px',
                  color: '#6b7280',
                  lineHeight: '1.6'
                }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '1rem'
          }}>
            아직 고민 중이신가요? 먼저 무료로 시작해보세요
          </p>
          <button
            onClick={handleGetStarted}
            style={{
              padding: '14px 32px',
              background: 'white',
              color: '#7FB069',
              border: '2px solid #7FB069',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7FB069';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#7FB069';
            }}
          >
            무료로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
