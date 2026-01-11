'use client';

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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '448px',
          width: '100%',
          margin: '0 16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'scaleIn 0.3s ease-out',
          border: '1px solid rgba(127, 176, 105, 0.2)'
        }}
      >
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#5A8449'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#374151',
          marginBottom: '32px',
          lineHeight: '1.625'
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '500',
              transition: 'all 0.2s',
              background: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              background: isDangerous
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
