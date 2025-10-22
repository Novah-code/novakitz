'use client';

import { useState, useEffect } from 'react';
import { isOnline, addOnlineListener, addOfflineListener, removeOnlineListener, removeOfflineListener, offlineStorage } from '../lib/offlineStorage';

interface OfflineIndicatorProps {
  language: 'en' | 'ko';
}

const translations = {
  en: {
    offline: 'Offline Mode',
    online: 'Back Online',
    syncingDreams: (count: number) => `Syncing ${count} dream${count > 1 ? 's' : ''}...`,
    synced: 'All dreams synced!',
    offlineMessage: 'Your dreams will be saved locally and synced when online'
  },
  ko: {
    offline: '오프라인 모드',
    online: '온라인 연결됨',
    syncingDreams: (count: number) => `${count}개 꿈 동기화 중...`,
    synced: '모든 꿈이 동기화되었어요!',
    offlineMessage: '꿈이 로컬에 저장되고 온라인 연결 시 동기화됩니다'
  }
};

export default function OfflineIndicator({ language }: OfflineIndicatorProps) {
  const t = translations[language];
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    setOnline(isOnline());

    const handleOnline = async () => {
      setOnline(true);

      // Check for unsynced dreams
      const count = await offlineStorage.getUnsyncedCount();
      if (count > 0) {
        setUnsyncedCount(count);
        // Trigger sync (will be handled by parent component)
        window.dispatchEvent(new CustomEvent('sync-offline-dreams'));
      } else {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
    };

    const handleOffline = () => {
      setOnline(false);
    };

    addOnlineListener(handleOnline);
    addOfflineListener(handleOffline);

    // Check initial unsynced count
    offlineStorage.getUnsyncedCount().then(setUnsyncedCount);

    return () => {
      removeOnlineListener(handleOnline);
      removeOfflineListener(handleOffline);
    };
  }, []);

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => setSyncing(true);
    const handleSyncComplete = () => {
      setSyncing(false);
      setUnsyncedCount(0);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    };

    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-complete', handleSyncComplete);
    };
  }, []);

  if (online && !syncing && !showSyncSuccess && unsyncedCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '12px 24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        ...(online
          ? {
              background: showSyncSuccess ? 'rgba(127, 176, 105, 0.95)' : 'rgba(255, 193, 7, 0.95)',
              color: 'white'
            }
          : {
              background: 'rgba(158, 158, 158, 0.95)',
              color: 'white'
            })
      }}
    >
      {/* Icon */}
      {!online ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      ) : syncing ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      ) : showSyncSuccess ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : null}

      {/* Text */}
      <span>
        {!online
          ? t.offline
          : syncing
          ? t.syncingDreams(unsyncedCount)
          : showSyncSuccess
          ? t.synced
          : t.online}
      </span>

      {/* Offline message */}
      {!online && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '8px'
        }}>
          {t.offlineMessage}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
