'use client';

import { useState, useEffect } from 'react';
import { supabase, Dream } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { getUserPlanInfo } from '../lib/subscription';

interface MonthlyReportProps {
  user: User | null;
  language?: 'en' | 'ko';
  onClose?: () => void;
}

type DayType = 'mood' | 'dream' | 'both' | 'none';

interface ActivityDay { day: number; type: DayType; }

interface AiInsights {
  narrativeTitle: string;
  narrativeText: string;
  synthesisTheme: string;
  synthesisDescription: string;
  synthesisQuestion: string;
  deepDive: string;
  lookingAheadTitle: string;
  lookingAheadSuggestion: string;
}

interface ArchetypeCard { name: string; category: string; meaning: string; iconType: 'compass' | 'key'; }

/* ──────────── SVG icons ──────────── */
function IconCalendar({ size = 18, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconX({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconSun({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function IconMoon({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function IconSparkles({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.09 3.36L16.5 7.5l-3.41 1.14L12 12l-1.09-3.36L7.5 7.5l3.41-1.14L12 3z"/><path d="M19 9l.57 1.77L21.34 12l-1.77.73L19 15l-.57-1.77L16.66 12l1.77-.73L19 9z"/><path d="M5 14l.57 1.77L7.34 17l-1.77.73L5 20l-.57-1.77L2.66 17l1.77-.73L5 14z"/></svg>;
}
function IconCompass({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
}
function IconKey({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
}
function IconArrowRight({ size = 14, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}
function IconQuote({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;
}

/* ──────────── Archetype info ──────────── */
const ARCHETYPE_INFO: Record<string, { name: string; koName: string; category: string; koCategory: string; en: string; ko: string; iconType: 'compass' | 'key' }> = {
  hero:      { name: 'The Hero',      koName: '영웅',       category: 'Action',         koCategory: '행동',   en: 'You faced challenges head-on, showing courage and determination in your dreams.',             ko: '이달 꿈에서 도전에 정면으로 맞서며 용기와 결단력을 보여주었습니다.',           iconType: 'compass' },
  sage:      { name: 'The Sage',      koName: '현자',       category: 'Wisdom',         koCategory: '지혜',   en: 'Figures offering knowledge appeared frequently, reflecting a search for deeper understanding.', ko: '지식을 주는 인물이 자주 등장했으며, 깊은 이해를 향한 탐구를 반영합니다.',       iconType: 'key' },
  explorer:  { name: 'The Explorer',  koName: '탐험가',     category: 'Journey',        koCategory: '여정',   en: 'Your dreams were filled with movement and new territories, signaling a desire for growth.',     ko: '꿈에서 이동과 새로운 영역이 가득했으며, 성장에 대한 욕구를 나타냅니다.',        iconType: 'compass' },
  magician:  { name: 'The Magician',  koName: '마법사',     category: 'Transformation', koCategory: '변환',   en: 'Symbols of transformation dominated your dreams, marking a shift in your inner world.',         ko: '변화의 상징이 꿈을 지배하며 내면 세계의 전환을 나타냅니다.',                   iconType: 'key' },
  lover:     { name: 'The Lover',     koName: '연인',       category: 'Connection',     koCategory: '연결',   en: 'Themes of connection and relationships featured prominently in your dream space.',              ko: '연결과 관계에 대한 테마가 꿈 공간에서 두드러지게 나타났습니다.',                iconType: 'key' },
  caregiver: { name: 'The Caregiver', koName: '돌봄이',     category: 'Nurture',        koCategory: '돌봄',   en: 'Nurturing figures and protective instincts reflect care and responsibility themes.',            ko: '돌봄의 인물과 보호 본능이 두드러지며 책임의 테마를 반영합니다.',               iconType: 'key' },
  ruler:     { name: 'The Ruler',     koName: '통치자',     category: 'Order',          koCategory: '질서',   en: 'Dreams of control and structure reflect a desire to bring order to your waking life.',          ko: '통제와 구조에 대한 꿈은 일상에 질서를 가져오려는 욕구를 반영합니다.',          iconType: 'compass' },
  outlaw:    { name: 'The Outlaw',    koName: '무법자',     category: 'Challenge',      koCategory: '도전',   en: 'Your dreams showed themes of breaking boundaries and disrupting the status quo.',               ko: '꿈에서 경계를 넘고 현상 유지를 깨는 테마가 나타났습니다.',                     iconType: 'compass' },
  creator:   { name: 'The Creator',   koName: '창조자',     category: 'Creation',       koCategory: '창조',   en: 'Creative impulses and novel constructions appeared, signaling innovative energy.',              ko: '창의적 충동과 새로운 구성이 꿈에 나타났으며 혁신적 에너지를 신호합니다.',       iconType: 'key' },
  innocent:  { name: 'The Innocent',  koName: '순수한 자',  category: 'Purity',         koCategory: '순수',   en: 'Childlike wonder and simple joys featured in your dreams, reflecting core values.',            ko: '순수하고 어린아이 같은 경이로움이 꿈에 나타났으며 핵심 가치를 반영합니다.',    iconType: 'key' },
  jester:    { name: 'The Jester',    koName: '광대',       category: 'Liberation',     koCategory: '해방',   en: 'Playful or absurd elements appeared often, pointing to a need for lightness.',                 ko: '유쾌하거나 엉뚱한 요소가 자주 등장했으며 가벼움에 대한 필요를 나타냅니다.',    iconType: 'compass' },
  everyman:  { name: 'The Everyman',  koName: '보통 사람',  category: 'Belonging',      koCategory: '소속',   en: 'Ordinary settings and familiar faces suggest a longing for community and belonging.',           ko: '평범한 환경과 익숙한 얼굴이 공동체와 소속감에 대한 갈망을 나타냅니다.',        iconType: 'compass' },
};

export default function MonthlyDreamReport({ user, language = 'ko', onClose }: MonthlyReportProps) {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [availableMonths, setAvailableMonths] = useState<{ value: number; label: string }[]>([]);

  const [moodCount, setMoodCount] = useState(0);
  const [dreamCount, setDreamCount] = useState(0);
  const [activityGrid, setActivityGrid] = useState<ActivityDay[]>([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [nextMonthLabel, setNextMonthLabel] = useState('');
  const [hasData, setHasData] = useState(false);

  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [archetypes, setArchetypes] = useState<ArchetypeCard[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isCurrentMonthPreview, setIsCurrentMonthPreview] = useState(false);

  useEffect(() => {
    if (user) checkPremiumAndLoadReport();
  }, [user]);

  useEffect(() => {
    if (user) loadMonthReport(selectedMonth, isPremium);
  }, [selectedMonth]);

  const isMoodEntry = (d: Dream) =>
    !!(d.content?.startsWith('[감정 기록]') || d.tags?.includes('emotion-record'));

  const loadMonthReport = async (monthOffset: number, premium: boolean) => {
    if (!user) return;
    try {
      setLoading(true);
      setAiInsights(null);
      setArchetypes([]);
      setShowDeepDive(false);

      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const isCurrent = monthOffset === 0;
      setIsCurrentMonthPreview(isCurrent);
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const label = targetDate.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' });
      const nextLabel = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
        .toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long' });
      setMonthLabel(label);
      setNextMonthLabel(nextLabel);

      const { data: allEntries } = await supabase
        .from('dreams').select('*').eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: false });

      if (!allEntries || allEntries.length === 0) { setHasData(false); return; }
      setHasData(true);

      const moods = allEntries.filter(isMoodEntry);
      const dreams = allEntries.filter(d => !isMoodEntry(d));
      setMoodCount(moods.length);
      setDreamCount(dreams.length);

      const dayKey = (d: Dream) => {
        const dt = new Date(d.created_at || new Date());
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      };
      const moodDaySet = new Set<string>();
      const dreamDaySet = new Set<string>();
      moods.forEach(m => moodDaySet.add(dayKey(m)));
      dreams.forEach(d => dreamDaySet.add(dayKey(d)));

      const daysInMonth = monthEnd.getDate();
      const grid: ActivityDay[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${day}`;
        const hm = moodDaySet.has(key), hd = dreamDaySet.has(key);
        grid.push({ day, type: hm && hd ? 'both' : hm ? 'mood' : hd ? 'dream' : 'none' });
      }
      setActivityGrid(grid);

      if (premium) {
        loadPremiumInsights(dreams, moods, label, targetDate.getFullYear(), targetDate.getMonth(), isCurrent);
        const dreamIds = dreams.map(d => d.id).filter(Boolean);
        loadArchetypes(dreamIds, dreams);
      }
    } catch (err) {
      console.error('Error loading month report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumInsights = async (dreams: Dream[], moods: Dream[], label: string, year: number, month: number, isCurrent: boolean) => {
    if (dreams.length === 0 && moods.length === 0) return;

    const cacheKey = `mdr_insights_${user!.id}_${year}_${month}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const ageMs = Date.now() - timestamp;
        const ttl = isCurrent ? 24 * 60 * 60 * 1000 : Infinity;
        if (ageMs < ttl) {
          setAiInsights(data);
          return;
        }
      } catch { /* stale cache, re-fetch */ }
    }

    setAiLoading(true);
    try {
      const dreamSummaries = dreams.slice(0, 10).map((d, i) =>
        `Dream ${i + 1}: ${d.title || 'untitled'} — ${d.content?.substring(0, 200) || ''}`
      ).join('\n');
      const moodSummaries = moods.slice(0, 8).map((m, i) =>
        `Mood ${i + 1}: ${m.content?.replace('[감정 기록]', '').trim().substring(0, 120) || ''}`
      ).join('\n');

      const prompt = language === 'ko'
        ? `다음은 ${label}의 기록입니다:\n\n감정 기록:\n${moodSummaries}\n\n꿈 기록:\n${dreamSummaries}\n\n중요한 원칙: 감정과 꿈을 좋고 나쁨으로 평가하지 마세요. 불안, 두려움, 악몽, 어두운 감정 모두 유쾌한 감정과 동등하게 내면의 현상 그 자체로 다루세요. 어떤 감정이나 꿈도 고쳐야 하거나 변화해야 한다는 뉘앙스 없이 있는 그대로 탐색하세요. "정말 힘드셨겠어요" 같은 과장된 공감 표현은 피하고 담백하되 따뜻하게 유지하세요.\n\n다음 JSON 형식으로 분석해주세요:\n{"narrativeTitle":"이달을 표현하는 시적 제목(10단어 이내)","narrativeText":"이달 전체 흐름을 설명하는 2-3문장","synthesisTheme":"이달의 핵심 주제(5단어 이내)","synthesisDescription":"감정과 꿈의 거시적 연결 패턴(4-5문장, 반복적으로 나타난 테마와 변화 포함)","synthesisQuestion":"내면을 깊이 탐색하도록 유도하는 구체적인 성찰 질문(1문장, 판단 없이 현상을 바라보도록)","deepDive":"감정 패턴과 꿈 상징에 대한 심층 탐색(5-7문장, 반복 상징의 의미, 내면의 변화 흐름, 주목할 만한 감정들, 삶에서의 연결 포함. 좋고 나쁨 없이 현상으로 다룰 것)","lookingAheadTitle":"다음 달 제목(5단어 이내)","lookingAheadSuggestion":"이달 패턴을 바탕으로 한 다음 달 구체적 제안(2-3문장)"}`
        : `Here are entries from ${label}:\n\nMood logs:\n${moodSummaries}\n\nDream logs:\n${dreamSummaries}\n\nImportant principle: Never evaluate emotions or dreams as good or bad. Anxiety, fear, nightmares, and dark emotions are as valid as pleasant ones — treat all as neutral inner phenomena. Do not imply anything needs to change or be fixed. Avoid exaggerated AI-style empathy — stay warm but grounded and matter-of-fact.\n\nAnalyze in this JSON:\n{"narrativeTitle":"Poetic title under 10 words","narrativeText":"2-3 sentence overview of this month's flow","synthesisTheme":"Core theme under 5 words","synthesisDescription":"Macro connection between moods and dreams (4-5 sentences including recurring themes and shifts)","synthesisQuestion":"A specific, deeply reflective question that invites non-judgmental inner exploration (1 sentence)","deepDive":"Deep exploration of emotional patterns and dream symbols (5-7 sentences covering recurring symbols, inner shifts, notable emotions, and connections to waking life — treat all content as neutral phenomena without good/bad framing)","lookingAheadTitle":"Title for next month under 5 words","lookingAheadSuggestion":"Specific suggestion for next month based on this month's patterns (2-3 sentences)"}`;

      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, dreamText: prompt, mode: 'monthly' }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.interpretation || data.analysis || data.result || '';
        const stripped = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const jsonMatch = stripped.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            setAiInsights(parsed);
            localStorage.setItem(cacheKey, JSON.stringify({ data: parsed, timestamp: Date.now() }));
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Error loading premium insights:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const loadArchetypes = async (dreamIds: string[], dreams: Dream[]) => {
    try {
      const scores: Record<string, number> = {};

      // Try dream_patterns table first
      const { data: patterns } = await supabase
        .from('dream_patterns').select('archetype_hints').in('dream_id', dreamIds);

      if (patterns && patterns.length > 0) {
        patterns.forEach(p => {
          Object.entries(p.archetype_hints || {}).forEach(([arch, score]) => {
            scores[arch] = (scores[arch] || 0) + (score as number);
          });
        });
      }

      // Fallback: keyword-based detection from dream content
      if (Object.keys(scores).length === 0 && dreams.length > 0) {
        const allText = dreams.map(d => `${d.title || ''} ${d.content || ''}`).join(' ').toLowerCase();
        const kwMap: Record<string, string[]> = {
          hero:      ['hero', 'fight', 'battle', 'overcome', 'brave', 'courage', '영웅', '싸움', '용기'],
          sage:      ['wisdom', 'knowledge', 'guide', 'teacher', 'answer', '지혜', '가이드', '선생'],
          explorer:  ['travel', 'journey', 'road', 'path', 'discover', '여행', '탐험', '길'],
          magician:  ['transform', 'magic', 'change', 'shift', 'power', '변화', '마법', '변신'],
          lover:     ['love', 'connect', 'intimate', 'relationship', '사랑', '연결', '관계'],
          caregiver: ['care', 'protect', 'nurture', 'help', 'family', '돌봄', '보호', '가족'],
          outlaw:    ['break', 'escape', 'freedom', 'rebel', 'rule', '탈출', '자유', '반항'],
          creator:   ['create', 'build', 'art', 'invent', 'make', '창조', '만들다', '예술'],
          innocent:  ['child', 'pure', 'simple', 'wonder', 'joy', '아이', '순수', '기쁨'],
          everyman:  ['ordinary', 'home', 'family', 'belong', 'friend', '가정', '평범', '친구'],
        };
        Object.entries(kwMap).forEach(([arch, kws]) => {
          const count = kws.reduce((s, kw) => s + (allText.split(kw).length - 1), 0);
          if (count > 0) scores[arch] = count;
        });
      }

      const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 2);
      if (top.length === 0) return;

      const cards: ArchetypeCard[] = top.map(([arch], i) => {
        const info = ARCHETYPE_INFO[arch];
        return {
          name: language === 'ko' ? (info?.koName || arch) : (info?.name || arch),
          category: language === 'ko' ? (info?.koCategory || '상징') : (info?.category || 'Symbol'),
          meaning: language === 'ko' ? (info?.ko || arch) : (info?.en || arch),
          iconType: i === 0 ? 'key' : 'compass',
        };
      });
      setArchetypes(cards);
    } catch (err) {
      console.error('Error loading archetypes:', err);
    }
  };

  const checkPremiumAndLoadReport = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      const planInfo = await getUserPlanInfo(user.id);
      const premium = planInfo.planSlug === 'premium';
      setIsPremium(premium);

      const { data: allEntries } = await supabase
        .from('dreams').select('created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allEntries && allEntries.length > 0) {
        const months = new Set<string>();
        allEntries.forEach(e => {
          const d = new Date(e.created_at);
          months.add(`${d.getFullYear()}-${d.getMonth()}`);
        });
        const now2 = new Date();
        const opts = Array.from(months).map(key => {
          const [yr, mo] = key.split('-').map(Number);
          const date = new Date(yr, mo, 1);
          const offset = (now2.getFullYear() - yr) * 12 + (now2.getMonth() - mo);
          return { value: -offset, label: date.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' }) };
        }).sort((a, b) => b.value - a.value);
        setAvailableMonths(opts);
      }
      await loadMonthReport(0, premium);
    } catch (err) {
      console.error('Error checking premium:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── derived ── */
  const activeDaysCount = activityGrid.filter(d => d.type !== 'none').length;
  const totalEntries = moodCount + dreamCount;
  const moodPct = totalEntries > 0 ? (moodCount / totalEntries) * 100 : 50;
  const dreamPct = totalEntries > 0 ? (dreamCount / totalEntries) * 100 : 50;

  const dayBg = (t: DayType) => t === 'both' ? '#7ea886' : t === 'mood' ? '#e8ce90' : t === 'dream' ? '#b8d6c0' : '#f0f5f2';
  const dayBorder = (t: DayType) => t === 'both' ? '1px solid rgba(92,128,101,0.2)' : t === 'mood' ? '1px solid rgba(214,168,72,0.2)' : t === 'dream' ? '1px solid rgba(126,168,134,0.2)' : '1px solid rgba(232,239,233,0.5)';

  /* ── Loading ── */
  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <style>{`@keyframes mdr-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 44, height: 44, border: '3px solid #e8efe9', borderTopColor: '#7ea886', borderRadius: '50%', animation: 'mdr-spin 1s linear infinite' }} />
      <p style={{ color: '#8ca693', fontSize: 14 }}>{language === 'ko' ? '리포트를 불러오는 중...' : 'Loading your report...'}</p>
    </div>
  );

  /* ── No Data ── */
  if (!hasData) return (
    <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <IconMoon size={48} color="#7ea886" />
      <p style={{ fontSize: 16, color: '#334139', lineHeight: 1.6, maxWidth: 280 }}>
        {language === 'ko' ? '이번 달 기록된 꿈이 없습니다. 꿈을 기록하고 인사이트를 발견하세요!' : 'No dreams recorded this month. Start journaling to unlock insights!'}
      </p>
      {onClose && <button onClick={onClose} style={{ padding: '12px 24px', background: '#7ea886', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{language === 'ko' ? '꿈 기록하러 가기' : 'Start Recording Dreams'}</button>}
    </div>
  );

  /* ── Main ── */
  return (
    <div style={{ fontFamily: 'inherit', color: '#334139', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes mdr-spin { to { transform: rotate(360deg); } }
        .mdr-scroll::-webkit-scrollbar { width: 4px; }
        .mdr-scroll::-webkit-scrollbar-thumb { background: #c6dfce; border-radius: 4px; }
        .mdr-day { transition: transform 0.2s; }
        .mdr-day:hover { transform: scale(1.15); }
        .mdr-close:hover { background: #f0f5f2 !important; color: #5c8065 !important; }
        .mdr-journal:hover { color: #5c8065 !important; }
        .mdr-intention:hover { color: white !important; }
      `}</style>

      {/* ── Sticky Header ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #e8efe9', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5c8065' }}>
          <IconCalendar size={17} color="#5c8065" />
          {availableMonths.length > 1 ? (
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ fontSize: 13, fontWeight: 700, color: '#5c8065', border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {availableMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{monthLabel}</span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5c8065' }}>{language === 'ko' ? '리뷰' : 'Review'}</span>
          {isPremium && (
            <span style={{ marginLeft: 4, padding: '2px 8px', background: 'linear-gradient(to right, #e8ce90, #7ea886)', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Premium
            </span>
          )}
        </div>
        {onClose && (
          <button className="mdr-close" onClick={onClose} style={{ padding: 8, marginRight: -8, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8ca693', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}>
            <IconX size={20} />
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="mdr-scroll" style={{ overflowY: 'auto', padding: '24px 20px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* 1. Narrative */}
        <section style={{ textAlign: 'center', paddingTop: 8 }}>
          {aiLoading && !aiInsights ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8ca693', fontSize: 13 }}>
              <div style={{ width: 13, height: 13, border: '2px solid #e8efe9', borderTopColor: '#7ea886', borderRadius: '50%', animation: 'mdr-spin 1s linear infinite', flexShrink: 0 }} />
              {language === 'ko' ? '분석 중...' : 'Analyzing...'}
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#3d6044', marginBottom: 16, lineHeight: 1.25, fontFamily: 'Georgia, serif' }}>
                {aiInsights?.narrativeTitle || (language === 'ko' ? `${monthLabel}의 기록` : `${monthLabel} in Review`)}
              </h1>
              <p style={{ color: '#5c8065', lineHeight: 1.7, maxWidth: 380, margin: '0 auto', fontSize: 14 }}>
                {aiInsights?.narrativeText || (language === 'ko'
                  ? `이달에 ${dreamCount}개의 꿈과 ${moodCount}개의 감정을 기록했습니다.`
                  : `You recorded ${dreamCount} dreams and ${moodCount} moods this month.`)}
              </p>
            </>
          )}
        </section>

        {/* 2. Moments of Pause */}
        <section style={{ background: '#fff', border: '1px solid #e8efe9', borderRadius: 20, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 8, margin: '0 0 8px' }}>
            {language === 'ko' ? '기록의 발자취' : 'Moments of Pause'}
          </h3>
          <p style={{ textAlign: 'center', color: '#4a6b52', marginBottom: 24, fontSize: 14, fontWeight: 500 }}>
            {language === 'ko'
              ? <>{`이달 `}<strong style={{ color: '#3d6044', fontSize: 20 }}>{activeDaysCount}</strong>{`일을 기록했습니다`}</>
              : <>You took time to reflect on <strong style={{ color: '#3d6044', fontSize: 20, margin: '0 2px' }}>{activeDaysCount}</strong> days this month.</>}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
            {activityGrid.map(({ day, type }) => (
              <div key={day} className="mdr-day" title={`Day ${day}`} style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: dayBg(type), border: dayBorder(type), boxShadow: type !== 'none' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20, fontSize: 11, fontWeight: 500, color: '#8ca693' }}>
            {[{ bg: '#e8ce90', label: language === 'ko' ? '감정만' : 'Mood Only' }, { bg: '#b8d6c0', label: language === 'ko' ? '꿈만' : 'Dream Only' }, { bg: '#7ea886', label: language === 'ko' ? '둘 다' : 'Both' }].map(({ bg, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: bg }} />{label}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Your Dual Logs */}
        <section style={{ background: '#fbfcfb', border: '1px solid #e8efe9', borderRadius: 20, padding: 24 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', margin: '0 0 20px' }}>
            {language === 'ko' ? '나의 두 가지 기록' : 'Your Dual Logs'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <IconSun size={20} color="#d6a848" />
              <span style={{ fontSize: 26, fontWeight: 700, color: '#3d6044', lineHeight: 1.1, marginTop: 4 }}>{moodCount}</span>
              <span style={{ fontSize: 10, color: '#8ca693', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{language === 'ko' ? '감정' : 'Moods'}</span>
            </div>
            <div style={{ width: '45%', height: 12, borderRadius: 99, overflow: 'hidden', background: '#f0f5f2', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexShrink: 0 }}>
              <div style={{ height: '100%', background: '#e8ce90', width: `${moodPct}%` }} />
              <div style={{ height: '100%', background: '#7ea886', width: `${dreamPct}%` }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <IconMoon size={20} color="#7ea886" />
              <span style={{ fontSize: 26, fontWeight: 700, color: '#3d6044', lineHeight: 1.1, marginTop: 4 }}>{dreamCount}</span>
              <span style={{ fontSize: 10, color: '#8ca693', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{language === 'ko' ? '꿈' : 'Dreams'}</span>
            </div>
          </div>
        </section>

        {/* ── Premium divider + sections ── */}
        <div style={{ position: 'relative' }}>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #dbece0)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
              {language === 'ko' ? '프리미엄 인사이트' : 'Premium Insights'}
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #dbece0)' }} />
          </div>

          {/* Current month preview banner */}
          {isCurrentMonthPreview && isPremium && (
            <div style={{ background: '#fffbea', border: '1px solid #e8ce90', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSparkles size={13} color="#d6a848" />
              <p style={{ fontSize: 12, color: '#a07c2a', margin: 0, lineHeight: 1.5 }}>
                {language === 'ko'
                  ? '이번 달이 아직 끝나지 않았어요. 프리뷰 분석이며 월말에 완성된 분석이 제공됩니다.'
                  : "This month isn't over yet. This is a preview — final analysis arrives at month end."}
              </p>
            </div>
          )}

          {/* Premium sections — titles always visible, content blurred for free users */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* 4. AI Monthly Synthesis */}
            <section style={{ background: 'linear-gradient(135deg, #f2f7f4 0%, #e8edea 100%)', borderRadius: 20, padding: 24, border: '1px solid #c6dfce', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -48, right: -48, width: 128, height: 128, background: '#e8ce90', borderRadius: '50%', opacity: 0.1, filter: 'blur(16px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Title — always visible */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <IconSparkles size={16} color="#d6a848" />
                  <h3 style={{ fontSize: 11, fontWeight: 700, color: '#d6a848', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {language === 'ko' ? 'AI 월간 종합' : 'AI Monthly Synthesis'}
                  </h3>
                </div>
                {/* Content */}
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: !isPremium ? 'blur(6px)' : 'none', pointerEvents: !isPremium ? 'none' : 'auto', userSelect: !isPremium ? 'none' : 'auto' }}>
                    {aiLoading && !aiInsights ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8ca693', fontSize: 13 }}>
                        <div style={{ width: 13, height: 13, border: '2px solid #e8efe9', borderTopColor: '#7ea886', borderRadius: '50%', animation: 'mdr-spin 1s linear infinite', flexShrink: 0 }} />
                        {language === 'ko' ? '생성 중...' : 'Generating...'}
                      </div>
                    ) : (
                      <>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: '#3d6044', marginBottom: 12 }}>
                          {aiInsights?.synthesisTheme || (language === 'ko' ? '이달의 패턴' : "This Month's Pattern")}
                        </h4>
                        <p style={{ fontSize: 13, color: '#5c8065', lineHeight: 1.7, marginBottom: 20 }}>
                          {aiInsights?.synthesisDescription || (language === 'ko' ? '이달의 감정과 꿈 사이의 연결 패턴을 분석하고 있습니다.' : 'Analyzing the connection patterns between your moods and dreams this month.')}
                        </p>
                        <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e8efe9' }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flexShrink: 0, transform: 'rotate(180deg)', color: '#a4b8a9' }}><IconQuote size={20} color="#a4b8a9" /></div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#4a6b52', marginBottom: 10 }}>
                                {aiInsights?.synthesisQuestion || (language === 'ko' ? '이달 꿈이 당신에게 전하는 메시지는 무엇인가요?' : 'What message are your dreams sending you this month?')}
                              </p>
                              {aiInsights?.deepDive && showDeepDive && (
                                <p style={{ fontSize: 13, color: '#5c8065', lineHeight: 1.75, marginBottom: 10 }}>
                                  {aiInsights.deepDive}
                                </p>
                              )}
                              <button className="mdr-journal" onClick={() => setShowDeepDive(v => !v)} style={{ fontSize: 11, fontWeight: 700, color: '#7ea886', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, transition: 'color 0.15s' }}>
                                {language === 'ko' ? (showDeepDive ? '접기' : '더보기') : (showDeepDive ? 'Show less' : 'Read more')} <IconArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {!isPremium && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <IconKey size={13} color="#7ea886" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#5c8065' }}>{language === 'ko' ? '프리미엄 전용' : 'Premium only'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 5. Discovered Archetypes */}
            <section>
              {/* Title — always visible */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 2 }}>
                <IconCompass size={17} color="#7ea886" />
                <h3 style={{ fontSize: 11, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  {language === 'ko' ? '발견된 아키타입' : 'Discovered Archetypes'}
                </h3>
              </div>
              {/* Content */}
              <div style={{ position: 'relative' }}>
                <div style={{ filter: !isPremium ? 'blur(6px)' : 'none', pointerEvents: !isPremium ? 'none' : 'auto', userSelect: !isPremium ? 'none' : 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {(archetypes.length > 0 ? archetypes : [
                      { name: language === 'ko' ? '분석 중...' : 'Analyzing...', category: '—', meaning: language === 'ko' ? '꿈 패턴을 분석하고 있습니다.' : 'Analyzing your dream patterns.', iconType: 'key' as const },
                      { name: language === 'ko' ? '분석 중...' : 'Analyzing...', category: '—', meaning: language === 'ko' ? '곧 결과가 나타납니다.' : 'Results will appear shortly.', iconType: 'compass' as const },
                    ]).map((arch, i) => (
                      <div key={i} style={{ background: 'white', border: '1px solid #e8efe9', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f5f2', color: '#7ea886', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {arch.iconType === 'key' ? <IconKey size={16} color="#7ea886" /> : <IconCompass size={16} color="#7ea886" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#3d6044' }}>{arch.name}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{arch.category}</div>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: '#5c8065', lineHeight: 1.6, margin: 0 }}>{arch.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {!isPremium && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <IconKey size={13} color="#7ea886" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#5c8065' }}>{language === 'ko' ? '프리미엄 전용' : 'Premium only'}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 6. Looking Ahead */}
            <section style={{ background: '#3d6044', borderRadius: 20, padding: 24, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(61,96,68,0.3)' }}>
              <div style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, background: '#5c8065', borderRadius: '50%', opacity: 0.5, filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Title — always visible */}
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                  {aiInsights?.lookingAheadTitle || (language === 'ko' ? `${nextMonthLabel}을 바라보며` : `Looking Ahead to ${nextMonthLabel}`)}
                </h3>
                {/* Content */}
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: !isPremium ? 'blur(6px)' : 'none', pointerEvents: !isPremium ? 'none' : 'auto', userSelect: !isPremium ? 'none' : 'auto' }}>
                    <p style={{ fontSize: 13, color: '#b8d6c0', lineHeight: 1.7, marginBottom: 20 }}>
                      {aiInsights?.lookingAheadSuggestion || (language === 'ko' ? '다음 달을 위한 가이드를 준비하고 있습니다.' : 'Preparing your guidance for next month.')}
                    </p>
                    <button className="mdr-intention" onClick={() => onClose?.()} style={{ fontSize: 12, fontWeight: 700, color: '#e8ce90', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, transition: 'color 0.15s' }}>
                      {language === 'ko' ? `${nextMonthLabel}에도 꿈 기록하기` : `Keep journaling in ${nextMonthLabel}`} <IconArrowRight size={15} />
                    </button>
                  </div>
                  {!isPremium && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(61,96,68,0.7)', borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(255,255,255,0.2)' }}>
                        <IconKey size={13} color="#e8ce90" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#e8ce90' }}>{language === 'ko' ? '프리미엄 전용' : 'Premium only'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Upgrade CTA for free users */}
            {!isPremium && (
              <div style={{ background: 'white', border: '1px solid #e8efe9', borderRadius: 20, padding: '24px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: 10, color: '#7ea886', display: 'flex', justifyContent: 'center' }}><IconSparkles size={24} color="#7ea886" /></div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#3d6044', marginBottom: 6 }}>
                  {language === 'ko' ? '프리미엄으로 잠금 해제' : 'Unlock with Premium'}
                </h3>
                <p style={{ fontSize: 12, color: '#8ca693', lineHeight: 1.6, marginBottom: 16, maxWidth: 260, margin: '0 auto 16px' }}>
                  {language === 'ko'
                    ? 'AI 월간 분석, 아키타입 발견, 다음 달 가이드를 모두 확인하세요'
                    : 'Access AI analysis, archetype discovery, and your personalized next-month guide'}
                </p>
                <button onClick={() => window.location.href = '/pricing'} style={{ padding: '12px 28px', background: '#7ea886', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(126,168,134,0.35)' }}>
                  {language === 'ko' ? '프리미엄 시작하기' : 'Unlock Premium'}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
