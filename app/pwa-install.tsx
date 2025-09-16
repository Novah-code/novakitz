'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(true); // Always show for testing

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setShowInstallButton(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: show manual install instructions
      // Detect device type for specific instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert('To install Nova Kitz on iPhone:\n\n1. Tap the Share button (⬆️) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install the app');
      } else if (isAndroid) {
        alert('To install Nova Kitz on Android:\n\n1. Tap the menu (⋮) in Chrome\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Install" to add the app');
      } else {
        alert('To install Nova Kitz:\n\nDesktop: Look for the "Install" icon in your browser address bar\nMobile: Use your browser menu to "Add to Home Screen"');
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt variable, since it can only be used once
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <button 
        onClick={handleInstallClick}
        className="install-btn glass glass-hover"
        title="Install Nova Dream as an app"
        style={{
          display: 'block'
        }}
      >
        <span>+</span>
        Install App
      </button>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .pwa-install-prompt {
            display: none !important;
          }
        }
        
        .pwa-install-prompt {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .install-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-family: Georgia, "Times New Roman", Times, serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .install-btn:hover {
          background: rgba(127, 176, 105, 0.2);
          border-color: rgba(127, 176, 105, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(127, 176, 105, 0.3);
        }
        
        .install-btn span {
          font-size: 16px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}