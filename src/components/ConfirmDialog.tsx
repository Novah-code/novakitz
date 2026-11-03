'use client';

import '../styles/home-scene.css';
import { scrim, skyCard, pillGlass, pillWhite, heading, BASE } from '../lib/skyUi';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        ...scrim,
        zIndex: 20600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...skyCard,
          borderRadius: 32,
          padding: '32px 26px 26px',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          animation: 'scaleIn 0.3s ease-out',
        }}
      >
        <div className="home-scene__grain" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ ...heading(false, 32, 22), marginBottom: 12 }}>{title}</h3>
          <p style={{ color: BASE, margin: '0 0 26px', lineHeight: 1.7, fontSize: 15 }}>{message}</p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ ...pillGlass, padding: '14px 12px' }}>
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              style={{
                ...pillWhite,
                padding: '14px 12px',
                ...(isDangerous
                  ? { color: '#B5566F', background: 'rgba(181,86,111,0.14)', border: '1px solid rgba(181,86,111,0.35)', boxShadow: 'none' }
                  : {}),
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
