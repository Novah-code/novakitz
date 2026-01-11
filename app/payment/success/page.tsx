'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('결제를 처리하는 중입니다...');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const userId = searchParams.get('userId');

        if (!paymentKey || !orderId || !amount || !userId) {
          setStatus('error');
          setMessage('결제 정보가 올바르지 않습니다.');
          return;
        }

        // Get current user to verify
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) {
          setStatus('error');
          setMessage('사용자 인증에 실패했습니다.');
          return;
        }

        // Call confirm API
        const response = await fetch('/api/toss/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            userId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('Payment confirmation failed:', data);
          setStatus('error');
          setMessage('결제 승인에 실패했습니다. 고객센터로 문의해주세요.');
          return;
        }

        setStatus('success');
        setMessage('결제가 완료되었습니다!');

        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (error) {
        console.error('Error confirming payment:', error);
        setStatus('error');
        setMessage('결제 처리 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams, router]);

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
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1.5rem',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #7FB069',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {status === 'success' && (
          <div style={{
            fontSize: '60px',
            marginBottom: '1rem',
          }}>
            ✅
          </div>
        )}

        {status === 'error' && (
          <div style={{
            fontSize: '60px',
            marginBottom: '1rem',
          }}>
            ❌
          </div>
        )}

        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: status === 'error' ? '#ef4444' : '#1f2937',
          marginBottom: '1rem',
        }}>
          {status === 'processing' && '결제 처리 중'}
          {status === 'success' && '결제 완료'}
          {status === 'error' && '결제 실패'}
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          lineHeight: '1.6',
        }}>
          {message}
        </p>

        {status === 'success' && (
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '1rem',
          }}>
            곧 홈페이지로 이동합니다...
          </p>
        )}

        {status === 'error' && (
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
          >
            홈으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
