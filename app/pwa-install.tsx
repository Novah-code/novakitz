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
  const [showInstallButton, setShowInstallButton] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone || 
             document.referrer.includes('android-app://');
    };
    
    setIsStandalone(checkStandalone());
    
    if (checkStandalone()) {
      setShowInstallButton(false);
      return;
    }
    
    // Also hide if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setShowInstallButton(false);
      return;
    }
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
      localStorage.setItem('pwa-install-dismissed', 'true');
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
        if (confirm('Install novakitz on your device?\n\n1. Tap the Share button (⬆️) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install the app\n\nWould you like to proceed?')) {
          // User confirmed, hide the button
          setShowInstallButton(false);
          localStorage.setItem('pwa-install-dismissed', 'true');
        }
      } else if (isAndroid) {
        if (confirm('Install novakitz on your device?\n\n1. Tap the menu (⋮) in Chrome\n2. Tap "Add to Home screen" or "Install app"\n3. Tap "Install" to add the app\n\nWould you like to proceed?')) {
          setShowInstallButton(false);
          localStorage.setItem('pwa-install-dismissed', 'true');
        }
      } else {
        if (confirm('Install novakitz on your device?\n\nDesktop: Look for the "Install" icon in your browser address bar\nMobile: Use your browser menu to "Add to Home Screen"\n\nWould you like to proceed?')) {
          setShowInstallButton(false);
          localStorage.setItem('pwa-install-dismissed', 'true');
        }
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      localStorage.setItem('pwa-install-dismissed', 'true');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa-install-dismissed', 'true');
    }

    // Clear the deferredPrompt variable, since it can only be used once
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallButton || isStandalone) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="install-content">
        <button 
          onClick={handleInstallClick}
          className="install-btn glass glass-hover"
          title="Install novakitz as an app"
        >
          <span>+</span>
          Install App
        </button>
        <button 
          onClick={handleDismiss}
          className="dismiss-btn"
          title="Dismiss"
        >
          ×
        </button>
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .pwa-install-prompt {
            top: 10px;
            right: 10px;
            display: block;
          }
          
          .install-btn {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
        
        .pwa-install-prompt {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .install-content {
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        .dismiss-btn {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 50%;
          opacity: 0.7;
          transition: all 0.2s ease;
        }
        
        .dismiss-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}