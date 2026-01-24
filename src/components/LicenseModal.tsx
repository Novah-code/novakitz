'use client';

import { useState } from 'react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  language: 'en' | 'ko';
  onSuccess: () => void;
}

export default function LicenseModal({ isOpen, onClose, userId, language, onSuccess }: LicenseModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          userId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: language === 'ko' ? '라이선스가 활성화되었습니다!' : 'License activated successfully!'
        });
        onSuccess();
        setTimeout(() => {
          onClose();
          setLicenseKey('');
          setMessage(null);
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: data.error || (language === 'ko' ? '라이선스 활성화 실패' : 'License activation failed')
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: language === 'ko' ? '오류가 발생했습니다' : 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--matcha-dark)', margin: 0 }}>
            {language === 'ko' ? '라이선스 키 입력' : 'Enter License Key'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', lineHeight: '1.5' }}>
          {language === 'ko'
            ? 'Gumroad에서 구매한 라이선스 키를 입력하세요.'
            : 'Enter your license key from Gumroad.'}
        </p>

        <input
          type="text"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder={language === 'ko' ? '라이선스 키 입력...' : 'Enter license key...'}
          autoFocus
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            border: '2px solid var(--matcha-green)',
            borderRadius: '8px',
            marginBottom: '1rem',
            boxSizing: 'border-box',
            outline: 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && licenseKey.trim()) {
              handleActivate();
            }
          }}
        />

        {message && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24'
          }}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading || !licenseKey.trim()}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            background: loading || !licenseKey.trim() ? '#ccc' : 'var(--matcha-green)',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || !licenseKey.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {loading
            ? (language === 'ko' ? '활성화 중...' : 'Activating...')
            : (language === 'ko' ? '라이선스 활성화' : 'Activate License')}
        </button>
      </div>
    </div>
  );
}
