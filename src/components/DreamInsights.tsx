'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface DreamInsightsProps {
  user: User;
  language?: 'en' | 'ko';
  onClose: () => void;
  isPremium?: boolean;
  onOpenMonthlyReview?: () => void;
}

interface KeywordData {
  keyword: string;
  category: string;
  count: number;
  trend: 'up' | 'down' | 'flat';
}

interface MoodData {
  mood: string;
  count: number;
  trend: 'up' | 'down' | 'flat';
}

interface DreamStats {
  totalDreams: number;
  thisWeek: number;
  currentStreak: number;
  moodPatterns: MoodData[];
  dreamSymbols: KeywordData[];
  sentimentBalance: { positive: number; neutral: number; negative: number };
}

/* ── SVG Icon Components ── */
function BaseIcon({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

function XIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></BaseIcon>;
}
function SunIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></BaseIcon>;
}
function MoonIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></BaseIcon>;
}
function ActivityIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></BaseIcon>;
}
function TrendingUpIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></BaseIcon>;
}
function TrendingDownIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></BaseIcon>;
}
function MinusIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><line x1="5" y1="12" x2="19" y2="12"/></BaseIcon>;
}
function SparklesIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/></BaseIcon>;
}
function LockIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></BaseIcon>;
}
function BarChart3Icon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></BaseIcon>;
}
function ArrowUpRightIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M7 7h10v10"/><path d="M7 17 17 7"/></BaseIcon>;
}
function ArrowDownRightIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M7 17h10V7"/><path d="M17 17 7 7"/></BaseIcon>;
}
function DropletsIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 2.9 7 2.9s-2.15 6.16-2.29 6.16c-1.14.93-1.71 2.03-1.71 3.19 0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 1 14 8.5c.64.9 1 2 1 3.2 0 2.8-2.2 5-5 5s-5-2.2-5-5c0-1.2.36-2.3 1-3.2"/></BaseIcon>;
}
function FootprintsIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></BaseIcon>;
}
function HomeIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></BaseIcon>;
}
function UserIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></BaseIcon>;
}
function StarIcon({ size = 24 }: { size?: number }) {
  return <BaseIcon size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></BaseIcon>;
}

type IconComponent = ({ size }: { size?: number }) => React.ReactElement;

const POSITIVE_MOODS = new Set(['happy', 'peaceful', 'excited', 'hopeful', 'curious', 'joyful', 'calm', 'content', 'grateful', 'serene', 'balanced', '행복', '평화', '설렘', '희망', '호기심']);
const NEGATIVE_MOODS = new Set(['anxious', 'fearful', 'angry', 'sad', 'confused', 'worried', 'stressed', 'nervous', 'scared', 'overwhelmed', '불안', '두려움', '화남', '슬픔', '혼란']);

function getMoodStyle(mood: string) {
  const m = mood.toLowerCase();
  if (POSITIVE_MOODS.has(m)) return { color: '#7ea886', bg: '#ebf2ed' };
  if (NEGATIVE_MOODS.has(m)) return { color: '#d6a848', bg: '#fbf4e6' };
  return { color: '#5c8065', bg: '#e8efe9' };
}

function getSymbolInfo(keyword: string, category: string): { Icon: IconComponent; display: string } {
  const kw = keyword.toLowerCase();
  if (/water|ocean|rain|river|lake|sea|물|바다|강/.test(kw)) return { Icon: DropletsIcon, display: 'Nature' };
  if (/run|chase|walk|fly|달리|달음|걷|비행/.test(kw)) return { Icon: FootprintsIcon, display: 'Action' };
  if (/house|home|room|building|door|집|방|건물/.test(kw)) return { Icon: HomeIcon, display: 'Space' };
  if (/stranger|person|man|woman|낯선|사람|인물/.test(kw)) return { Icon: UserIcon, display: 'Persona' };
  if (category === 'place') return { Icon: HomeIcon, display: 'Space' };
  if (category === 'person') return { Icon: UserIcon, display: 'Persona' };
  if (category === 'action') return { Icon: FootprintsIcon, display: 'Action' };
  return { Icon: StarIcon, display: category.charAt(0).toUpperCase() + category.slice(1) || 'Symbol' };
}

export default function DreamInsights({ user, language = 'en', onClose, isPremium = false, onOpenMonthlyReview }: DreamInsightsProps) {
  const ko = language === 'ko';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DreamStats | null>(null);

  useEffect(() => { loadData(); }, [user.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: allEntries } = await supabase
        .from('dreams')
        .select('id, created_at, mood, tags, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const entries = allEntries || [];

      // Separate mood/emotion logs from dream entries
      const isMoodEntry = (d: { content?: string; tags?: string[] }) =>
        d.content?.startsWith('[감정 기록]') || d.tags?.includes('emotion-record');
      const dreamEntries = entries.filter(d => !isMoodEntry(d));
      const dreamIds = dreamEntries.map(d => d.id);

      const { data: keywordsData } = await supabase
        .from('dream_keywords')
        .select('keyword, category, sentiment, dream_id')
        .in('dream_id', dreamIds.length > 0 ? dreamIds : ['null']);

      const now = Date.now();
      const week = 7 * 86400000;
      const thisWeek = entries.filter(d => now - new Date(d.created_at).getTime() < week).length;

      // Streak: consecutive days with any entry
      let currentStreak = 0;
      if (entries.length > 0) {
        const uniqueDates = [...new Set(entries.map(d => new Date(d.created_at).toDateString()))]
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const today = new Date().toDateString();
        const yesterday = new Date(now - 86400000).toDateString();
        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          currentStreak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const diff = Math.round((new Date(uniqueDates[i]).getTime() - new Date(uniqueDates[i - 1]).getTime()) / 86400000);
            if (diff === -1) currentStreak++; else break;
          }
        }
      }

      // Trend window: recent 14 days vs previous 14 days
      const recent14Ids = new Set(entries.filter(d => now - new Date(d.created_at).getTime() < 14 * 86400000).map(d => d.id));
      const older14Ids = new Set(entries.filter(d => {
        const age = now - new Date(d.created_at).getTime();
        return age >= 14 * 86400000 && age < 28 * 86400000;
      }).map(d => d.id));
      const r14 = recent14Ids.size || 1, o14 = older14Ids.size || 1;

      // Mood patterns from ALL entries with a mood field
      const moodCounts: Record<string, number> = {};
      const moodRecent: Record<string, number> = {};
      const moodOlder: Record<string, number> = {};
      entries.forEach(d => {
        if (!d.mood) return;
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
        if (recent14Ids.has(d.id)) moodRecent[d.mood] = (moodRecent[d.mood] || 0) + 1;
        if (older14Ids.has(d.id)) moodOlder[d.mood] = (moodOlder[d.mood] || 0) + 1;
      });
      const moodPatterns: MoodData[] = Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([mood, count]) => {
          const rPct = (moodRecent[mood] || 0) / r14;
          const oPct = (moodOlder[mood] || 0) / o14;
          const trend: 'up' | 'down' | 'flat' = rPct > oPct * 1.2 ? 'up' : rPct < oPct * 0.8 ? 'down' : 'flat';
          return { mood, count, trend };
        });

      // Dream symbols from dream_keywords (dream entries only)
      const dreamRecent14Ids = new Set(dreamEntries.filter(d => now - new Date(d.created_at).getTime() < 14 * 86400000).map(d => d.id));
      const dreamOlder14Ids = new Set(dreamEntries.filter(d => {
        const age = now - new Date(d.created_at).getTime();
        return age >= 14 * 86400000 && age < 28 * 86400000;
      }).map(d => d.id));
      const dr14 = dreamRecent14Ids.size || 1, do14 = dreamOlder14Ids.size || 1;

      const kwFreq: Record<string, { category: string; total: number; recent: number; older: number }> = {};
      (keywordsData || []).forEach(kw => {
        const key = kw.keyword.toLowerCase();
        if (!kwFreq[key]) kwFreq[key] = { category: kw.category, total: 0, recent: 0, older: 0 };
        kwFreq[key].total++;
        if (dreamRecent14Ids.has(kw.dream_id)) kwFreq[key].recent++;
        if (dreamOlder14Ids.has(kw.dream_id)) kwFreq[key].older++;
      });
      const dreamSymbols: KeywordData[] = Object.entries(kwFreq)
        .sort((a, b) => b[1].total - a[1].total).slice(0, 4)
        .map(([keyword, v]) => {
          const rPct = v.recent / dr14, oPct = v.older / do14;
          const trend: 'up' | 'down' | 'flat' = rPct > oPct * 1.2 ? 'up' : rPct < oPct * 0.8 ? 'down' : 'flat';
          return { keyword, category: v.category, count: v.total, trend };
        });

      // Sentiment balance from ALL entries that have a mood
      let pos = 0, neg = 0, neu = 0;
      entries.forEach(d => {
        if (!d.mood) return;
        const m = d.mood.toLowerCase();
        if (POSITIVE_MOODS.has(m)) pos++;
        else if (NEGATIVE_MOODS.has(m)) neg++;
        else neu++;
      });
      const total = pos + neg + neu || 1;
      const posPct = Math.round((pos / total) * 100);
      const neuPct = Math.round((neu / total) * 100);
      const sentimentBalance = {
        positive: posPct,
        neutral: neuPct,
        negative: Math.max(0, 100 - posPct - neuPct),
      };

      setStats({ totalDreams: entries.length, thisWeek, currentStreak, moodPatterns, dreamSymbols, sentimentBalance });
    } catch {
      setStats({ totalDreams: 0, thisWeek: 0, currentStreak: 0, moodPatterns: [], dreamSymbols: [], sentimentBalance: { positive: 0, neutral: 0, negative: 0 } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: 'clamp(12px,3vw,24px)', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes di-spin { to { transform: rotate(360deg); } }
        .di-scroll::-webkit-scrollbar { width: 4px; }
        .di-scroll::-webkit-scrollbar-thumb { background: #c6dfce; border-radius: 4px; }
        .di-row:hover { background: #f0f5f2 !important; }
        .di-symbol-card:hover { border-color: #7ea886 !important; }
        .di-hdr-close:hover { background: #f0f5f2 !important; color: #5c8065 !important; }
        .di-cta-btn:hover { background: #d6a848 !important; }
      `}</style>

      <div style={{ position: 'relative', width: '100%', maxWidth: 600, background: 'white', borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

        {/* ── Sticky Header ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #e8efe9', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#5c8065' }}>
            <BarChart3Icon size={17} />
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5c8065', margin: 0 }}>
              {ko ? '리플렉션' : 'Reflection'}
            </h2>
          </div>
          <button
            className="di-hdr-close"
            onClick={onClose}
            style={{ padding: 8, marginRight: -8, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8ca693', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="di-scroll" style={{ overflowY: 'auto', padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Title */}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#3d6044', marginBottom: 4, margin: '0 0 4px 0' }}>
              {ko ? '나의 패턴 발견하기' : 'Discover your patterns'}
            </h1>
            <p style={{ fontSize: 13, color: '#8ca693', margin: 0 }}>
              {ko ? '최근 기록에서 발견한 객관적 인사이트' : 'Objective insights from your recent logs.'}
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e8efe9', borderTopColor: '#7ea886', borderRadius: '50%', animation: 'di-spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* ── Activity Overview (3-col) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ background: '#f0f5f2', borderRadius: 16, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#3d6044', marginBottom: 2 }}>{stats?.totalDreams ?? 0}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ko ? '전체 기록' : 'Total Logs'}</div>
                </div>
                <div style={{ background: '#f0f5f2', borderRadius: 16, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#3d6044', marginBottom: 2 }}>{stats?.thisWeek ?? 0}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ko ? '이번 주' : 'This Week'}</div>
                </div>
                <div style={{ background: '#f0f5f2', border: '1px solid #dbece0', borderRadius: 16, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, color: '#d6a848' }}>
                    <ActivityIcon size={16} />
                    <span style={{ fontSize: 22, fontWeight: 700 }}>{stats?.currentStreak ?? 0}</span>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8ca693', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ko ? '연속 기록' : 'Day Streak'}</div>
                </div>
              </div>

              {/* ── 1. 감정 패턴 (Waking Mind) ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ color: '#d6a848', display: 'flex' }}><SunIcon size={18} /></span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#4a6b52', margin: 0 }}>
                    {ko ? '감정 패턴' : 'The Waking Mind'}
                  </h3>
                </div>
                <div style={{ background: '#fbfcfb', border: '1px solid #e8efe9', borderRadius: 20, padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {!stats?.moodPatterns.length ? (
                    <p style={{ textAlign: 'center', color: '#8ca693', fontSize: 13, padding: '16px 0', margin: 0 }}>
                      {ko ? '데이터가 충분하지 않습니다' : 'Not enough data yet'}
                    </p>
                  ) : stats.moodPatterns.map(({ mood, count, trend }, idx) => {
                    const { color, bg } = getMoodStyle(mood);
                    return (
                      <div key={idx} className="di-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, transition: 'background 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {trend === 'down' ? <ArrowDownRightIcon size={15} /> : <ArrowUpRightIcon size={15} />}
                          </div>
                          <span style={{ fontWeight: 700, color: '#3d6044', fontSize: 14, textTransform: 'capitalize' }}>{mood}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {trend === 'up' && <span style={{ fontSize: 9, fontWeight: 700, color: '#7ea886', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trending</span>}
                          <div style={{ padding: '3px 10px', background: 'white', border: '1px solid #e8efe9', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#8ca693' }}>{count}x</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── 2. 드림 패턴 (Sleeping Mind) ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ color: '#7ea886', display: 'flex' }}><MoonIcon size={18} /></span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#4a6b52', margin: 0 }}>
                    {ko ? '드림 패턴' : 'The Sleeping Mind'}
                  </h3>
                </div>
                <div style={{ background: '#ebf2ed', border: '1px solid #c6dfce', borderRadius: 20, padding: 20 }}>
                  {!stats?.dreamSymbols.length ? (
                    <p style={{ textAlign: 'center', color: '#8ca693', fontSize: 13, margin: 0 }}>
                      {ko ? '꿈 기록이 더 필요합니다' : 'Record more dreams to see symbols'}
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {stats.dreamSymbols.map(({ keyword, category, count, trend }, idx) => {
                        const { Icon, display } = getSymbolInfo(keyword, category);
                        return (
                          <div key={idx} className="di-symbol-card" style={{ background: 'white', border: '1px solid rgba(198,223,206,0.5)', borderRadius: 16, padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 0.15s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8ca693' }}>
                                <Icon size={14} />
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{display}</span>
                              </div>
                              <span style={{ color: trend === 'up' ? '#7ea886' : trend === 'down' ? '#d6a848' : '#a4b8a9', display: 'flex' }}>
                                {trend === 'up' && <TrendingUpIcon size={13} />}
                                {trend === 'down' && <TrendingDownIcon size={13} />}
                                {trend === 'flat' && <MinusIcon size={13} />}
                              </span>
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#3d6044', marginBottom: 4, textTransform: 'capitalize' }}>{keyword}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a4b8a9' }}>{count} {ko ? '번 등장' : 'appearances'}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* ── 3. Recent Sentiment ── */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ color: '#8ca693', display: 'flex' }}><ActivityIcon size={18} /></span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#4a6b52', margin: 0 }}>
                    {ko ? '최근 감정 스펙트럼' : 'Recent Sentiment'}
                  </h3>
                </div>
                <div style={{ background: '#fbfcfb', border: '1px solid #e8efe9', borderRadius: 20, padding: 20 }}>
                  <div style={{ height: 16, width: '100%', borderRadius: 99, overflow: 'hidden', marginBottom: 16, display: 'flex', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: `${stats?.sentimentBalance.positive ?? 0}%`, background: '#7ea886', transition: 'width 0.8s ease' }} />
                    <div style={{ width: `${stats?.sentimentBalance.neutral ?? 0}%`, background: '#b8d6c0', transition: 'width 0.8s ease' }} />
                    <div style={{ width: `${stats?.sentimentBalance.negative ?? 0}%`, background: '#e2ceb5', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { color: '#7ea886', label: ko ? '안정' : 'Calm', pct: stats?.sentimentBalance.positive ?? 0, textColor: '#5c8065' },
                      { color: '#b8d6c0', label: ko ? '활동' : 'Active', pct: stats?.sentimentBalance.neutral ?? 0, textColor: '#8ca693' },
                      { color: '#e2ceb5', label: ko ? '무거움' : 'Heavy', pct: stats?.sentimentBalance.negative ?? 0, textColor: '#a49682' },
                    ].map(({ color, label, pct, textColor }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: textColor }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {label}{pct > 0 ? ` (${pct}%)` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── Bottom CTA ── */}
              <section style={{ position: 'relative', overflow: 'hidden', background: '#3d6044', borderRadius: 20, padding: 24, color: 'white', textAlign: 'center', boxShadow: '0 4px 16px rgba(61,96,68,0.3)' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 128, height: 128, background: '#5c8065', borderRadius: '50%', opacity: 0.5, filter: 'blur(20px)', transform: 'translate(50%,-50%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 160, height: 160, background: '#2c4a32', borderRadius: '50%', opacity: 0.5, filter: 'blur(20px)', transform: 'translate(-33%,33%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {isPremium ? (
                    <>
                      <div style={{ marginBottom: 12, color: '#e8ce90', display: 'flex' }}><SparklesIcon size={24} /></div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                        {ko ? '월간 리뷰' : 'Monthly Review'}
                      </h3>
                      <p style={{ fontSize: 13, color: '#b8d6c0', maxWidth: 280, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                        {ko
                          ? '이번 달 꿈 패턴의 AI 심층 분석과 아키타입을 확인하세요.'
                          : 'See AI deep analysis and archetypes from this month\'s dream patterns.'}
                      </p>
                      <button
                        className="di-cta-btn"
                        onClick={() => { onClose(); onOpenMonthlyReview?.(); }}
                        style={{ padding: '10px 24px', background: '#e8ce90', color: '#3d6044', border: 'none', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'background 0.15s' }}
                      >
                        {ko ? '월간 리뷰 바로가기' : 'Go to Monthly Review'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 12, color: '#e8ce90', display: 'flex' }}><SparklesIcon size={24} /></div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>
                        {ko ? '이 패턴들이 의미하는 것은?' : 'What do these patterns mean?'}
                      </h3>
                      <p style={{ fontSize: 13, color: '#b8d6c0', maxWidth: 280, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                        {ko
                          ? '월간 리뷰에서 AI 심층 분석, 아키타입 발견, 숨겨진 연결고리를 확인하세요.'
                          : 'Unlock deep AI synthesis, discovered archetypes, and hidden connections in your Monthly Review.'}
                      </p>
                      <button
                        className="di-cta-btn"
                        onClick={() => { window.location.href = '/pricing'; }}
                        style={{ padding: '10px 24px', background: '#e8ce90', color: '#3d6044', border: 'none', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'background 0.15s' }}
                      >
                        <span style={{ display: 'flex' }}><LockIcon size={13} /></span>
                        {ko ? '프리미엄 인사이트 열기' : 'Unlock Premium Insights'}
                      </button>
                    </>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
