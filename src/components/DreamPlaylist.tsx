'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Dream } from '../lib/supabase';
import { generateAffirmationsFromDream } from '../lib/affirmations';

interface DreamPlaylistProps {
  dreams: Dream[];
  userId: string;
  language: 'en' | 'ko';
}

export default function DreamPlaylist({
  dreams,
  userId,
  language
}: DreamPlaylistProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [isLoadingAffirmations, setIsLoadingAffirmations] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Sort dreams by date (newest first)
  const sortedDreams = useMemo(() => {
    return [...dreams].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [dreams]);

  // Get current active dream
  const activeDream = sortedDreams[activeCardIndex];

  // Load affirmations for active dream
  useEffect(() => {
    const loadAffirmations = async () => {
      if (!activeDream || !userId) return;

      setIsLoadingAffirmations(true);
      try {
        // Generate affirmations from the active dream
        const dreamText = activeDream.content || activeDream.title || '';

        if (!dreamText) {
          setAffirmations([]);
          return;
        }

        // Generate new affirmations
        const generated = await generateAffirmationsFromDream(
          userId,
          dreamText,
          language
        );

        if (generated.length > 0) {
          setAffirmations(generated);
          setCurrentAffirmationIndex(0);
        } else {
          setAffirmations([]);
        }
      } catch (error) {
        console.error('Error loading affirmations:', error);
        setAffirmations([]);
      } finally {
        setIsLoadingAffirmations(false);
      }
    };

    loadAffirmations();
  }, [activeDream, userId, language]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveCardIndex((prev) =>
          prev === 0 ? sortedDreams.length - 1 : prev - 1
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveCardIndex((prev) =>
          prev === sortedDreams.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedDreams.length]);

  // Handle scroll to center active card
  useEffect(() => {
    if (carouselRef.current && activeCardIndex >= 0) {
      const cards = carouselRef.current.querySelectorAll('.dream-entry');
      const activeCard = cards[activeCardIndex] as HTMLElement;

      if (activeCard) {
        // Scroll to center the active card
        const containerWidth = carouselRef.current.clientWidth;
        const cardWidth = activeCard.clientWidth;
        const cardLeft = activeCard.offsetLeft;

        const scrollPosition = cardLeft - (containerWidth / 2 - cardWidth / 2);

        carouselRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [activeCardIndex]);

  const handleCardClick = (dream: Dream) => {
    setSelectedDream(dream);
    setShowDetailModal(true);
  };

  const handleNextAffirmation = () => {
    if (affirmations.length > 0) {
      setCurrentAffirmationIndex((prev) => (prev + 1) % affirmations.length);
    }
  };

  const handlePrevAffirmation = () => {
    if (affirmations.length > 0) {
      setCurrentAffirmationIndex((prev) =>
        prev === 0 ? affirmations.length - 1 : prev - 1
      );
    }
  };

  const translations = {
    en: {
      dreamPlaylist: 'Dream Playlist',
      noAffirmation: 'No affirmation available',
      noDreams: 'No dreams recorded yet',
      description: 'Description',
      mood: 'Mood',
      tags: 'Tags',
      date: 'Date'
    },
    ko: {
      dreamPlaylist: '드림 플레이리스트',
      noAffirmation: '사용 가능한 확언이 없습니다',
      noDreams: '아직 기록된 꿈이 없습니다',
      description: '설명',
      mood: '기분',
      tags: '태그',
      date: '날짜'
    }
  };

  const t = translations[language];

  if (sortedDreams.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'rgba(0, 0, 0, 0.5)'
      }}>
        <p>{t.noDreams}</p>
      </div>
    );
  }

  const currentAffirmation = affirmations[currentAffirmationIndex];

  return (
    <div style={{ width: '100%' }}>
      {/* Affirmations Section */}
      {affirmations.length > 0 && (
        <div style={{
          marginBottom: '32px',
          padding: '20px',
          background: 'rgba(127, 176, 105, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(127, 176, 105, 0.2)'
        }}>
          {isLoadingAffirmations ? (
            <p style={{ color: 'rgba(0, 0, 0, 0.5)', margin: 0, textAlign: 'center' }}>
              {language === 'ko' ? '확언을 생성 중입니다...' : 'Generating affirmations...'}
            </p>
          ) : currentAffirmation ? (
            <>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#7FB069',
                lineHeight: 1.5,
                textAlign: 'center'
              }}>
                "{currentAffirmation}"
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px'
              }}>
                {affirmations.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevAffirmation}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(127, 176, 105, 0.2)',
                        color: '#7FB069',
                        border: '1px solid rgba(127, 176, 105, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
                      }}
                    >
                      ←
                    </button>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'rgba(0, 0, 0, 0.4)',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {currentAffirmationIndex + 1} / {affirmations.length}
                    </span>
                    <button
                      onClick={handleNextAffirmation}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(127, 176, 105, 0.2)',
                        color: '#7FB069',
                        border: '1px solid rgba(127, 176, 105, 0.3)',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(127, 176, 105, 0.2)';
                      }}
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: 'rgba(0, 0, 0, 0.5)', margin: 0, textAlign: 'center' }}>
              {t.noAffirmation}
            </p>
          )}
        </div>
      )}

      {/* Dreams Carousel */}
      <div
        ref={carouselRef}
        className="dreams-grid"
        style={{
          scrollBehavior: 'smooth',
          paddingBottom: '20px'
        }}
      >
        {sortedDreams.map((dream, index) => (
          <div
            key={dream.id}
            className={`dream-entry ${activeCardIndex === index ? 'active' : ''}`}
            onClick={() => handleCardClick(dream)}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (activeCardIndex !== index) {
                el.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (activeCardIndex !== index) {
                el.style.opacity = '0.6';
              }
            }}
          >
            <div style={{
              height: '100%',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(127, 176, 105, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(127, 176, 105, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflow: 'hidden'
            }}>
              {/* Dream Title */}
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--matcha-dark)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {dream.title || 'Untitled Dream'}
              </h3>

              {/* Dream Description Preview */}
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.4
              }}>
                {dream.content || 'No content'}
              </p>

              {/* Mood Badge */}
              {dream.mood && (
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  color: 'rgba(0, 0, 0, 0.5)'
                }}>
                  <span>😊</span>
                  <span>{dream.mood}</span>
                </div>
              )}

              {/* Date */}
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(0, 0, 0, 0.4)',
                marginTop: 'auto'
              }}>
                {new Date(dream.created_at || '').toLocaleDateString(
                  language === 'ko' ? 'ko-KR' : 'en-US',
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDream && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowDetailModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 900
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              zIndex: 901
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(127, 176, 105, 0.1)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7FB069'
              }}
            >
              ✕
            </button>

            {/* Title */}
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--matcha-dark)',
              fontFamily: "'Cormorant', serif"
            }}>
              {selectedDream.title || 'Untitled Dream'}
            </h2>

            {/* Date */}
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.9rem',
              color: 'rgba(0, 0, 0, 0.5)'
            }}>
              {new Date(selectedDream.created_at || '').toLocaleDateString(
                language === 'ko' ? 'ko-KR' : 'en-US',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                }
              )}
            </p>

            {/* Description */}
            {selectedDream.content && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {t.description}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  color: 'rgba(0, 0, 0, 0.7)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedDream.content}
                </p>
              </div>
            )}

            {/* Mood */}
            {selectedDream.mood && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {t.mood}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '1rem',
                  color: '#7FB069'
                }}>
                  {selectedDream.mood}
                </p>
              </div>
            )}

            {/* Tags */}
            {selectedDream.tags && selectedDream.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'rgba(0, 0, 0, 0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {t.tags}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {selectedDream.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(127, 176, 105, 0.1)',
                        color: '#7FB069',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {language === 'en' ? 'Close' : '닫기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
