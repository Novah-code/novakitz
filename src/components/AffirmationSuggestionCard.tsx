'use client';

import { useState } from 'react';

interface AffirmationSuggestionCardProps {
  affirmations: string[];
  dreamTitle?: string;
  language?: 'en' | 'ko';
  onSave?: (selectedAffirmations: string[]) => void;
  onClose: () => void;
}

const translations = {
  en: {
    title: 'Affirmations for You',
    subtitle: 'Based on your dream',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    save: 'Save Selected',
    skip: 'Skip',
    saved: 'Saved!',
    selectAtLeast: 'Please select at least one affirmation'
  },
  ko: {
    title: '당신을 위한 확언',
    subtitle: '꿈 분석을 바탕으로',
    selectAll: '전체 선택',
    deselectAll: '선택 해제',
    save: '선택한 확언 저장',
    skip: '건너뛰기',
    saved: '저장되었습니다!',
    selectAtLeast: '최소 하나의 확언을 선택해주세요'
  }
};

export default function AffirmationSuggestionCard({
  affirmations,
  dreamTitle,
  language = 'ko',
  onSave,
  onClose
}: AffirmationSuggestionCardProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    affirmations.map((_, i) => i) // All selected by default
  );
  const [isSaving, setIsSaving] = useState(false);
  const t = translations[language];

  const toggleSelection = (index: number) => {
    // Using functional setState for stable callbacks
    setSelectedIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAll = () => {
    setSelectedIndices(affirmations.map((_, i) => i));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  const handleSave = async () => {
    if (selectedIndices.length === 0) {
      alert(t.selectAtLeast);
      return;
    }

    setIsSaving(true);
    const selected = selectedIndices.map(i => affirmations[i]);

    if (onSave) {
      await onSave(selected);
    }

    setIsSaving(false);

    // Show success briefly then close
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
        padding: '1.5rem',
        overflowY: 'auto',
        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          maxWidth: '550px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'scaleIn 0.3s ease-out',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
            padding: '2rem',
            color: 'white',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {t.title}
          </div>
          <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            {t.subtitle}
            {dreamTitle && `: "${dreamTitle}"`}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.2rem',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {/* Select All / Deselect All */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={selectAll}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #7FB069',
                borderRadius: '12px',
                background: 'white',
                color: '#7FB069',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {t.selectAll}
            </button>
            <button
              onClick={deselectAll}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: 'white',
                color: '#6b7280',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {t.deselectAll}
            </button>
          </div>

          {/* Affirmations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {affirmations.map((affirmation, index) => {
              const isSelected = selectedIndices.includes(index);

              return (
                <div
                  key={index}
                  onClick={() => toggleSelection(index)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: `2px solid ${isSelected ? '#7FB069' : '#e5e7eb'}`,
                    background: isSelected ? '#f0f9f0' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Checkbox */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? '#7FB069' : '#d1d5db'}`,
                        background: isSelected ? '#7FB069' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        marginTop: '2px'
                      }}
                    >
                      {isSelected && (
                        <span style={{ color: 'white', fontSize: '0.9rem' }}>✓</span>
                      )}
                    </div>

                    {/* Affirmation Text */}
                    <div
                      style={{
                        flex: 1,
                        fontSize: '1.05rem',
                        lineHeight: 1.6,
                        color: isSelected ? '#2d3748' : '#4a5568'
                      }}
                    >
                      {affirmation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: '#f3f4f6',
                color: '#6b7280',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              {t.skip}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 2,
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: isSaving
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSaving ? 'none' : '0 4px 12px rgba(127, 176, 105, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.3)';
                }
              }}
            >
              {isSaving ? t.saved : `${t.save} (${selectedIndices.length})`}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
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
