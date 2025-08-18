'use client';

import { useState, useEffect } from 'react';

interface UpdateNotificationProps {}

export default function UpdateNotification({}: UpdateNotificationProps = {}) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          setShowUpdate(true);
        }
      });

      // Check for updates every 5 minutes
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update();
          }
        });
      };

      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
      
      // Check immediately
      checkForUpdates();

      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Wait for the new service worker to take control
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
        
        console.log('App updated!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">새 버전이 준비되었습니다</p>
              <p className="text-xs opacity-90">업데이트하여 최신 기능을 사용하세요</p>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex-1 bg-white text-purple-600 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? '업데이트 중...' : '업데이트'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}