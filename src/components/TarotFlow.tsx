'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Emotion,
  TarotCard,
  pickRandomCardByEmotion,
  DREAM_KEYWORDS,
  EMOTION_CONFIG,
} from '../data/tarotCards';

type Stage = 'emotion' | 'blind-card' | 'keywords' | 'card-reveal';

interface TarotFlowProps {
  language: 'en' | 'ko';
  onClose: () => void;
  onSave?: (data: {
    emotion: Emotion;
    card: TarotCard;
    dreamKeywords: string[];
    insight: string;
    affirmation: string;
    dreamAnalysis: string;
    emotionColor: string;
    emotionEmoji: string;
  }) => void;
}

export default function TarotFlow({ language, onClose, onSave }: TarotFlowProps) {
  const [stage, setStage] = useState<Stage>('emotion');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [currentCard, setCurrentCard] = useState<TarotCard | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [dreamInputMode, setDreamInputMode] = useState<'keywords' | 'text'>('keywords');
  const [dreamFreeText, setDreamFreeText] = useState('');
  const [kwStep, setKwStep] = useState(0);
  const [customKeyword, setCustomKeyword] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customKwsByStep, setCustomKwsByStep] = useState<Record<number, string[]>>({});
  const [insight, setInsight] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [dreamAnalysis, setDreamAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [emotionVisible, setEmotionVisible] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isKo = language === 'ko';

  useEffect(() => {
    // Trigger emotion bubbles animation after mount
    setTimeout(() => setEmotionVisible(true), 100);
  }, []);

  const handleSelectEmotion = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    const card = pickRandomCardByEmotion(emotion);
    setCurrentCard(card);
    setEmotionVisible(false);
    setTimeout(() => setStage('blind-card'), 400);
  };

  const handleProceedToKeywords = () => {
    setStage('keywords');
  };

  const handleSkipToReveal = async () => {
    await fetchInsight([]);
  };

  const handleKeywordToggle = (kw: string) => {
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    );
  };

  const handleAddCustomKeyword = () => {
    const trimmed = customKeyword.trim();
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      setSelectedKeywords(prev => [...prev, trimmed]);
      setCustomKwsByStep(prev => ({
        ...prev,
        [kwStep]: [...(prev[kwStep] ?? []), trimmed],
      }));
    }
    setCustomKeyword('');
    setShowCustomInput(false);
  };

  const handleRevealCard = async () => {
    const freeText = dreamInputMode === 'text' ? dreamFreeText : '';
    // keywords also trigger long analysis by joining them as context
    const effectiveDreamText = freeText || (selectedKeywords.length > 0 ? selectedKeywords.join(', ') : '');
    await fetchInsight(selectedKeywords, effectiveDreamText);
  };

  const fetchInsight = async (keywords: string[], freeText = '') => {
    if (!currentCard || !selectedEmotion) return;
    setIsLoading(true);
    setStage('card-reveal');
    setDreamAnalysis('');

    const dreamContent = freeText || (keywords.length > 0 ? keywords.join(', ') : '');

    try {
      const emotionCfg = EMOTION_CONFIG[selectedEmotion];

      // Enrich keyword-only inputs with emotion context so analyze-dream gets enough text
      const emotionLabel = isKo ? emotionCfg.labelKo : emotionCfg.labelEn;
      const enrichedDreamText = dreamContent
        ? (isKo
            ? `감정: ${emotionLabel}. 꿈의 단편: ${dreamContent}`
            : `Emotion: ${emotionLabel}. Dream fragments: ${dreamContent}`)
        : null;

      const [tarotData, analysisData] = await Promise.all([
        fetch('/api/tarot-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emotion: selectedEmotion,
            emotionLabel,
            cardNameKo: currentCard.nameKo,
            cardNameEn: currentCard.nameEn,
            cardArcana: currentCard.arcana,
            cardThemes: currentCard.themeKeywords,
            dreamKeywords: keywords,
            dreamText: dreamContent || undefined,
            language,
          }),
        }).then(r => r.json()),
        enrichedDreamText
          ? fetch('/api/analyze-dream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dreamText: enrichedDreamText, language, isPremium: false }),
            }).then(r => r.json())
          : Promise.resolve(null),
      ]);

      setInsight(tarotData.insight ?? (isKo ? currentCard.lightMessageKo : currentCard.lightMessageEn));
      setAffirmation(tarotData.affirmation ?? '');
      if (analysisData?.analysis) setDreamAnalysis(analysisData.analysis);
    } catch {
      setInsight(isKo ? currentCard.lightMessageKo : currentCard.lightMessageEn);
      setAffirmation('');
    } finally {
      setIsLoading(false);
      setTimeout(() => setCardFlipped(true), 300);
    }
  };

  const toggleVoice = () => {
    if (isRecordingVoice) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = isKo ? 'ko-KR' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setDreamFreeText(prev => prev ? prev + ' ' + text : text);
    };
    rec.onend = () => setIsRecordingVoice(false);
    rec.onerror = () => setIsRecordingVoice(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecordingVoice(true);
  };

  const handleSave = () => {
    if (!currentCard || !selectedEmotion) return;
    const allKeywords = dreamInputMode === 'text' && dreamFreeText.trim()
      ? [dreamFreeText.trim()]
      : selectedKeywords;
    onSave?.({
      emotion: selectedEmotion,
      card: currentCard,
      dreamKeywords: allKeywords,
      insight,
      affirmation,
      dreamAnalysis,
      emotionColor: EMOTION_CONFIG[selectedEmotion].color,
      emotionEmoji: EMOTION_CONFIG[selectedEmotion].emoji,
    });
    onClose();
  };

  const keywordCategories = isKo ? DREAM_KEYWORDS.ko : DREAM_KEYWORDS.en;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.container}>
        {/* Close button */}
        <button style={styles.closeBtn} onClick={onClose}>✕</button>

        {/* ===== STAGE: EMOTION SELECTION ===== */}
        {stage === 'emotion' && (
          <div style={styles.stageWrapper}>
            <p style={styles.stageHint}>
              {isKo ? '오늘 아침, 감정이 어떤가요?' : 'How are you feeling this morning?'}
            </p>

            <div style={styles.emotionGrid}>
              {(Object.entries(EMOTION_CONFIG) as [Emotion, typeof EMOTION_CONFIG[Emotion]][]).map(
                ([key, cfg], i) => (
                  <button
                    key={key}
                    style={{
                      ...styles.emotionBtn,
                      backgroundColor: cfg.color + '55',
                      border: `2px solid ${cfg.color}`,
                      transform: emotionVisible ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(20px)',
                      opacity: emotionVisible ? 1 : 0,
                      transitionDelay: `${i * 80}ms`,
                    }}
                    onClick={() => handleSelectEmotion(key)}
                  >
                    <span style={styles.emotionLabel}>
                      {isKo ? cfg.labelKo : cfg.labelEn}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* ===== STAGE: BLIND CARD ===== */}
        {stage === 'blind-card' && currentCard && selectedEmotion && (
          <div style={styles.stageWrapper}>
            <p style={styles.arcanaLabel}>{currentCard.arcana}</p>

            {/* Blurred card */}
            <div style={styles.blindCardWrapper}>
              <div style={styles.blindCard}>
                <div style={styles.blindCardInner}>
                  <div style={styles.cardPattern} />
                  <div style={styles.lockOverlay}>
                    <span style={styles.lockIcon}>🔒</span>
                  </div>
                </div>
              </div>
              <p style={styles.blindCardName}>{'? ? ?'}</p>
            </div>

            <p style={styles.blindMessage}>
              {isKo
                ? `당신의 '${EMOTION_CONFIG[selectedEmotion].labelKo}'함 이면에 숨겨진\n무의식의 패턴이 감지되었습니다.`
                : `An unconscious pattern hidden beneath\nyour '${EMOTION_CONFIG[selectedEmotion].labelEn}' state has been detected.`}
            </p>

            <div style={styles.btnRow}>
              <button style={styles.primaryBtn} onClick={handleProceedToKeywords}>
                {isKo ? '꿈의 조각 기록하기' : 'Record dream fragments'}
              </button>
              <button style={styles.ghostBtn} onClick={handleSkipToReveal}>
                {isKo ? '그냥 카드만 볼게요' : 'Just show me the card'}
              </button>
            </div>
          </div>
        )}

        {/* ===== STAGE: DREAM KEYWORDS ===== */}
        {stage === 'keywords' && (() => {
          const catEntries = Object.entries(keywordCategories) as [string, readonly string[]][];
          const totalSteps = catEntries.length;
          const [catName, catWords] = catEntries[kwStep] ?? ['', []];
          // only show custom keywords added on THIS specific step
          const customKwsThisStep = customKwsByStep[kwStep] ?? [];

          const goNext = () => {
            const trimmed = customKeyword.trim();
            if (showCustomInput && trimmed && !selectedKeywords.includes(trimmed)) {
              setSelectedKeywords(prev => [...prev, trimmed]);
              setCustomKwsByStep(prev => ({
                ...prev,
                [kwStep]: [...(prev[kwStep] ?? []), trimmed],
              }));
            }
            setShowCustomInput(false);
            setCustomKeyword('');
            setKwStep(s => s + 1);
          };
          const goPrev = () => {
            const trimmed = customKeyword.trim();
            if (showCustomInput && trimmed && !selectedKeywords.includes(trimmed)) {
              setSelectedKeywords(prev => [...prev, trimmed]);
              setCustomKwsByStep(prev => ({
                ...prev,
                [kwStep]: [...(prev[kwStep] ?? []), trimmed],
              }));
            }
            setShowCustomInput(false);
            setCustomKeyword('');
            setKwStep(s => s - 1);
          };
          const isLastStep = kwStep === totalSteps - 1;

          return (
            <div style={styles.stageWrapper}>
              {/* Tab toggle */}
              <div style={styles.tabRow}>
                <button
                  style={{ ...styles.tabBtn, ...(dreamInputMode === 'keywords' ? styles.tabBtnActive : {}) }}
                  onClick={() => setDreamInputMode('keywords')}
                >
                  {isKo ? '키워드 선택' : 'Keywords'}
                </button>
                <button
                  style={{ ...styles.tabBtn, ...(dreamInputMode === 'text' ? styles.tabBtnActive : {}) }}
                  onClick={() => setDreamInputMode('text')}
                >
                  {isKo ? '직접 입력' : 'Write freely'}
                </button>
              </div>

              {dreamInputMode === 'text' ? (
                <>
                  <p style={styles.stageHint}>
                    {isKo ? '꿈에서 기억나는 것들을 자유롭게 써보세요' : 'Write whatever you remember from your dream'}
                  </p>
                  <textarea
                    style={styles.dreamTextarea}
                    value={dreamFreeText}
                    onChange={e => setDreamFreeText(e.target.value)}
                    placeholder={isKo
                      ? '어디에 있었는지, 무엇을 봤는지, 어떤 감정이었는지...'
                      : 'Where were you, what did you see, how did it feel...'}
                    rows={6}
                  />
                  <div style={styles.btnRow}>
                    {/* Voice button */}
                    <button style={styles.voiceBtn} onClick={toggleVoice}>
                      <span style={{ ...styles.voiceDot, background: isRecordingVoice ? '#e53e3e' : '#ccc', boxShadow: isRecordingVoice ? '0 0 0 4px rgba(229,62,62,0.25)' : 'none' }} />
                      <span style={{ fontSize: 12, color: isRecordingVoice ? '#e53e3e' : '#8ba390' }}>
                        {isRecordingVoice ? (isKo ? '녹음 중...' : 'Recording...') : (isKo ? '음성 입력' : 'Voice')}
                      </span>
                    </button>
                    <button
                      style={{ ...styles.primaryBtn, opacity: dreamFreeText.trim().length < 10 ? 0.5 : 1 }}
                      onClick={handleRevealCard}
                      disabled={dreamFreeText.trim().length < 10}
                    >
                      Brew
                    </button>
                    <button style={styles.ghostBtn} onClick={handleSkipToReveal}>
                      {isKo ? '건너뛰기' : 'Skip'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step dots */}
                  <div style={styles.stepDots}>
                    {catEntries.map((_, i) => (
                      <div key={i} style={{ ...styles.stepDot, ...(i === kwStep ? styles.stepDotActive : {}) }} />
                    ))}
                  </div>

                  {/* Category title */}
                  <p style={styles.stageTitle}>{catName}</p>
                  <p style={styles.stageHint}>
                    {isKo ? '기억나는 것을 골라보세요' : 'Pick what you remember'}
                  </p>

                  {/* Chips + custom inline */}
                  <div style={styles.kwChips}>
                    {catWords.map(kw => (
                      <button
                        key={kw}
                        style={{
                          ...styles.kwChip,
                          backgroundColor: selectedKeywords.includes(kw) ? 'rgba(74,124,89,0.18)' : 'rgba(255,255,255,0.7)',
                          color: selectedKeywords.includes(kw) ? '#2d5a38' : '#4a5d4e',
                          border: selectedKeywords.includes(kw) ? '2px solid rgba(74,124,89,0.55)' : '2px solid rgba(74,124,89,0.3)',
                          fontWeight: selectedKeywords.includes(kw) ? 700 : 600,
                        }}
                        onClick={() => handleKeywordToggle(kw)}
                      >
                        {kw}
                      </button>
                    ))}
                    {/* Custom keywords — only show on the step they were added */}
                    {customKwsThisStep.map(kw => (
                      <button
                        key={kw}
                        style={{
                          ...styles.kwChip,
                          backgroundColor: selectedKeywords.includes(kw) ? 'rgba(74,124,89,0.18)' : 'rgba(255,255,255,0.7)',
                          color: selectedKeywords.includes(kw) ? '#2d5a38' : '#4a5d4e',
                          border: selectedKeywords.includes(kw) ? '2px solid rgba(74,124,89,0.55)' : '2px solid rgba(74,124,89,0.3)',
                          fontWeight: selectedKeywords.includes(kw) ? 700 : 600,
                        }}
                        onClick={() => handleKeywordToggle(kw)}
                      >
                        {kw} ✕
                      </button>
                    ))}
                    {/* + chip or inline input */}
                    {showCustomInput ? (
                      <div style={styles.customInputRow}>
                        <input
                          style={styles.customInput}
                          value={customKeyword}
                          onChange={e => setCustomKeyword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddCustomKeyword()}
                          placeholder={isKo ? '입력...' : 'Type...'}
                          autoFocus
                        />
                        <button style={styles.customAddBtn} onClick={handleAddCustomKeyword}>
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{ ...styles.kwChip, backgroundColor: 'rgba(255,255,255,0.7)', color: '#4a5d4e', border: '2px solid rgba(74,124,89,0.3)' }}
                        onClick={() => setShowCustomInput(true)}
                      >
                        {isKo ? '기타' : 'Other'}
                      </button>
                    )}
                  </div>

                  {/* Navigation */}
                  <div style={styles.stepNavRow}>
                    <button
                      style={{ ...styles.simpleArrow, opacity: kwStep === 0 ? 0 : 1, pointerEvents: kwStep === 0 ? 'none' : 'auto' }}
                      onClick={goPrev}
                    >
                      {'<'}
                    </button>

                    {isLastStep ? (
                      <button style={styles.brewBtn} onClick={handleRevealCard}>
                        Brew
                      </button>
                    ) : (
                      <button style={styles.simpleArrow} onClick={goNext}>{'>'}</button>
                    )}
                  </div>

                  <button style={styles.ghostBtn} onClick={handleSkipToReveal}>
                    {isKo ? '건너뛰기' : 'Skip'}
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* ===== STAGE: CARD REVEAL ===== */}
        {stage === 'card-reveal' && currentCard && selectedEmotion && (
          <div style={styles.stageWrapper}>
            {isLoading ? (
              /* Loading — centered, no card visible */
              <div style={styles.loadingCenter}>
                <div style={styles.loadingRow}>
                  <div style={styles.loadingDot} />
                  <div style={{ ...styles.loadingDot, animationDelay: '0.2s' }} />
                  <div style={{ ...styles.loadingDot, animationDelay: '0.4s' }} />
                </div>
              </div>
            ) : (
              <>
            {/* Card flip animation */}
            <div style={styles.revealCardWrapper}>
              <div style={{ ...styles.flipCard, transform: cardFlipped ? 'rotateY(0deg)' : 'rotateY(90deg)' }}>
                <div style={styles.revealCardFace}>
                  <div style={styles.cardArtPlaceholder}>
                    <span style={styles.cardArtEmoji}>
                      {EMOTION_CONFIG[selectedEmotion].emoji}
                    </span>
                  </div>
                  <div style={styles.cardFooter}>
                    <p style={styles.revealArcana}>{currentCard.arcana}</p>
                    <p style={styles.revealCardName}>
                      {isKo ? currentCard.nameKo : currentCard.nameEn}
                    </p>
                  </div>
                </div>
              </div>
            </div>
              <div style={{ opacity: cardFlipped ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>
                {selectedKeywords.length > 0 && (
                  <div style={styles.keywordTags}>
                    {selectedKeywords.slice(0, 5).map(kw => (
                      <span key={kw} style={styles.keywordTag}>{kw}</span>
                    ))}
                  </div>
                )}

                {/* Dream analysis — full Jungian interpretation */}
                {dreamAnalysis && (
                  <div style={styles.dreamAnalysisBox}>
                    <p style={styles.dreamAnalysisLabel}>
                      {isKo ? '꿈 해석' : 'Dream Reading'}
                    </p>
                    <p style={styles.dreamAnalysisText}>{dreamAnalysis}</p>
                  </div>
                )}

                {/* Tarot card insight */}
                <div style={dreamAnalysis ? styles.cardInsightBox : {}}>
                  {dreamAnalysis && (
                    <p style={styles.cardInsightLabel}>
                      {isKo ? `${currentCard?.nameKo} 카드의 메시지` : `${currentCard?.nameEn} — Card Message`}
                    </p>
                  )}
                  <p style={styles.insightText}>{insight}</p>
                </div>

                {affirmation && (
                  <div style={styles.affirmationBox}>
                    <p style={styles.affirmationLabel}>
                      {isKo ? '오늘의 확언' : "Today's Affirmation"}
                    </p>
                    <p style={styles.affirmationText}>{affirmation}</p>
                  </div>
                )}

                <button style={styles.saveBtn} onClick={handleSave}>
                  {isKo ? '저장하기' : 'Save this reading'}
                </button>
              </div>
            </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes matchaWhisk {
          0%   { transform: rotate(-20deg) scale(1); }
          25%  { transform: rotate(20deg) scale(1.05); }
          50%  { transform: rotate(-15deg) scale(1); }
          75%  { transform: rotate(18deg) scale(1.05); }
          100% { transform: rotate(-20deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88dvh',
    background: 'linear-gradient(160deg, #f0f7f1 0%, #e8f5e8 100%)',
    borderRadius: '28px',
    padding: '24px 20px 32px',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    background: 'rgba(74,93,78,0.12)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    fontSize: 16,
    color: '#4a5d4e',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
    minHeight: 300,
  },
  stageTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#2d4a35',
    margin: 0,
    textAlign: 'center',
  },
  stageHint: {
    fontSize: 14,
    color: '#6b8a70',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  emotionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  emotionBtn: {
    padding: '20px 12px',
    borderRadius: 20,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
  },
  emotionLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#2d4a35',
  },
  tabRow: {
    display: 'flex',
    gap: 0,
    background: 'rgba(74,124,89,0.1)',
    borderRadius: 14,
    padding: 3,
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    padding: '9px 0',
    border: 'none',
    borderRadius: 11,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    color: '#6b8a70',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    background: 'white',
    color: '#2d4a35',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  dreamTextarea: {
    width: '100%',
    padding: '14px',
    borderRadius: 16,
    border: '2px solid rgba(74,124,89,0.25)',
    fontSize: 14,
    lineHeight: 1.7,
    color: '#2d4a35',
    background: 'rgba(255,255,255,0.8)',
    resize: 'none' as const,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  arcanaLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#8ba390',
    fontFamily: 'monospace',
    margin: 0,
  },
  blindCardWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  blindCard: {
    width: 140,
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    filter: 'blur(6px)',
  },
  blindCardInner: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #b5dab9 0%, #7fb888 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
    backgroundSize: '14px 14px',
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.12)',
  },
  lockIcon: {
    fontSize: 40,
    filter: 'blur(0)',
  },
  blindCardName: {
    fontSize: 14,
    color: '#8ba390',
    letterSpacing: 6,
    margin: 0,
  },
  blindMessage: {
    fontSize: 14,
    color: '#4a5d4e',
    textAlign: 'center',
    lineHeight: 1.7,
    whiteSpace: 'pre-line',
    padding: '0 8px',
    margin: 0,
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  primaryBtn: {
    width: '100%',
    padding: '16px',
    background: '#4a7c59',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  ghostBtn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#8ba390',
    border: 'none',
    borderRadius: 16,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  stepDots: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(74,124,89,0.2)',
    transition: 'all 0.2s ease',
  },
  stepDotActive: {
    background: '#4a7c59',
    width: 18,
    borderRadius: 3,
  },
  stepNavRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  stepCount: {
    fontSize: 12,
    color: '#8ba390',
  },
  stepCountBadge: {
    background: 'rgba(74,124,89,0.12)',
    color: '#4a7c59',
    padding: '4px 10px',
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 12,
  },
  simpleArrow: {
    background: 'none',
    border: 'none',
    color: '#4a7c59',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '8px 14px',
    lineHeight: 1,
  },
  brewBtn: {
    background: '#4a7c59',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    padding: '10px 22px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  voiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    alignSelf: 'center',
  },
  voiceDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
    transition: 'all 0.2s ease',
  },
  kwCategory: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  kwCategoryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#8ba390',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    margin: 0,
  },
  kwChips: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    width: '100%',
  },
  kwChip: {
    padding: '12px 8px',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    textAlign: 'center' as const,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    gridColumn: '1 / -1',
  },
  customInput: {
    padding: '7px 12px',
    borderRadius: 20,
    border: '2px solid rgba(74,124,89,0.4)',
    fontSize: 13,
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    color: '#2d4a35',
    width: 130,
  },
  customAddBtn: {
    padding: '7px 14px',
    borderRadius: 20,
    border: 'none',
    background: '#4a7c59',
    color: 'white',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 600,
  },
  revealCardWrapper: {
    perspective: 1000,
  },
  flipCard: {
    width: 160,
    height: 250,
    transition: 'transform 0.6s ease',
    transformStyle: 'preserve-3d',
  },
  revealCardFace: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #c8e6cc 0%, #a8d4ac 100%)',
  },
  cardArtPlaceholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #d4eadc 0%, #b5dab9 100%)',
  },
  cardArtEmoji: {
    fontSize: 64,
    opacity: 0.7,
  },
  cardFooter: {
    padding: '10px 12px 14px',
    background: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(4px)',
    textAlign: 'center',
  },
  revealArcana: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#6b8a70',
    fontFamily: 'monospace',
    margin: '0 0 2px',
  },
  revealCardName: {
    fontSize: 15,
    fontWeight: 800,
    color: '#2d4a35',
    margin: 0,
  },
  loadingCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 200,
  },
  loadingRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  loadingHint: {
    fontSize: 13,
    color: '#8ba390',
    margin: 0,
    letterSpacing: 0.3,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#4a7c59',
    animation: 'dotPulse 1.4s ease-in-out infinite',
  },
  matchaWhisk: {
    width: 72,
    height: 72,
    animation: 'matchaWhisk 1.0s ease-in-out infinite',
    transformOrigin: 'center bottom',
  },
  loadingText: {
    fontSize: 13,
    color: '#8ba390',
    fontStyle: 'italic' as const,
    margin: 0,
    letterSpacing: 0.5,
  },
  keywordTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 4,
  },
  keywordTag: {
    fontSize: 11,
    padding: '3px 10px',
    background: 'rgba(74,124,89,0.15)',
    color: '#4a7c59',
    borderRadius: 12,
    fontWeight: 600,
  },
  dreamAnalysisBox: {
    background: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: '14px 16px',
    marginBottom: 12,
    border: '1px solid rgba(74,124,89,0.15)',
  },
  dreamAnalysisLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#8ba390',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
  },
  dreamAnalysisText: {
    fontSize: 13,
    color: '#3a5240',
    lineHeight: 1.8,
    margin: 0,
    whiteSpace: 'pre-line' as const,
  },
  cardInsightBox: {
    background: 'rgba(74,124,89,0.06)',
    borderRadius: 16,
    padding: '12px 14px',
    marginBottom: 12,
    border: '1px solid rgba(74,124,89,0.2)',
  },
  cardInsightLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#4a7c59',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    margin: '0 0 6px',
  },
  insightText: {
    fontSize: 15,
    color: '#2d4a35',
    lineHeight: 1.8,
    textAlign: 'center',
    padding: '0 4px',
    margin: '8px 0 16px',
  },
  affirmationBox: {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(4px)',
    borderRadius: 16,
    padding: '14px 16px',
    marginBottom: 20,
    textAlign: 'center',
    border: '1px solid rgba(74,124,89,0.2)',
  },
  affirmationLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#8ba390',
    fontWeight: 700,
    textTransform: 'uppercase',
    margin: '0 0 6px',
  },
  affirmationText: {
    fontSize: 14,
    color: '#2d4a35',
    fontStyle: 'italic',
    lineHeight: 1.6,
    margin: 0,
  },
  saveBtn: {
    width: '100%',
    padding: '16px',
    background: '#4a7c59',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
