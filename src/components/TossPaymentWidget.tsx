'use client';

import { useEffect, useRef, useState } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';
import { v4 as uuidv4 } from 'uuid';

interface TossPaymentWidgetProps {
  userId: string;
  userEmail: string;
  billingCycle: 'monthly' | 'yearly';
  language: 'en' | 'ko';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function TossPaymentWidget({
  userId,
  userEmail,
  billingCycle,
  language,
  onSuccess,
  onError
}: TossPaymentWidgetProps) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const customerKey = userId; // Use userId as customerKey

  // Price in KRW
  const price = billingCycle === 'monthly' ? 5900 : 59000;
  const planName = billingCycle === 'monthly'
    ? (language === 'ko' ? '프리미엄 월간' : 'Premium Monthly')
    : (language === 'ko' ? '프리미엄 연간' : 'Premium Yearly');

  useEffect(() => {
    if (!clientKey) {
      setError('Toss Payments client key is not configured');
      setIsLoading(false);
      return;
    }

    const loadWidget = async () => {
      try {
        // Load payment widget
        const paymentWidget = await loadPaymentWidget(clientKey, customerKey);
        paymentWidgetRef.current = paymentWidget;

        // Render payment methods with selector string
        await paymentWidget.renderPaymentMethods(
          '#payment-methods',
          { value: price },
          { variantKey: 'DEFAULT' }
        );

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Toss payment widget:', err);
        setError('Failed to load payment widget');
        setIsLoading(false);
        onError?.(err as Error);
      }
    };

    loadWidget();
  }, [clientKey, customerKey, price, onError]);

  const handlePayment = async () => {
    if (!paymentWidgetRef.current) {
      alert(language === 'ko' ? '결제 위젯을 불러오는 중입니다.' : 'Loading payment widget...');
      return;
    }

    try {
      const orderId = uuidv4();
      const successUrl = `${window.location.origin}/api/toss-success?userId=${userId}&billingCycle=${billingCycle}`;
      const failUrl = `${window.location.origin}/api/toss-fail`;

      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName: planName,
        customerEmail: userEmail,
        successUrl,
        failUrl,
      });
    } catch (err) {
      console.error('Payment request error:', err);
      alert(
        language === 'ko'
          ? '결제 요청 중 오류가 발생했습니다.'
          : 'An error occurred while requesting payment.'
      );
      onError?.(err as Error);
    }
  };

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#e74c3c'
      }}>
        <p>{error}</p>
        <p style={{ fontSize: '0.9rem', color: 'rgba(0, 0, 0, 0.6)', marginTop: '8px' }}>
          {language === 'ko'
            ? '관리자에게 문의해주세요.'
            : 'Please contact the administrator.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {isLoading && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'rgba(0, 0, 0, 0.5)'
        }}>
          <p>{language === 'ko' ? '결제 위젯을 불러오는 중...' : 'Loading payment widget...'}</p>
        </div>
      )}

      {/* Payment Methods Widget */}
      <div
        id="payment-methods"
        style={{
          minHeight: isLoading ? '200px' : 'auto',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s'
        }}
      />

      {/* Payment Button */}
      {!isLoading && (
        <button
          onClick={handlePayment}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, #0064FF 0%, #0050CC 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 100, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 100, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 100, 255, 0.3)';
          }}
        >
          {language === 'ko' ? '결제하기' : 'Pay Now'} - {billingCycle === 'monthly' ? '₩5,900/월' : '₩59,000/년'}
        </button>
      )}
    </div>
  );
}
