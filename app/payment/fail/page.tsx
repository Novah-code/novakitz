'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get('code');
  const message = searchParams.get('message');

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
        <div style={{
          fontSize: '60px',
          marginBottom: '1rem',
        }}>
          ❌
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ef4444',
          marginBottom: '1rem',
        }}>
          결제 실패
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: '1.6',
          marginBottom: '0.5rem',
        }}>
          {message || '결제가 취소되거나 실패했습니다.'}
        </p>

        {code && (
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            fontFamily: 'monospace',
          }}>
            오류 코드: {code}
          </p>
        )}

        <button
          onClick={() => router.push('/')}
          style={{
            marginTop: '2rem',
            padding: '12px 24px',
            background: '#7FB069',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#6d9a5a')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#7FB069')}
        >
          다시 시도하기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFail() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
