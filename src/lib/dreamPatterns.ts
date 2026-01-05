/**
 * Dream Pattern Detection Utility
 * Detects recurring patterns in user's dreams
 */

export interface DreamPattern {
  type: 'keyword' | 'emotion' | 'symbol';
  value: string;
  count: number;
  firstSeen: string; // date
  lastSeen: string; // date
  dreamIds: string[];
}

export interface PatternInsight {
  pattern: DreamPattern;
  message: string;
  severity: 'info' | 'warning' | 'insight';
}

interface DreamEntry {
  id: string;
  text: string;
  date: string;
  tags?: string[];
  autoTags?: string[];
}

const PATTERN_THRESHOLD = 3; // Notify after 3 occurrences
const RECENT_DREAMS_WINDOW = 10; // Look at last 10 dreams

/**
 * Extract patterns from dreams
 */
export function detectPatterns(dreams: DreamEntry[]): DreamPattern[] {
  if (dreams.length < PATTERN_THRESHOLD) return [];

  const recentDreams = dreams.slice(0, RECENT_DREAMS_WINDOW);
  const patternMap = new Map<string, DreamPattern>();

  recentDreams.forEach((dream) => {
    const allTags = [...(dream.autoTags || []), ...(dream.tags || [])];

    allTags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      if (!normalizedTag || normalizedTag.length < 2) return;

      const patternKey = normalizedTag;
      const existing = patternMap.get(patternKey);

      if (existing) {
        existing.count++;
        existing.lastSeen = dream.date;
        existing.dreamIds.push(dream.id);
      } else {
        patternMap.set(patternKey, {
          type: categorizeTag(tag),
          value: tag,
          count: 1,
          firstSeen: dream.date,
          lastSeen: dream.date,
          dreamIds: [dream.id]
        });
      }
    });
  });

  // Filter patterns that meet threshold
  return Array.from(patternMap.values())
    .filter(p => p.count >= PATTERN_THRESHOLD)
    .sort((a, b) => b.count - a.count);
}

/**
 * Categorize tag into pattern type
 */
function categorizeTag(tag: string): 'keyword' | 'emotion' | 'symbol' {
  const tagLower = tag.toLowerCase();

  // Emotion keywords
  const emotions = [
    'anxious', 'anxiety', 'fear', 'scared', 'nervous',
    'happy', 'joyful', 'peaceful', 'calm', 'serene',
    'sad', 'sadness', 'angry', 'frustrated', 'confused',
    'excited', 'hopeful', 'lonely', 'nostalgic'
  ];

  if (emotions.some(e => tagLower.includes(e))) {
    return 'emotion';
  }

  // Common symbols
  const symbols = [
    'water', 'ocean', 'sea', 'river', 'rain',
    'fire', 'flame', 'house', 'home', 'family',
    'death', 'flying', 'falling', 'chase', 'travel',
    'animal', 'cat', 'dog', 'bird', 'snake'
  ];

  if (symbols.some(s => tagLower.includes(s))) {
    return 'symbol';
  }

  return 'keyword';
}

/**
 * Generate insights from patterns
 */
export function generateInsights(
  patterns: DreamPattern[],
  language: 'en' | 'ko' = 'ko'
): PatternInsight[] {
  const insights: PatternInsight[] = [];

  patterns.forEach((pattern) => {
    let message = '';
    let severity: 'info' | 'warning' | 'insight' = 'info';

    if (pattern.type === 'emotion') {
      const emotionLower = pattern.value.toLowerCase();

      if (emotionLower.includes('anxious') || emotionLower.includes('fear') || emotionLower.includes('scared')) {
        severity = 'warning';
        message = language === 'ko'
          ? `최근 ${pattern.count}개의 꿈에서 "${pattern.value}" 감정이 반복되고 있어요. 스트레스 관리에 신경 쓰시는 것이 좋을 것 같아요.`
          : `"${pattern.value}" emotion appeared in ${pattern.count} recent dreams. Consider stress management.`;
      } else if (emotionLower.includes('happy') || emotionLower.includes('joy') || emotionLower.includes('peaceful')) {
        severity = 'insight';
        message = language === 'ko'
          ? `최근 ${pattern.count}개의 꿈에서 "${pattern.value}" 감정이 나타났어요. 긍정적인 마음 상태가 꿈에 반영되고 있네요!`
          : `"${pattern.value}" emotion appeared in ${pattern.count} dreams. Your positive mindset is reflecting in dreams!`;
      } else {
        message = language === 'ko'
          ? `"${pattern.value}" 감정이 ${pattern.count}번 반복되었어요.`
          : `"${pattern.value}" emotion repeated ${pattern.count} times.`;
      }
    } else if (pattern.type === 'symbol') {
      severity = 'insight';
      message = language === 'ko'
        ? `"${pattern.value}" 상징이 최근 ${pattern.count}개의 꿈에 등장했어요. 이 상징이 당신에게 특별한 의미가 있을 수 있어요.`
        : `"${pattern.value}" symbol appeared in ${pattern.count} recent dreams. This might have special meaning for you.`;
    } else {
      message = language === 'ko'
        ? `"${pattern.value}"가 ${pattern.count}개의 꿈에서 반복되었어요.`
        : `"${pattern.value}" repeated in ${pattern.count} dreams.`;
    }

    insights.push({
      pattern,
      message,
      severity
    });
  });

  return insights;
}

/**
 * Check if pattern notification was already shown
 */
export function wasPatternShown(patternKey: string): boolean {
  try {
    const shown = localStorage.getItem('dream_patterns_shown');
    if (!shown) return false;

    const shownPatterns: { [key: string]: number } = JSON.parse(shown);
    const lastShown = shownPatterns[patternKey];

    if (!lastShown) return false;

    // Show again if more than 7 days passed
    const daysSinceShown = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
    return daysSinceShown < 7;
  } catch {
    return false;
  }
}

/**
 * Mark pattern as shown
 */
export function markPatternAsShown(patternKey: string): void {
  try {
    const shown = localStorage.getItem('dream_patterns_shown');
    const shownPatterns: { [key: string]: number } = shown ? JSON.parse(shown) : {};

    shownPatterns[patternKey] = Date.now();
    localStorage.setItem('dream_patterns_shown', JSON.stringify(shownPatterns));
  } catch (error) {
    console.error('Error marking pattern as shown:', error);
  }
}

/**
 * Get new insights (not shown before)
 */
export function getNewInsights(
  dreams: DreamEntry[],
  language: 'en' | 'ko' = 'ko'
): PatternInsight[] {
  const patterns = detectPatterns(dreams);
  const insights = generateInsights(patterns, language);

  return insights.filter((insight) => {
    const patternKey = `${insight.pattern.type}_${insight.pattern.value}_${insight.pattern.count}`;
    return !wasPatternShown(patternKey);
  });
}
