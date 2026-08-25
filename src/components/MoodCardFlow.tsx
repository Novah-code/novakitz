'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { speechSupported, startListening, type SpeechSession } from '../lib/speech';
import { canAnalyzeDream, recordAIUsage } from '../lib/subscription';
import { addSingleAffirmation } from '../lib/affirmations';
import { authHeader } from '../lib/authHeader';

interface MoodCardFlowProps {
  selectedEmotion: string;
  language: 'en' | 'ko';
  onClose: () => void;
  user: User | null;
  onRequestLogin?: () => void;
  onEmotionLogged?: () => void;
}

type FlowStep = 'blurred' | 'record-place' | 'record-person' | 'record-scene' | 'analyzing' | 'revealed' | 'ego-sleep' | 'ego-stress' | 'ego-free';

// ── Novakitz Unconscious Archive: 20 Archetype Cards
type ArcanaCard = { name: string; kr: string; arcana: string; theme: 1|2|3|4; from: string; mid: string; to: string };

const arcanaCards: Record<string, ArcanaCard> = {
  // Theme 1: The Shadow
  'ARCANA.01': { name: 'The Void',      kr: '공허 / 무력감과 번아웃',      arcana: 'ARCANA.01', theme: 1, from: '#1A1A2E', mid: '#16213E', to: '#0F3460' },
  'ARCANA.02': { name: 'The Maze',      kr: '미로 / 혼란과 방향 상실',      arcana: 'ARCANA.02', theme: 1, from: '#2D3047', mid: '#404070', to: '#50508A' },
  'ARCANA.03': { name: 'The Glitch',    kr: '균열 / 자아 붕괴와 두려움',    arcana: 'ARCANA.03', theme: 1, from: '#1C2030', mid: '#2A2040', to: '#382850' },
  'ARCANA.04': { name: 'The Fog',       kr: '안개 / 고립과 억압',           arcana: 'ARCANA.04', theme: 1, from: '#9898B8', mid: '#B0B0C8', to: '#C8C8D8' },
  'ARCANA.05': { name: 'The Weight',    kr: '중력 / 완벽주의와 압박',       arcana: 'ARCANA.05', theme: 1, from: '#2C3040', mid: '#404858', to: '#505868' },
  // Theme 2: The Anima/Animus
  'ARCANA.06': { name: 'The Tide',      kr: '파도 / 감정의 범람',           arcana: 'ARCANA.06', theme: 2, from: '#0D2030', mid: '#1A3A4A', to: '#285060' },
  'ARCANA.07': { name: 'The Mirror',    kr: '거울 / 투사와 관계의 반사',    arcana: 'ARCANA.07', theme: 2, from: '#687888', mid: '#8898A8', to: '#A8B8C8' },
  'ARCANA.08': { name: 'The Oasis',     kr: '오아시스 / 치유와 내면의 휴식',arcana: 'ARCANA.08', theme: 2, from: '#D8B070', mid: '#E8C898', to: '#F0E0C0' },
  'ARCANA.09': { name: 'The Spark',     kr: '불꽃 / 창조적 충동과 열정',    arcana: 'ARCANA.09', theme: 2, from: '#E04010', mid: '#F08020', to: '#F8B030' },
  'ARCANA.10': { name: 'The Echo',      kr: '메아리 / 반복되는 패턴',       arcana: 'ARCANA.10', theme: 2, from: '#705888', mid: '#9080A8', to: '#C0A8C8' },
  // Theme 3: The Persona
  'ARCANA.11': { name: 'The Facade',    kr: '가면 / 사회적 체면',           arcana: 'ARCANA.11', theme: 3, from: '#8888A8', mid: '#A8A8C8', to: '#D0D0E0' },
  'ARCANA.12': { name: 'The Fortress',  kr: '요새 / 방어 기제',             arcana: 'ARCANA.12', theme: 3, from: '#3A4050', mid: '#505868', to: '#606878' },
  'ARCANA.13': { name: 'The Helm',      kr: '조타수 / 통제력 상실',         arcana: 'ARCANA.13', theme: 3, from: '#286868', mid: '#387878', to: '#488888' },
  'ARCANA.14': { name: 'The Anchor',    kr: '닻 / 집착과 불안한 안정',      arcana: 'ARCANA.14', theme: 3, from: '#485878', mid: '#586888', to: '#687898' },
  'ARCANA.15': { name: 'The Threshold', kr: '경계 / 변화의 시작',           arcana: 'ARCANA.15', theme: 3, from: '#181828', mid: '#282838', to: '#383848' },
  // Theme 4: The Self
  'ARCANA.16': { name: 'The Ascent',    kr: '비상 / 자유와 해방',           arcana: 'ARCANA.16', theme: 4, from: '#F0D880', mid: '#F8E8B0', to: '#FFF8E0' },
  'ARCANA.17': { name: 'The Prism',     kr: '프리즘 / 다각적 통찰',         arcana: 'ARCANA.17', theme: 4, from: '#B8D0E8', mid: '#D0E0F0', to: '#E8F0F8' },
  'ARCANA.18': { name: 'The Seed',      kr: '씨앗 / 순수한 잠재력',         arcana: 'ARCANA.18', theme: 4, from: '#080820', mid: '#100830', to: '#180840' },
  'ARCANA.19': { name: 'The Compass',   kr: '나침반 / 내면의 지혜',         arcana: 'ARCANA.19', theme: 4, from: '#D0CEC8', mid: '#E0DED8', to: '#F0EEE8' },
  'ARCANA.20': { name: 'The Horizon',   kr: '지평선 / 완전한 수용',         arcana: 'ARCANA.20', theme: 4, from: '#C0D8E8', mid: '#D8E8F0', to: '#F0F4F8' },
};

const arcanaAffirmations: Record<string, { ko: string; en: string }> = {
  'ARCANA.01': { ko: '아무것도 느끼지 못하는 것 또한 마음의 방어입니다.\n오늘은 그저 고요히 쉬어도 괜찮습니다.', en: "Feeling nothing is also a form of self-protection.\nIt's okay to simply rest today." },
  'ARCANA.02': { ko: '혼란 속에서도 당신은 길을 찾아가고 있습니다.\n지금 이 자리에 멈춰 숨을 고르세요.', en: 'Even in confusion, you are finding your way.\nPause here and breathe.' },
  'ARCANA.03': { ko: '균열이 생긴 자리에서 새로운 빛이 들어옵니다.\n부서진 것은 새로운 나의 시작입니다.', en: 'Light enters through the cracks.\nWhat is broken marks the beginning of something new.' },
  'ARCANA.04': { ko: '안개가 짙을수록 그 너머의 빛은 더 밝습니다.\n지금 보이지 않아도 당신은 충분히 연결되어 있습니다.', en: 'The thicker the fog, the brighter the light beyond.\nEven unseen, you are more connected than you feel.' },
  'ARCANA.05': { ko: '모든 책임을 홀로 질 필요는 없습니다.\n오늘 하나씩, 천천히면 충분합니다.', en: "You don't have to carry it all alone.\nOne small step at a time is enough." },
  'ARCANA.06': { ko: '뜨거운 감정은 당신 안에 살아있는 힘의 증거입니다.\n이 파도가 지나가면 더 깊은 평온이 찾아옵니다.', en: 'Your intense feelings are proof of your aliveness.\nWhen this wave passes, deeper calm will follow.' },
  'ARCANA.07': { ko: '타인에게서 불편함을 느낄 때, 그것은 내 안의 무언가를 보여줍니다.\n거울 앞에 용감히 서보세요.', en: "When others unsettle you, they're reflecting something within.\nBe brave enough to face the mirror." },
  'ARCANA.08': { ko: '당신은 쉬어도 됩니다.\n지금 이 순간이 바로 당신이 찾던 오아시스입니다.', en: "You are allowed to rest.\nThis very moment is the oasis you've been searching for." },
  'ARCANA.09': { ko: '내 안의 불꽃을 신뢰하세요.\n지금 느끼는 열정은 새로운 창조의 씨앗입니다.', en: 'Trust the fire within you.\nThe passion you feel now is the seed of something new.' },
  'ARCANA.10': { ko: '반복되는 것들은 당신에게 무언가를 알려주려 합니다.\n오늘, 그 목소리에 귀 기울여보세요.', en: 'What keeps returning is trying to tell you something.\nListen to that voice today.' },
  'ARCANA.11': { ko: '가면을 벗어도 당신은 여전히 충분합니다.\n진짜 나를 보여주는 용기가 진정한 연결을 만듭니다.', en: 'You are enough without the mask.\nShowing your real self is what creates true connection.' },
  'ARCANA.12': { ko: '스스로를 지키는 것은 현명한 일입니다.\n당신의 성벽 안에 아직 발견하지 못한 방이 있습니다.', en: 'Protecting yourself is wisdom.\nThere are rooms within your fortress you have yet to discover.' },
  'ARCANA.13': { ko: '방향을 잃은 것처럼 느껴질 때,\n잠시 멈추는 것이 가장 용감한 선택입니다.', en: 'When you feel lost,\nstopping is the bravest choice you can make.' },
  'ARCANA.14': { ko: '집착을 놓아버릴 때 진짜 안정이 찾아옵니다.\n오늘 하나를 내려놓아보세요.', en: 'Letting go of attachment is where real stability begins.\nTry releasing one thing today.' },
  'ARCANA.15': { ko: '경계를 넘는 것은 두렵지만,\n그 문 너머에 새로운 당신이 기다리고 있습니다.', en: 'Crossing the threshold is frightening,\nbut a new version of you waits on the other side.' },
  'ARCANA.16': { ko: '당신은 이미 날아오를 준비가 되어 있습니다.\n중력을 거슬러 위를 향하세요.', en: 'You are already ready to rise.\nDefy gravity and look upward.' },
  'ARCANA.17': { ko: '당신의 다양한 경험들이 지금 하나로 모이고 있습니다.\n파편들은 아름다운 빛으로 굴절됩니다.', en: 'Your many experiences are converging now.\nThe fragments refract into beautiful light.' },
  'ARCANA.18': { ko: '작은 씨앗 하나가 땅을 뚫고 나오듯,\n당신의 가능성은 이미 시작되었습니다.', en: 'Like a seed breaking through soil,\nyour potential has already begun.' },
  'ARCANA.19': { ko: '답은 이미 당신 안에 있습니다.\n내면의 나침반을 믿으세요.', en: 'The answer is already within you.\nTrust your inner compass.' },
  'ARCANA.20': { ko: '더 이상 싸우지 않아도 됩니다.\n당신은 이미 충분히 평화롭습니다.', en: 'You no longer need to fight.\nYou are already at peace.' },
};

const placeOptions: { label: string; en: string; color: string; svg: (s: string) => React.ReactNode }[] = [
  { label: '나의 집 / 방', en: 'My Home', color: '#6CA575',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: '학교', en: 'School', color: '#729EAB',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="15" y2="22"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/></svg> },
  { label: '직장', en: 'Work', color: '#B08850',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { label: '숲', en: 'Forest', color: '#5A8F5E',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 20 19 4 19"/><line x1="12" y1="19" x2="12" y2="22"/></svg> },
  { label: '바다', en: 'Ocean', color: '#4A90B5',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c1.5 2 3 2 4.5 0S9.5 4 11 6s3 2 4.5 0S18.5 4 20 6"/><path d="M2 12c1.5 2 3 2 4.5 0S9.5 10 11 12s3 2 4.5 0 3-2 4.5 0"/><path d="M2 18c1.5 2 3 2 4.5 0S9.5 16 11 18s3 2 4.5 0 3-2 4.5 0"/></svg> },
  { label: '미로 / 좁은 길', en: 'Maze / Path', color: '#9281BF',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> },
  { label: '완전히 낯선 공간', en: 'Unknown Place', color: '#D67A6B',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { label: '기억나지 않음', en: "Don't Remember", color: '#8A98A8',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg> },
];

const personOptions: { label: string; en: string; color: string; svg: (s: string) => React.ReactNode }[] = [
  { label: '가족', en: 'Family', color: '#D67A6B',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: '연인', en: 'Partner', color: '#E06B8B',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { label: '친구 / 지인', en: 'Friend', color: '#D4A33B',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { label: '모르는 타인', en: 'Stranger', color: '#729EAB',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { label: '비현실적 존재', en: 'Surreal Being', color: '#9281BF',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg> },
  { label: '동물', en: 'Animal', color: '#6CA575',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="9" r="1.5"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg> },
  { label: '나 혼자 (없음)', en: 'Just Me', color: '#8A98A8',
    svg: (s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

// ── Emotion → Arcana card pool mapping
const emotionToArcanaPool: Record<string, string[]> = {
  '무기력': ['ARCANA.01', 'ARCANA.05'],
  'Low':    ['ARCANA.01', 'ARCANA.05'],
  '불안':   ['ARCANA.02', 'ARCANA.11', 'ARCANA.13', 'ARCANA.14'],
  'Anxious':['ARCANA.02', 'ARCANA.11', 'ARCANA.13', 'ARCANA.14'],
  '두려움': ['ARCANA.03', 'ARCANA.12', 'ARCANA.10'],
  'Fear':   ['ARCANA.03', 'ARCANA.12', 'ARCANA.10'],
  '외로움': ['ARCANA.04', 'ARCANA.07', 'ARCANA.10'],
  'Lonely': ['ARCANA.04', 'ARCANA.07', 'ARCANA.10'],
  '분노':   ['ARCANA.06', 'ARCANA.09', 'ARCANA.13'],
  'Anger':  ['ARCANA.06', 'ARCANA.09', 'ARCANA.13'],
  '기쁨':   ['ARCANA.09', 'ARCANA.16', 'ARCANA.20'],
  'Joyful': ['ARCANA.09', 'ARCANA.16', 'ARCANA.20'],
  '평온':   ['ARCANA.08', 'ARCANA.17', 'ARCANA.19', 'ARCANA.20'],
  'Peaceful':['ARCANA.08', 'ARCANA.17', 'ARCANA.19', 'ARCANA.20'],
  '희망':   ['ARCANA.15', 'ARCANA.16', 'ARCANA.18'],
  'Hopeful':['ARCANA.15', 'ARCANA.16', 'ARCANA.18'],
};

// Emotion pebble: exact same color + shape as the emotion selection UI
function getEmotionPebble(emotion: string): { background: string; borderRadius: string } {
  const map: Record<string, { background: string; borderRadius: string }> = {
    '불안':    { background: 'rgba(217,210,233,0.9)', borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%' },
    'Anxious': { background: 'rgba(217,210,233,0.9)', borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%' },
    '두려움':  { background: 'rgba(205,224,230,0.9)', borderRadius: '50% 50% 60% 60% / 40% 40% 70% 70%' },
    'Fear':    { background: 'rgba(205,224,230,0.9)', borderRadius: '50% 50% 60% 60% / 40% 40% 70% 70%' },
    '평온':    { background: 'rgba(181,218,185,0.9)', borderRadius: '50%' },
    'Peaceful':{ background: 'rgba(181,218,185,0.9)', borderRadius: '50%' },
    '기쁨':    { background: 'rgba(253,232,181,0.9)', borderRadius: '45% 55% 45% 55% / 65% 55% 45% 35%' },
    'Joyful':  { background: 'rgba(253,232,181,0.9)', borderRadius: '45% 55% 45% 55% / 65% 55% 45% 35%' },
    '외로움':  { background: 'rgba(214,221,229,0.9)', borderRadius: '50% 50% 40% 40% / 40% 40% 60% 60%' },
    'Lonely':  { background: 'rgba(214,221,229,0.9)', borderRadius: '50% 50% 40% 40% / 40% 40% 60% 60%' },
    '희망':    { background: 'rgba(214,241,208,0.9)', borderRadius: '50% 50% 50% 50% / 70% 70% 40% 40%' },
    'Hopeful': { background: 'rgba(214,241,208,0.9)', borderRadius: '50% 50% 50% 50% / 70% 70% 40% 40%' },
    '분노':    { background: 'rgba(250,209,196,0.9)', borderRadius: '15px 30px 15px 30px' },
    'Anger':   { background: 'rgba(250,209,196,0.9)', borderRadius: '15px 30px 15px 30px' },
    '무기력':  { background: 'rgba(226,232,240,0.9)', borderRadius: '16px' },
    'Low':     { background: 'rgba(226,232,240,0.9)', borderRadius: '16px' },
  };
  return map[emotion] ?? { background: 'rgba(181,218,185,0.9)', borderRadius: '50%' };
}

// Deterministic card selection: same card for same user on same day
function selectArcanaId(emotion: string, userId?: string): string {
  const pool = emotionToArcanaPool[emotion] ?? ['ARCANA.18'];
  const today = new Date().toISOString().split('T')[0];
  const dateSeed = today.split('-').reduce((a: number, n: string) => a + parseInt(n, 10), 0);
  const userSeed = (userId ?? 'guest').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
  return pool[(dateSeed + userSeed) % pool.length];
}

// ── SVG art children for each arcana card (200×290 viewBox)
function arcanaArtChildren(id: string): React.ReactNode {
  switch (id) {
    case 'ARCANA.01': return (<>
      <defs><radialGradient id="a01g" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(0,0,0,0)" /><stop offset="100%" stopColor="rgba(0,0,0,0.5)" /></radialGradient></defs>
      <rect width="200" height="290" fill="url(#a01g)" />
      <circle cx="100" cy="145" r="70" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="100" cy="145" r="40" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
      <circle cx="100" cy="145" r="14" fill="rgba(255,255,255,0.1)" />
    </>);
    case 'ARCANA.02': return (<>
      {[90,68,48,30].map((r,i) => <circle key={i} cx="100" cy="145" r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray={`${r*0.33} ${r*0.13} ${r*0.13} ${r*0.08}`} strokeDashoffset={i*22} />)}
      <line x1="100" y1="55" x2="100" y2="82" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 5" />
      <line x1="130" y1="145" x2="157" y2="145" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 5" />
    </>);
    case 'ARCANA.03': return (<>
      {[{y:92,h:20,dx:0},{y:112,h:14,dx:10},{y:126,h:22,dx:-8},{y:148,h:16,dx:5},{y:164,h:20,dx:-12},{y:184,h:14,dx:3}].map((s,i) =>
        <rect key={i} x={50+s.dx} y={s.y} width={100} height={s.h} fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" />)}
    </>);
    case 'ARCANA.04': return (<>
      <defs><filter id="a04f"><feGaussianBlur stdDeviation="14" /></filter></defs>
      <ellipse cx="100" cy="145" rx="80" ry="65" fill="rgba(255,255,255,0.2)" filter="url(#a04f)" />
      <ellipse cx="78" cy="128" rx="55" ry="44" fill="rgba(255,255,255,0.15)" filter="url(#a04f)" />
      <ellipse cx="118" cy="162" rx="60" ry="50" fill="rgba(255,255,255,0.12)" filter="url(#a04f)" />
      <circle cx="100" cy="145" r="22" fill="rgba(255,255,255,0.18)" filter="url(#a04f)" />
    </>);
    case 'ARCANA.05': return (<>
      {[0,1,2,3,4,5,6,7,8,9].map(i => <line key={`h${i}`} x1="20" y1={30+i*25} x2="180" y2={30+i*25} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
      {[0,1,2,3,4,5,6].map(i => <line key={`v${i}`} x1={20+i*27} y1="30" x2={20+i*27} y2="260" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />)}
      <rect x="50" y="168" width="100" height="72" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <line x1="100" y1="118" x2="100" y2="166" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <polyline points="93,158 100,166 107,158" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
    </>);
    case 'ARCANA.06': return (<>
      <path d="M-10 108 Q25 68 58 108 Q91 148 124 108 Q157 68 200 108" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <path d="M-10 145 Q28 90 62 145 Q96 200 130 145 Q164 90 200 145" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      <path d="M-10 182 Q25 152 58 182 Q91 212 124 182 Q157 152 200 182" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
    </>);
    case 'ARCANA.07': return (<>
      <line x1="20" y1="145" x2="180" y2="145" stroke="rgba(255,255,255,0.38)" strokeWidth="0.8" />
      <path d="M22 145 Q52 108 82 145 Q112 182 142 145 Q167 118 182 132" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d="M22 145 Q52 182 82 145 Q112 108 142 145 Q167 172 182 158" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
    </>);
    case 'ARCANA.08': return (<>
      <path d="M10 158 Q35 148 62 158 Q89 168 116 158 Q143 148 170 158 Q185 164 200 158" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.2" />
      <path d="M10 170 Q35 162 62 170 Q89 178 116 170 Q143 162 170 170 Q185 175 200 170" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <path d="M10 181 Q35 173 62 181 Q89 189 116 181 Q143 173 170 181 Q185 186 200 181" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
      {([[48,142],[90,134],[132,140],[68,150],[110,144],[152,138]] as [number,number][]).map(([x,y],i) => <circle key={i} cx={x} cy={y} r="2" fill="rgba(255,255,255,0.55)" />)}
      <ellipse cx="100" cy="118" rx="32" ry="14" fill="rgba(255,240,200,0.15)" />
    </>);
    case 'ARCANA.09': return (<>
      {Array.from({length:16},(_,i) => { const a=(i*22.5)*Math.PI/180,len=44+(i%3)*22,gap=14; return <line key={i} x1={100+Math.cos(a)*gap} y1={145+Math.sin(a)*gap} x2={100+Math.cos(a)*(gap+len)} y2={145+Math.sin(a)*(gap+len)} stroke={`rgba(255,255,255,${0.18+(i%2)*0.18})`} strokeWidth={i%3===0?1.5:0.8} strokeLinecap="round" />; })}
      <circle cx="100" cy="145" r="10" fill="rgba(255,255,255,0.45)" />
      <circle cx="100" cy="145" r="5" fill="rgba(255,255,255,0.85)" />
    </>);
    case 'ARCANA.10': return (<>
      {[10,26,44,62,80,98].map((r,i) => <circle key={i} cx="100" cy="145" r={r} fill="none" stroke={`rgba(255,255,255,${0.44-i*0.062})`} strokeWidth={1.5-i*0.15} />)}
      <circle cx="100" cy="145" r="5" fill="rgba(255,255,255,0.58)" />
    </>);
    case 'ARCANA.11': return (<>
      <circle cx="100" cy="145" r="56" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.48)" strokeWidth="1" />
      <rect x="28" y="82" width="144" height="126" rx="4" fill="rgba(200,210,230,0.38)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <circle cx="100" cy="145" r="56" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </>);
    case 'ARCANA.12': return (<>
      <polygon points="100,78 152,108 100,138 48,108" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
      <polygon points="48,108 100,138 100,198 48,168" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <polygon points="100,138 152,108 152,168 100,198" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.33)" strokeWidth="1" />
      <line x1="74" y1="93" x2="74" y2="153" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1="126" y1="93" x2="126" y2="153" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1="100" y1="78" x2="100" y2="138" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
    </>);
    case 'ARCANA.13': return (<>
      {Array.from({length:8},(_,i) => { const a1=(i*45)*Math.PI/180,a2=(i*45+35)*Math.PI/180,r=60,ox=(i%3-1)*6,oy=(i%2)*5; return <path key={i} d={`M${100+ox+Math.cos(a1)*r} ${145+oy+Math.sin(a1)*r} A${r} ${r} 0 0 1 ${100+ox+Math.cos(a2)*r} ${145+oy+Math.sin(a2)*r}`} fill="none" stroke={`rgba(255,255,255,${0.22+(i%2)*0.16})`} strokeWidth="2" strokeLinecap="round" />; })}
      <line x1="95" y1="128" x2="95" y2="165" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <line x1="78" y1="148" x2="116" y2="148" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
    </>);
    case 'ARCANA.14': return (<>
      <line x1="100" y1="58" x2="100" y2="172" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
      <circle cx="100" cy="58" r="8" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
      <rect x="58" y="172" width="84" height="58" rx="3" fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.44)" strokeWidth="1.5" />
    </>);
    case 'ARCANA.15': return (<>
      <defs><linearGradient id="a15g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(255,255,255,0.92)" /><stop offset="100%" stopColor="rgba(255,255,255,0.22)" /></linearGradient></defs>
      <rect x="0" y="48" width="88" height="200" fill="rgba(0,0,0,0.52)" />
      <rect x="112" y="48" width="88" height="200" fill="rgba(0,0,0,0.52)" />
      <rect x="88" y="48" width="24" height="200" fill="url(#a15g)" />
    </>);
    case 'ARCANA.16': return (<>
      <defs><filter id="a16g"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <path d="M22 232 Q58 202 78 162 Q98 122 128 92 Q152 66 175 46" fill="none" stroke="rgba(255,255,255,0.52)" strokeWidth="2" filter="url(#a16g)" />
      <path d="M32 238 Q68 208 88 168 Q108 128 138 98 Q162 72 185 52" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      {([[64,202],[88,162],[114,122],[140,90]] as [number,number][]).map(([x,y],i) => <circle key={i} cx={x} cy={y} r={4-i*0.5} fill="rgba(255,255,255,0.7)" filter="url(#a16g)" />)}
    </>);
    case 'ARCANA.17': return (<>
      <polygon points="100,78 148,145 100,212 52,145" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.44)" strokeWidth="1.2" />
      <line x1="100" y1="78" x2="100" y2="212" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
      <line x1="52" y1="145" x2="148" y2="145" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
      <line x1="148" y1="145" x2="188" y2="118" stroke="rgba(255,220,180,0.5)" strokeWidth="1" />
      <line x1="148" y1="145" x2="188" y2="145" stroke="rgba(200,220,255,0.5)" strokeWidth="1" />
      <line x1="148" y1="145" x2="188" y2="172" stroke="rgba(220,180,255,0.5)" strokeWidth="1" />
      <line x1="100" y1="78" x2="100" y2="42" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
    </>);
    case 'ARCANA.18': return (<>
      <defs><radialGradient id="a18g" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,255,255,0.88)" /><stop offset="14%" stopColor="rgba(255,255,255,0.28)" /><stop offset="50%" stopColor="rgba(255,255,255,0.05)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></radialGradient></defs>
      <circle cx="100" cy="145" r="82" fill="url(#a18g)" />
      <circle cx="100" cy="145" r="5" fill="rgba(255,255,255,0.95)" />
      {([[42,78],[160,68],[35,188],[165,198],[74,48],[132,238],[50,232],[158,38]] as [number,number][]).map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1" fill={`rgba(255,255,255,${0.25+(i%3)*0.1})`} />)}
    </>);
    case 'ARCANA.19': return (<>
      <circle cx="100" cy="145" r="62" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      <circle cx="100" cy="145" r="9" fill="rgba(255,255,255,0.32)" />
      <line x1="100" y1="83" x2="100" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="100" y1="207" x2="100" y2="252" stroke="rgba(255,255,255,0.38)" strokeWidth="1" strokeLinecap="round" />
      <line x1="38" y1="145" x2="162" y2="145" stroke="rgba(255,255,255,0.38)" strokeWidth="1" strokeLinecap="round" />
      <polygon points="100,38 94,54 106,54" fill="rgba(255,255,255,0.58)" />
      {[0,45,90,135,180,225,270,315].map(deg => { const rad=deg*Math.PI/180; return <line key={deg} x1={100+Math.cos(rad)*56} y1={145+Math.sin(rad)*56} x2={100+Math.cos(rad)*62} y2={145+Math.sin(rad)*62} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />; })}
    </>);
    case 'ARCANA.20': return (<>
      <defs><linearGradient id="a20g" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(255,255,255,0.16)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient></defs>
      <rect x="0" y="0" width="200" height="158" fill="url(#a20g)" />
      <line x1="18" y1="158" x2="182" y2="158" stroke="rgba(255,255,255,0.62)" strokeWidth="1.2" />
      <ellipse cx="100" cy="158" rx="82" ry="6" fill="rgba(255,255,255,0.1)" />
    </>);
    default: return null;
  }
}

// ── Standalone sub-components (must be outside MoodCardFlow to avoid remount on each render)

const ProgressBar = ({ pct }: { pct: number }) => (
  <div style={{ width: '100%', height: '3px', background: 'rgba(0,0,0,0.06)', borderRadius: '2px', marginBottom: '28px', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${pct}%`, background: '#7AB382', borderRadius: '2px', transition: 'width 0.4s ease' }} />
  </div>
);

const Chip = ({ label, svg, color, selected, onClick }: { label: string; svg?: (stroke: string) => React.ReactNode; color?: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 16px',
      borderRadius: '20px',
      border: selected ? '1.5px solid #7AB382' : '1.5px solid rgba(255,255,255,0.9)',
      background: selected ? '#7AB382' : 'rgba(255,255,255,0.65)',
      color: '#4A5D4E',
      fontSize: '13px',
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.22s ease',
      boxShadow: selected ? '0 4px 12px rgba(122,179,130,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}
  >
    {svg && svg(selected ? '#fff' : (color ?? '#4A5D4E'))}
    <span style={{ color: selected ? '#fff' : '#4A5D4E' }}>{label}</span>
  </button>
);

const Container = ({ children, onBack, onClose }: { children: React.ReactNode; onBack?: () => void; onClose: () => void }) => (
  <div style={{
    width: '90%', maxWidth: '360px',
    background: '#EAF4EC',
    borderRadius: '32px',
    padding: '56px 24px 36px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    position: 'relative',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: '16px', left: '16px',
          width: '32px', height: '32px',
          background: 'rgba(0,0,0,0.06)',
          border: 'none', borderRadius: '50%',
          cursor: 'pointer',
          color: '#4A5D4E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    )}
    <button
      onClick={onClose}
      style={{
        position: 'absolute', top: '16px', right: '16px',
        width: '32px', height: '32px',
        background: 'rgba(0,0,0,0.06)',
        border: 'none', borderRadius: '50%',
        cursor: 'pointer', fontSize: '13px',
        color: '#4A5D4E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >✕</button>
    {children}
  </div>
);

export default function MoodCardFlow({ selectedEmotion, language, onClose, user, onRequestLogin, onEmotionLogged }: MoodCardFlowProps) {
  const [step, setStep] = useState<FlowStep>('blurred');
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [customPlace, setCustomPlace] = useState('');
  const [showCustomPlace, setShowCustomPlace] = useState(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [customPerson, setCustomPerson] = useState('');
  const [showCustomPerson, setShowCustomPerson] = useState(false);
  const [sceneText, setSceneText] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [analysisKeywords, setAnalysisKeywords] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  const [isEgoMode, setIsEgoMode] = useState(false);
  const [selectedSleep, setSelectedSleep] = useState('');
  const [selectedStress, setSelectedStress] = useState('');
  const [egoFreeText, setEgoFreeText] = useState('');
  const [isRecordingScene, setIsRecordingScene] = useState(false);
  const [isRecordingEgo, setIsRecordingEgo] = useState(false);

  const canUseVoice = speechSupported();
  const sceneRecognitionRef = useRef<SpeechSession | null>(null);
  const egoRecognitionRef = useRef<SpeechSession | null>(null);

  const startSceneVoice = async () => {
    setIsRecordingScene(true);
    sceneRecognitionRef.current = await startListening({
      language,
      onResult: (text) => setSceneText(text),
      onEnd: () => setIsRecordingScene(false),
    });
  };

  const startEgoVoice = async () => {
    setIsRecordingEgo(true);
    egoRecognitionRef.current = await startListening({
      language,
      onResult: (text) => setEgoFreeText(text),
      onEnd: () => setIsRecordingEgo(false),
    });
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setNickname(data.full_name);
        else setNickname(user.email?.split('@')[0] ?? '');
      });
  }, [user]);

  const togglePlace = (label: string) => {
    setSelectedPlaces(prev =>
      prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]
    );
    setShowCustomPlace(false);
  };

  const togglePerson = (label: string) => {
    setSelectedPersons(prev =>
      prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]
    );
    setShowCustomPerson(false);
  };

  const arcanaId = selectArcanaId(selectedEmotion, user?.id);
  const card = arcanaCards[arcanaId] ?? arcanaCards['ARCANA.18'];
  const isKo = language === 'ko';
  const affirmation = arcanaAffirmations[arcanaId]?.[isKo ? 'ko' : 'en'] ?? (isKo ? '오늘도 당신은 충분합니다.' : 'You are enough today.');

  const handleFinishRecord = async () => {
    // Check usage limits before analyzing
    if (!user) {
      if (typeof window !== 'undefined' && localStorage.getItem('moodcard_guest_used')) {
        setStep('revealed');
        setShowLoginPrompt(true);
        return;
      }
    } else {
      const canUse = await canAnalyzeDream(user.id);
      if (!canUse.allowed) {
        setUsageLimitReached(true);
        setStep('revealed');
        return;
      }
    }

    setStep('analyzing');

    const places = showCustomPlace ? (customPlace ? [customPlace] : []) : selectedPlaces;
    const persons = showCustomPerson ? (customPerson ? [customPerson] : []) : selectedPersons;

    const analysisResult = await (async () => {
      try {
        const dreamTextForAnalysis = [
          sceneText || '',
          places.length > 0 ? `장소: ${places.join(', ')}` : '',
          persons.length > 0 ? `등장인물: ${persons.join(', ')}` : '',
          `감정: ${selectedEmotion}`,
        ].filter(Boolean).join('\n');

        if (dreamTextForAnalysis.length < 10) return null;

        const res = await fetch('/api/analyze-dream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
          body: JSON.stringify({
            dreamText: dreamTextForAnalysis,
            language,
          }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })();

    const analysisText = analysisResult?.analysis ?? '';
    const analysisKeywordsResult = analysisResult?.autoTags ?? [];
    if (analysisText) {
      setAnalysisText(analysisText);
      setAnalysisKeywords(analysisKeywordsResult);
      if (user) {
        recordAIUsage(user.id, undefined, 'moodcard_analysis');
      } else {
        localStorage.setItem('moodcard_guest_used', '1');
      }
    }
    setStep('revealed');
  };

  const handleFinishEgo = async () => {
    if (!user) {
      if (typeof window !== 'undefined' && localStorage.getItem('moodcard_guest_used')) {
        setStep('revealed'); setShowLoginPrompt(true); return;
      }
    } else {
      const canUse = await canAnalyzeDream(user.id);
      if (!canUse.allowed) { setUsageLimitReached(true); setStep('revealed'); return; }
    }

    const egoText = [
      `감정: ${selectedEmotion}`,
      selectedSleep ? `수면: ${selectedSleep}` : '',
      selectedStress ? `스트레스: ${selectedStress}` : '',
      egoFreeText ? egoFreeText : '',
    ].filter(Boolean).join('\n');

    // No free text → skip API, just show results
    if (!egoFreeText.trim()) {
      if (!user) localStorage.setItem('moodcard_guest_used', '1');
      setStep('revealed');
      return;
    }

    setStep('analyzing');
    try {
      // Send user's free text as the main focus; sleep/stress as context only
      const contextNote = [
        selectedSleep ? (isKo ? `[수면 상태: ${selectedSleep}]` : `[Sleep: ${selectedSleep}]`) : '',
        selectedStress ? (isKo ? `[스트레스 수준: ${selectedStress}]` : `[Stress: ${selectedStress}]`) : '',
      ].filter(Boolean).join(' ');
      const dreamTextForApi = contextNote
        ? `${egoFreeText}\n\n(${contextNote})`
        : egoFreeText;
      const res = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
        body: JSON.stringify({ dreamText: dreamTextForApi, language, mode: 'ego' }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAnalysisText(data.analysis);
        setAnalysisKeywords(data.autoTags ?? []);
      } else if (!res.ok) {
        console.error('[EgoAnalysis] API error:', res.status, data);
      }
      if (user) {
        if (res.ok && data.analysis) recordAIUsage(user.id, undefined, 'moodcard_analysis');
      } else {
        localStorage.setItem('moodcard_guest_used', '1');
      }
    } catch (err) {
      console.error('[EgoAnalysis] Unexpected error:', err);
    }
    setStep('revealed');
  };

  const handleSave = async () => {
    if (!user || saved || saving) return;
    setSaving(true);
    try {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);

      if (isEgoMode) {
        const egoRecord = [
          `감정: ${selectedEmotion}`,
          selectedSleep ? `수면: ${selectedSleep}` : '',
          selectedStress ? `스트레스: ${selectedStress}` : '',
          egoFreeText || '',
        ].filter(Boolean).join('\n');
        const egoContent = analysisText
          ? `[감정 기록] ${egoRecord}\n\n---\n\nAnalysis:\n${analysisText}`
          : `[감정 기록] ${egoRecord}`;
        const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const { error: egoError } = await supabase.from('dreams').insert({
          user_id: user.id,
          title: selectedEmotion,
          content: egoContent,
          mood: selectedEmotion,
          tags: ['emotion-record', selectedEmotion],
          date: dateStr,
          time: timeStr,
        });
        if (egoError) throw egoError;
      } else {
        const places = showCustomPlace ? (customPlace ? [customPlace] : []) : selectedPlaces;
        const persons = showCustomPerson ? (customPerson ? [customPerson] : []) : selectedPersons;
        const originalRecord = [
          `감정: ${selectedEmotion}`,
          places.length > 0 ? `장소: ${places.join(', ')}` : '',
          persons.length > 0 ? `등장인물: ${persons.join(', ')}` : '',
          sceneText ? `핵심 장면: ${sceneText}` : '',
        ].filter(Boolean).join('\n');
        const content = analysisText
          ? `${originalRecord}\n\n---\n\nAnalysis:\n${analysisText}`
          : originalRecord;
        const { error: moodError } = await supabase.from('dreams').insert([{
          user_id: user.id,
          title: `${selectedEmotion} — ${card.name}`,
          content: `[감정 기록] ${content}`,
          mood: selectedEmotion,
          tags: ['emotion-record', selectedEmotion, ...analysisKeywords.slice(0, 2)],
          date: now.toISOString().split('T')[0],
          time: timeStr,
        }]);
        if (moodError) throw moodError;
      }
      setSaved(true);
      if (onEmotionLogged) onEmotionLogged();
      await addSingleAffirmation(user.id, affirmation, language);
      setTimeout(() => onClose(), 800);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Abstract card visual (gradient + floating shapes)
  const CardVisual = ({ blurred }: { blurred: boolean }) => (
    <div style={{
      width: '200px',
      height: '290px',
      borderRadius: '20px',
      background: `linear-gradient(145deg, ${card.from} 0%, ${card.mid} 50%, ${card.to} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: blurred
        ? '0 16px 40px rgba(0,0,0,0.12)'
        : '0 20px 50px rgba(0,0,0,0.18)',
      border: '1px solid rgba(255,255,255,0.8)',
      flexShrink: 0,
    }}>
      {/* Unique arcana art */}
      <svg width="100%" height="100%" viewBox="0 0 200 290" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0 }}>
        {arcanaArtChildren(arcanaId)}
      </svg>

      {/* Blur overlay */}
      {blurred && (
        <div style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: 'rgba(234,244,236,0.35)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '10px',
        }}>
          <div style={{ fontSize: '32px', opacity: 0.5 }}>🔒</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px', color: '#4A5D4E', opacity: 0.7 }}>UNCONSCIOUS</div>
        </div>
      )}

      {/* Card info (revealed only) */}
      {!blurred && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '30px 16px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#7AB382', letterSpacing: '1px', marginBottom: '4px' }}>{card.arcana}</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{card.name}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>{card.kr}</div>
        </div>
      )}
    </div>
  );

  // ==============================
  // STEP: blurred card
  // ==============================
  if (step === 'blurred') return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 21000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <Container onClose={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: '14px', color: '#8BA390', marginBottom: '6px', fontFamily: 'monospace', letterSpacing: '1px' }}>
            Hidden Signal
          </p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#4A5D4E', marginBottom: '24px', textAlign: 'center', lineHeight: 1.5 }}>
            {isKo
              ? `'${selectedEmotion}' 이면에 숨겨진 오늘의 카드`
              : `Today's card behind '${selectedEmotion}'`}
          </p>

          <CardVisual blurred />

          <div style={{ marginTop: '32px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* Button 1: Dream recording */}
            <button
              onClick={() => { setIsEgoMode(false); setStep('record-place'); }}
              style={{
                width: '88%', padding: '15px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #7AB382 0%, #5C8D63 100%)',
                color: '#fff', border: 'none',
                fontSize: '14px', fontWeight: 700,
                boxShadow: '0 8px 20px rgba(122,179,130,0.3)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <span>{isKo ? '꿈을 기억하나요?' : 'Did you remember your dream?'}</span>
              <svg style={{ position: 'absolute', right: 20 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Button 2: Ego check-in */}
            <button
              onClick={() => { setIsEgoMode(true); setStep('ego-sleep'); }}
              style={{
                width: '88%', padding: '14px 20px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.6)',
                border: '1.5px solid rgba(122,179,130,0.4)',
                color: '#4A5D4E', fontSize: '13px', fontWeight: 600,
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}
            >
              <span>{isKo ? '감정 체크하기' : 'Check your mood'}</span>
              <svg style={{ position: 'absolute', right: 20 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </button>
          </div>
        </div>
      </Container>
    </div>
  );

  // ==============================
  // STEP: record-place
  // ==============================
  if (step === 'record-place') return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 21000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <Container onBack={() => setStep('blurred')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={33} />
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: '8px' }}>
            {isKo ? '어떤 장소였나요?' : 'Where was it?'}
          </p>
          <p style={{ fontSize: '12px', color: '#8BA390', textAlign: 'center', marginBottom: '24px' }}>
            {isKo ? '여러 개 선택할 수 있어요' : 'You can select multiple'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            {placeOptions.map((opt) => {
              const label = isKo ? opt.label : opt.en;
              return (
                <Chip
                  key={opt.label}
                  label={label}
                  svg={opt.svg}
                  color={opt.color}
                  selected={selectedPlaces.includes(label) && !showCustomPlace}
                  onClick={() => togglePlace(label)}
                />
              );
            })}
            <Chip
              label={isKo ? '기타 (직접 입력)' : 'Other'}
              svg={(s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
              selected={showCustomPlace}
              onClick={() => { setShowCustomPlace(v => !v); }}
            />
          </div>

          {showCustomPlace && (
            <input
              autoFocus
              value={customPlace}
              onChange={e => setCustomPlace(e.target.value)}
              placeholder={isKo ? '어떤 장소였는지 입력해주세요' : 'Describe the place...'}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.8)',
                border: '1.5px solid #7AB382', borderRadius: '12px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />
          )}

          <button
            onClick={() => setStep('record-person')}
            disabled={selectedPlaces.length === 0 && !customPlace}
            style={{
              width: '100%', padding: '14px',
              background: (selectedPlaces.length > 0 || customPlace) ? '#4A5D4E' : 'rgba(0,0,0,0.1)',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 700,
              cursor: (selectedPlaces.length > 0 || customPlace) ? 'pointer' : 'not-allowed',
              marginTop: '8px',
            }}
          >
            {isKo ? '다음' : 'Next'}
          </button>
        </div>
      </Container>
    </div>
  );

  // ==============================
  // STEP: record-person
  // ==============================
  if (step === 'record-person') return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 21000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <Container onBack={() => setStep('record-place')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={66} />
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: '8px' }}>
            {isKo ? '누가 나왔나요?' : 'Who appeared?'}
          </p>
          <p style={{ fontSize: '12px', color: '#8BA390', textAlign: 'center', marginBottom: '24px' }}>
            {isKo ? '여러 명 선택할 수 있어요' : 'You can select multiple'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            {personOptions.map((opt) => {
              const label = isKo ? opt.label : opt.en;
              return (
                <Chip
                  key={opt.label}
                  label={label}
                  svg={opt.svg}
                  color={opt.color}
                  selected={selectedPersons.includes(label) && !showCustomPerson}
                  onClick={() => togglePerson(label)}
                />
              );
            })}
            <Chip
              label={isKo ? '기타 (직접 입력)' : 'Other'}
              svg={(s) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
              selected={showCustomPerson}
              onClick={() => { setShowCustomPerson(v => !v); }}
            />
          </div>

          {showCustomPerson && (
            <input
              autoFocus
              value={customPerson}
              onChange={e => setCustomPerson(e.target.value)}
              placeholder={isKo ? '어떤 존재였는지 입력해주세요' : 'Describe who appeared...'}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.8)',
                border: '1.5px solid #7AB382', borderRadius: '12px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />
          )}

          <button
            onClick={() => setStep('record-scene')}
            disabled={selectedPersons.length === 0 && !customPerson}
            style={{
              width: '100%', padding: '14px',
              background: (selectedPersons.length > 0 || customPerson) ? '#4A5D4E' : 'rgba(0,0,0,0.1)',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 700,
              cursor: (selectedPersons.length > 0 || customPerson) ? 'pointer' : 'not-allowed',
              marginTop: '8px',
            }}
          >
            {isKo ? '다음' : 'Next'}
          </button>
        </div>
      </Container>
    </div>
  );

  // ==============================
  // STEP: record-scene
  // ==============================
  if (step === 'record-scene') return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 21000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <Container onBack={() => setStep('record-person')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={100} />
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: '8px' }}>
            {isKo ? '무엇을 하고 있었나요?' : 'What were you doing?'}
          </p>
          <p style={{ fontSize: '12px', color: '#8BA390', textAlign: 'center', marginBottom: '24px' }}>
            {isKo ? '핵심 장면을 짧게 적어주세요' : 'Briefly describe the key scene'}
          </p>

          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <textarea
              value={isRecordingScene ? (isKo ? '음성 인식 중...' : 'Listening...') : sceneText}
              onChange={e => setSceneText(e.target.value)}
              placeholder={isKo
                ? '예: 누군가에게 쫓기다가 갑자기 하늘을 날았다.'
                : 'e.g. I was being chased, then suddenly I could fly.'}
              disabled={isRecordingScene}
              style={{
                width: '100%', height: '110px',
                background: 'rgba(255,255,255,0.65)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                borderRadius: '14px', padding: '14px', paddingBottom: '44px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                resize: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#7AB382'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.9)'; }}
            />
            {canUseVoice && (
            <button
              type="button"
              onClick={() => {
                if (isRecordingScene) { sceneRecognitionRef.current?.stop(); }
                else startSceneVoice();
              }}
              style={{
                position: 'absolute', bottom: '10px', right: '10px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none',
                background: isRecordingScene ? 'rgba(255,68,68,0.12)' : 'rgba(122,179,130,0.15)',
                color: isRecordingScene ? '#ff4444' : '#7AB382',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={isRecordingScene ? (isKo ? '녹음 중지' : 'Stop') : (isKo ? '음성 입력' : 'Voice input')}
            >
              {isRecordingScene ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              )}
            </button>
            )}
          </div>

          <button
            onClick={handleFinishRecord}
            style={{
              width: '100%', padding: '14px',
              background: '#4A5D4E',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {isKo ? '카드 열기' : 'Reveal card'}
          </button>
        </div>
      </Container>
    </div>
  );

  // ==============================
  // STEP: analyzing (loading)
  // ==============================
  if (step === 'analyzing') return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 21000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '10px', height: '10px',
            borderRadius: '50%',
            background: '#EAF4EC',
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );

  // ==============================
  // STEP: ego-sleep / ego-stress / ego-free — condition check-in
  // ==============================
  const egoBackdrop = { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 21000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };

  const EgoChip = ({ label, value, setter, svg }: { label: string; value: string; setter: (v: string) => void; svg: React.ReactNode }) => (
    <button
      onClick={() => setter(label)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 20,
        background: value === label ? '#4A5D4E' : 'rgba(255,255,255,0.6)',
        color: value === label ? '#fff' : '#4A5D4E',
        border: value === label ? 'none' : '1px solid rgba(255,255,255,0.9)',
        fontSize: 13, fontWeight: value === label ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: value === label ? '0 6px 14px rgba(74,93,78,0.25)' : '0 3px 8px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ display: 'flex', color: value === label ? '#fff' : '#7AB382' }}>{svg}</span>
      {label}
    </button>
  );

  if (step === 'ego-sleep') return (
    <div style={egoBackdrop}>
      <Container onBack={() => setStep('blurred')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={33} />
          <p style={{ fontSize: 18, fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: 8 }}>
            {isKo ? '간밤의 수면은 어땠나요?' : 'How did you sleep last night?'}
          </p>
          <p style={{ fontSize: 13, color: '#8BA390', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
            {isKo ? '무의식의 에너지가 얼마나 충전되었는지 확인합니다' : 'Check how recharged your unconscious energy is'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {([
              { label: isKo ? '아주 푹 잤어요' : 'Slept great', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
              { label: isKo ? '평범했어요' : 'Average', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label: isKo ? '계속 뒤척였어요' : 'Restless', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { label: isKo ? '거의 못 잤어요' : 'Barely slept', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><line x1="1" y1="1" x2="23" y2="23"/></svg> },
            ] as {label:string;svg:React.ReactNode}[]).map(o => (
              <EgoChip key={o.label} label={o.label} value={selectedSleep} setter={setSelectedSleep} svg={o.svg} />
            ))}
          </div>
          <button
            onClick={() => setStep('ego-stress')}
            disabled={!selectedSleep}
            style={{ width: '100%', padding: '15px', borderRadius: 16, background: selectedSleep ? '#4A5D4E' : 'rgba(74,93,78,0.2)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: selectedSleep ? 'pointer' : 'default', boxShadow: selectedSleep ? '0 8px 20px rgba(74,93,78,0.2)' : 'none' }}>
            {isKo ? '다음' : 'Next'}
          </button>
        </div>
      </Container>
    </div>
  );

  if (step === 'ego-stress') return (
    <div style={egoBackdrop}>
      <Container onBack={() => setStep('ego-sleep')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={66} />
          <p style={{ fontSize: 18, fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: 8 }}>
            {isKo ? '현재 체감하는 스트레스는?' : "What's your current stress level?"}
          </p>
          <p style={{ fontSize: 13, color: '#8BA390', textAlign: 'center', marginBottom: 28, lineHeight: 1.5 }}>
            {isKo ? '그림자(Shadow)가 억압하고 있는 무게를 확인합니다' : 'Check the weight your Shadow is suppressing'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {([
              { label: isKo ? '아주 가벼움' : 'Very light', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
              { label: isKo ? '적당한 긴장감' : 'Some tension', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
              { label: isKo ? '조금 지침' : 'A bit drained', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
              { label: isKo ? '무언가 짓누르는 느낌' : 'Weighed down', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
            ] as {label:string;svg:React.ReactNode}[]).map(o => (
              <EgoChip key={o.label} label={o.label} value={selectedStress} setter={setSelectedStress} svg={o.svg} />
            ))}
          </div>
          <button
            onClick={() => setStep('ego-free')}
            disabled={!selectedStress}
            style={{ width: '100%', padding: '15px', borderRadius: 16, background: selectedStress ? '#4A5D4E' : 'rgba(74,93,78,0.2)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: selectedStress ? 'pointer' : 'default', boxShadow: selectedStress ? '0 8px 20px rgba(74,93,78,0.2)' : 'none' }}>
            {isKo ? '다음' : 'Next'}
          </button>
        </div>
      </Container>
    </div>
  );

  if (step === 'ego-free') return (
    <div style={egoBackdrop}>
      <Container onBack={() => setStep('ego-stress')} onClose={onClose}>
        <div style={{ width: '100%' }}>
          <ProgressBar pct={100} />
          <p style={{ fontSize: 18, fontWeight: 700, color: '#4A5D4E', textAlign: 'center', marginBottom: 8 }}>
            {isKo ? '지금 느껴지는 감정을 적어보세요' : 'Write about what you\'re feeling right now'}
          </p>
          <p style={{ fontSize: 13, color: '#8BA390', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
            {isKo ? '감정의 원인이나 몸의 감각도 함께 적어도 좋아요 (선택)' : 'You can also describe the cause or a physical sensation (optional)'}
          </p>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <textarea
              value={isRecordingEgo ? (isKo ? '음성 인식 중...' : 'Listening...') : egoFreeText}
              onChange={e => setEgoFreeText(e.target.value)}
              placeholder={isKo ? '예: 오늘 중요한 회의가 있어서 명치가 답답하다.' : 'e.g. Big meeting today, feeling tightness in my chest.'}
              disabled={isRecordingEgo}
              rows={4}
              style={{ width: '100%', borderRadius: 14, border: '1.5px solid rgba(122,179,130,0.3)', background: 'rgba(255,255,255,0.7)', padding: '14px 16px', paddingBottom: '44px', fontSize: 14, lineHeight: 1.7, color: '#4A5D4E', resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {canUseVoice && (
            <button
              type="button"
              onClick={() => {
                if (isRecordingEgo) { egoRecognitionRef.current?.stop(); }
                else startEgoVoice();
              }}
              style={{
                position: 'absolute', bottom: '10px', right: '10px',
                width: '32px', height: '32px', borderRadius: '50%',
                border: 'none',
                background: isRecordingEgo ? 'rgba(255,68,68,0.12)' : 'rgba(122,179,130,0.15)',
                color: isRecordingEgo ? '#ff4444' : '#7AB382',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              title={isRecordingEgo ? (isKo ? '녹음 중지' : 'Stop') : (isKo ? '음성 입력' : 'Voice input')}
            >
              {isRecordingEgo ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              )}
            </button>
            )}
          </div>
          <button
            onClick={handleFinishEgo}
            style={{ width: '100%', padding: '15px', borderRadius: 16, background: 'linear-gradient(135deg, #7AB382 0%, #5C8D63 100%)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(122,179,130,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {isKo ? '카드 열기' : 'Reveal card'}
          </button>
        </div>
      </Container>
    </div>
  );

  // ==============================
  // STEP: revealed — bottom-sheet journal card
  // ==============================
  const username = nickname || user?.email?.split('@')[0] || 'you';
  const dateStr = new Date().toLocaleDateString(isKo ? 'ko-KR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const places = showCustomPlace ? (customPlace ? [customPlace] : []) : selectedPlaces;
  const persons = showCustomPerson ? (customPerson ? [customPerson] : []) : selectedPersons;
  const recordKeywords = [...places, ...persons].join(', ') || (sceneText ? sceneText.slice(0, 40) : '');

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(74,93,78,0.2)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      zIndex: 21000,
    }}>
      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '90%',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '32px 32px 0 0',
        borderTop: '1px solid rgba(255,255,255,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(74,93,78,0.12)',
        overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, zIndex: 40 }} />

        {/* Action bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px 24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4A5D4E', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          </div>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4A5D4E', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Visual header — tarot card only */}
        <div style={{
          width: '100%', height: '38%', position: 'relative', flexShrink: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12,
          background: `radial-gradient(circle at 50% 100%, ${card.from}55 0%, transparent 70%)`,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          paddingTop: 28,
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 160, background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }} />
          <div style={{
            width: 100, height: 135, borderRadius: 22,
            background: `linear-gradient(145deg, ${card.from}, ${card.mid}, ${card.to})`,
            border: '2px solid rgba(255,255,255,0.85)',
            boxShadow: `10px 10px 25px rgba(74,93,78,0.12), -6px -6px 18px rgba(255,255,255,0.9), inset 3px 3px 8px rgba(255,255,255,1), inset -3px -3px 10px ${card.from}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1,
          }}>
            <div style={{ width: 50, height: 65, borderRadius: '45% 55% 45% 55% / 55% 45% 55% 45%', background: `radial-gradient(ellipse at center, #1E293B 0%, #4A5D4E 55%, transparent 80%)`, filter: 'blur(2px)', opacity: 0.88 }} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#7AB382', fontWeight: 700, opacity: 0.9, textAlign: 'center', zIndex: 1 }}>
            {card.arcana} · {card.name.toUpperCase()}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, padding: '28px 24px 40px', overflowY: 'auto' }}>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[...new Set(analysisKeywords.length > 0 ? [selectedEmotion, ...analysisKeywords.slice(0, 2)] : [selectedEmotion, card.name])].map(tag => (
              <span key={tag} style={{ fontFamily: 'monospace', fontSize: 11, padding: '4px 10px', borderRadius: 12, background: 'rgba(122,179,130,0.15)', color: '#4A5D4E', fontWeight: 700 }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
            <div style={{ width: 20, height: 20, borderRadius: getEmotionPebble(selectedEmotion).borderRadius, flexShrink: 0, background: getEmotionPebble(selectedEmotion).background, boxShadow: '2px 2px 5px rgba(0,0,0,0.08), -1px -1px 4px rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)' }} />
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, margin: 0, color: '#2D3748' }}>Today&apos;s Mood</h1>
          </div>

          {/* Author + date */}
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            {username && username !== 'you' && (
              <>by <span style={{ color: '#4A5D4E', fontWeight: 500 }}>{username}</span><span>•</span></>
            )}
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{dateStr}</span>
          </div>

          {/* Original record */}
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>
            {isKo ? 'ORIGINAL RECORD' : 'ORIGINAL RECORD'}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.9)', marginBottom: 26, boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 300, color: '#4A5D4E', whiteSpace: 'pre-line' }}>
              {isEgoMode ? [
                selectedSleep ? `${isKo ? '수면' : 'Sleep'}: ${selectedSleep}` : '',
                selectedStress ? `${isKo ? '스트레스' : 'Stress'}: ${selectedStress}` : '',
                egoFreeText || '',
              ].filter(Boolean).join('\n') || (isKo ? '(기록 없음)' : '(no details recorded)') : [
                places.length > 0 ? `${isKo ? '장소' : 'Place'}: ${places.join(', ')}` : '',
                persons.length > 0 ? `${isKo ? '등장' : 'Who'}: ${persons.join(', ')}` : '',
                sceneText || '',
              ].filter(Boolean).join('\n') || (isKo ? '(기록 없음)' : '(no details recorded)')}
            </div>
          </div>

          {/* Analysis — only shown when there is content */}
          {analysisText && (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>JUNGIAN ANALYSIS</div>
              <div style={{ paddingLeft: 20, borderLeft: '2px solid #7AB382', marginBottom: 26 }}>
                <div style={{ fontSize: 15, lineHeight: 1.85, fontWeight: 300, color: '#4A5D4E' }}>
                  {analysisText.split(/\n\n+/).map((para, pi) => (
                    <p key={pi} style={{ margin: '0 0 14px', marginTop: pi === 0 ? 0 : 2 }}>
                      {para.split(/(\*\*[^*]+\*\*)/).map((chunk, ci) =>
                        chunk.startsWith('**') && chunk.endsWith('**')
                          ? <strong key={ci} style={{ fontWeight: 600, color: '#2D3748' }}>{chunk.slice(2, -2)}</strong>
                          : <span key={ci}>{chunk}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Today's affirmation — always shown */}
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>TODAY&apos;S AFFIRMATION</div>
          <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.9)', marginBottom: 28, boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.5)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: '#4A5D4E', fontWeight: 300, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{affirmation}</div>
          </div>

          {/* Usage limit banner for free users */}
          {usageLimitReached && (
            <div style={{ background: 'rgba(244,196,80,0.15)', border: '1px solid rgba(244,196,80,0.4)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#856404', fontWeight: 600, marginBottom: 4 }}>{isKo ? '이번 달 해석 횟수를 모두 사용했어요' : 'Monthly analysis limit reached'}</div>
              <div style={{ fontSize: 12, color: '#856404' }}>{isKo ? 'Pro로 업그레이드하면 매일 해석을 받을 수 있어요' : 'Upgrade to Pro for a daily interpretation'}</div>
            </div>
          )}

          {/* Save button */}
          {user ? (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                width: '100%', padding: '15px',
                borderRadius: 16,
                background: saved
                  ? 'rgba(122,179,130,0.15)'
                  : 'linear-gradient(135deg, #4A5D4E 0%, #3a4d3e 100%)',
                color: saved ? '#7AB382' : '#fff',
                border: saved ? '1.5px solid #7AB382' : 'none',
                fontSize: 14, fontWeight: 700,
                cursor: saved || saving ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: saved ? 'none' : '0 8px 20px rgba(74,93,78,0.2)',
                transition: 'all 0.3s ease',
                marginBottom: 12,
              }}
            >
              {saved ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {isKo ? '내면의 기록에 저장됨' : 'Saved to Inner Journal'}
                </>
              ) : saving ? (
                isKo ? '저장 중...' : 'Saving...'
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {isKo ? '내면의 기록에 저장하기' : 'Save to Inner Journal'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginPrompt(true)}
              style={{
                width: '100%', padding: '15px', borderRadius: 16,
                background: 'linear-gradient(135deg, #4A5D4E 0%, #3a4d3e 100%)',
                color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 20px rgba(74,93,78,0.2)', transition: 'all 0.3s ease', marginBottom: 12,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {isKo ? '내면의 기록에 저장하기' : 'Save to Inner Journal'}
            </button>
          )}

        </div>
      </div>

      {/* Login prompt overlay */}
      {showLoginPrompt && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(74,93,78,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: '32px 28px', maxWidth: 320, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(74,93,78,0.2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌙</div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#2D3748', margin: '0 0 10px' }}>
              {isKo ? '로그인이 필요해요' : 'Sign in to continue'}
            </h3>
            <button
              onClick={() => { setShowLoginPrompt(false); onClose(); if (onRequestLogin) onRequestLogin(); }}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #4A5D4E 0%, #3a4d3e 100%)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
            >
              {isKo ? '로그인 / 회원가입' : 'Sign in / Sign up'}
            </button>
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{ width: '100%', padding: '12px', borderRadius: 14, background: 'transparent', color: '#718096', border: '1px solid #E2E8F0', fontSize: 14, cursor: 'pointer' }}
            >
              {isKo ? '나중에' : 'Maybe later'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Read-only journal view: renders the revealed card design for a saved MoodCard dream
export function MoodCardJournalView({
  emotion, cardName, places, persons, scene, analysis, keywords, language, nickname, dateStr, onClose, onEdit, onShare,
}: {
  emotion: string; cardName: string;
  places: string; persons: string; scene: string;
  analysis: string; keywords: string[];
  language: 'en' | 'ko'; nickname: string; dateStr: string;
  onClose: () => void;
  onEdit?: () => void;
  onShare?: (e: React.MouseEvent) => void;
}) {
  const cardEntry = Object.values(arcanaCards).find(c => c.name === cardName);
  const arcanaIdForView = cardEntry?.arcana ?? selectArcanaId(emotion);
  const card = cardEntry ?? arcanaCards[arcanaIdForView] ?? arcanaCards['ARCANA.18'];
  const isKo = language === 'ko';
  const affirmation = arcanaAffirmations[arcanaIdForView]?.[isKo ? 'ko' : 'en'] ?? (isKo ? '오늘도 당신은 충분합니다.' : 'You are enough today.');
  const recordKeywords = [places, persons].filter(Boolean).join(', ') || (scene ? scene.slice(0, 40) : '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(74,93,78,0.2)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', zIndex: 21000 }}>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '90%',
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '32px 32px 0 0', borderTop: '1px solid rgba(255,255,255,1)',
        display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(74,93,78,0.12)', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 40, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, zIndex: 40 }} />

        {/* Action bar with share / edit / close */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '20px 20px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 30 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {onShare && (
              <button onClick={onShare} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4A5D4E' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onEdit && (
              <button onClick={onEdit} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, color: '#4A5D4E', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                {isKo ? '수정' : 'Edit'}
              </button>
            )}
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4A5D4E' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Visual header — tarot card only */}
        <div style={{ width: '100%', height: '38%', position: 'relative', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, background: `radial-gradient(circle at 50% 100%, ${card.from}55 0%, transparent 70%)`, borderBottom: '1px solid rgba(255,255,255,0.5)', paddingTop: 28 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 160, background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 0 }} />
          <div style={{ width: 100, height: 135, borderRadius: 22, background: `linear-gradient(145deg, ${card.from}, ${card.mid}, ${card.to})`, border: '2px solid rgba(255,255,255,0.85)', boxShadow: `10px 10px 25px rgba(74,93,78,0.12), -6px -6px 18px rgba(255,255,255,0.9), inset 3px 3px 8px rgba(255,255,255,1), inset -3px -3px 10px ${card.from}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
            <div style={{ width: 50, height: 65, borderRadius: '45% 55% 45% 55% / 55% 45% 55% 45%', background: `radial-gradient(ellipse at center, #1E293B 0%, #4A5D4E 55%, transparent 80%)`, filter: 'blur(2px)', opacity: 0.88 }} />
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#7AB382', fontWeight: 700, opacity: 0.9, textAlign: 'center', zIndex: 1 }}>{card.arcana} · {card.name.toUpperCase()}</div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, padding: '28px 24px 40px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[...new Set(keywords.length > 0 ? [emotion, ...keywords.slice(0, 2)] : [emotion, card.name])].map(tag => (
              <span key={tag} style={{ fontFamily: 'monospace', fontSize: 11, padding: '4px 10px', borderRadius: 12, background: 'rgba(122,179,130,0.15)', color: '#4A5D4E', fontWeight: 700 }}>#{tag}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
            <div style={{ width: 20, height: 20, borderRadius: getEmotionPebble(emotion).borderRadius, flexShrink: 0, background: getEmotionPebble(emotion).background, boxShadow: `2px 2px 5px rgba(0,0,0,0.08), -1px -1px 4px rgba(255,255,255,0.7)`, border: '1px solid rgba(255,255,255,0.8)' }} />
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, margin: 0, color: '#2D3748' }}>Today&apos;s Mood</h1>
          </div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 26, display: 'flex', alignItems: 'center', gap: 8 }}>
            {nickname && (
              <>by <span style={{ color: '#4A5D4E', fontWeight: 500 }}>{nickname}</span><span>•</span></>
            )}
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{dateStr}</span>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>ORIGINAL RECORD</div>
          <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.9)', marginBottom: 26, boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 300, color: '#4A5D4E', whiteSpace: 'pre-line' }}>
              {[places ? `${isKo ? '장소' : 'Place'}: ${places}` : '', persons ? `${isKo ? '등장' : 'Who'}: ${persons}` : '', scene || ''].filter(Boolean).join('\n') || (isKo ? '(기록 없음)' : '(no details recorded)')}
            </div>
          </div>

          {analysis && (
            <>
              <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>JUNGIAN ANALYSIS</div>
              <div style={{ paddingLeft: 20, borderLeft: '2px solid #7AB382', marginBottom: 26 }}>
                <div style={{ fontSize: 15, lineHeight: 1.85, fontWeight: 300, color: '#4A5D4E', whiteSpace: 'pre-line' }}>{analysis}</div>
              </div>
            </>
          )}

          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: '#718096', marginBottom: 12, fontWeight: 700 }}>TODAY&apos;S AFFIRMATION</div>
          <div style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.9)', marginBottom: 32, boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.5)', textAlign: 'center' }}>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: '#4A5D4E', fontWeight: 300, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{affirmation}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
