'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

/*
 * Written in inline styles, like the rest of the app, and not in Tailwind.
 *
 * It was Tailwind — `fixed bottom-6 right-6`, a gradient, white text, rounded
 * corners, padding — and none of it existed. Tailwind is in package.json and
 * wired into PostCSS, but `globals.css` never imports it, so the framework
 * emits an empty stylesheet and every utility class in the codebase is inert.
 *
 * What that produced on the Pricing screen: `fixed` did nothing, so the toast
 * fell to the bottom of the document in normal flow, full width, black text on
 * the page background, with a bare `ℹ` and a bare `×` beside it. It read as a
 * browser error, not as part of the app.
 *
 * The fix is not to turn Tailwind on. Its preflight resets margins, borders,
 * fonts and button appearance across every element, and this app draws itself
 * with inline styles and its own CSS on the assumption that no such reset is
 * running. Enabling it days before a review resubmission would restyle screens
 * nobody is going to re-check.
 */

const PALETTE: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'rgba(94, 138, 106, 0.96)', icon: '✓' },
  error: { bg: 'rgba(176, 96, 96, 0.96)', icon: '!' },
  /* Not blue. The one that shows on the paywall is this one, and a system
     blue on a screen that is entirely sage and cream reads as a browser
     dialog rather than as the app speaking. */
  info: { bg: 'rgba(74, 94, 82, 0.96)', icon: 'ℹ' },
};

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  /* Mounted hidden, then shown on the next frame, so the transition has two
     states to move between and the toast slides up instead of appearing. */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const dismiss = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const { bg, icon } = PALETTE[type];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        /* Above the home indicator on a notched phone, and 24px from the
           bottom on anything else. */
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        left: '50%',
        zIndex: 1000,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        transform: `translateX(-50%) translateY(${isVisible ? '0' : '12px'})`,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 300ms ease, transform 300ms ease',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 16,
          background: bg,
          color: '#FBFCFB',
          fontSize: 14,
          lineHeight: 1.45,
          boxShadow: '0 10px 30px rgba(47, 59, 51, 0.28)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: '0 0 auto',
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.18)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {icon}
        </span>

        <span style={{ flex: '1 1 auto' }}>{message}</span>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            flex: '0 0 auto',
            width: 28,
            height: 28,
            padding: 0,
            border: 'none',
            borderRadius: '50%',
            background: 'none',
            color: 'rgba(251, 252, 251, 0.75)',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Toast Container for managing multiple toasts
interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  /* Each Toast positions itself, so the stack is spaced by lifting every toast
     above the one before it rather than by a flex column that a `fixed` child
     would ignore anyway. */
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ position: 'relative', zIndex: 1000 - index, transform: `translateY(-${index * 72}px)` }}
        >
          <Toast message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </>
  );
}
