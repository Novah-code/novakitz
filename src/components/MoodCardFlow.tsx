'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { speechSupported, startListening, type SpeechSession } from '../lib/speech';
import { canAnalyzeDream, recordAIUsage } from '../lib/subscription';
import { isPremiumNow } from '../lib/premium';
import { addSingleAffirmation } from '../lib/affirmations';
import { authHeader } from '../lib/authHeader';
import { dedupeTags } from '../lib/tags';

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

/*
 * The soft core inside the card, in the card's own colours.
 *
 * It used to be one fixed dark green on all twenty. That reads as designed on
 * The Oasis, which is where it was chosen, and as a stain everywhere else —
 * muddy over The Spark's orange, invisible on The Void and The Seed, a grey
 * smear on The Ascent's pale yellow.
 *
 * So the core takes the card's own hue and pushes its brightness the way that
 * will show: darker on a light card, lighter on a dark one. Picking straight
 * from the palette was not enough — the three stops of an arcana sit close
 * together by design, so a core made of `from` on a pale card was a shape you
 * had to look for. This shifts past the palette while staying its colour.
 */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v =>
    Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)
  );
  return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
}

function cardCore(card: ArcanaCard): string {
  const n = parseInt(card.mid.slice(1), 16);
  const luma = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return luma > 140 ? shade(card.from, -0.42) : shade(card.to, 0.5);
}

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
  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.55)', borderRadius: '2px', marginBottom: '36px', overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${pct}%`, background: '#EDA3BC', borderRadius: '2px', transition: 'width 0.4s ease' }} />
  </div>
);

const Chip = ({ label, svg, color, selected, onClick }: { label: string; svg?: (stroke: string) => React.ReactNode; color?: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '17px 24px',
      borderRadius: '30px',
      border: selected ? '1.5px solid rgba(46,60,51,0.32)' : '1.5px solid rgba(255,255,255,0.9)',
      background: selected ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.55)',
      color: '#4A5D4E',
      fontSize: '17px',
      fontWeight: selected ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.22s ease',
      boxShadow: selected ? '0 6px 16px rgba(40,60,45,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', gap: '9px',
    }}
  >
    {svg && svg(color ?? '#4A5D4E')}
    <span style={{ color: selected ? '#2E3C33' : '#4A5D4E' }}>{label}</span>
  </button>
);

/*
 * The screens after the pebble, on the home screen's own sky.
 *
 * They used to be a mint panel on a dark scrim, which made the one step you take
 * after choosing a pebble feel like leaving the app for a dialog. Now the whole
 * screen is the same gradient the picker and the home screen use — no panel, no
 * scrim — and the controls are the white round buttons the rest of the app has.
 */
const SkyBackdrop = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const layer = (
  <div
    onClick={onClick}
    style={{
      position: 'fixed', inset: 0,
      backgroundImage: 'var(--home-sky-day)',
      backgroundColor: '#F4EEE5',
      zIndex: 21000,
      display: 'flex', justifyContent: 'center',
      overflowY: 'auto',
    }}
  >
    <div className="home-scene__grain" aria-hidden="true" />
    {children}
  </div>
  );
  // On <body>, so the shell's own controls (gear, tab bar) never sit above it.
  return typeof document === 'undefined' ? layer : createPortal(layer, document.body);
};

const roundControl: React.CSSProperties = {
  position: 'fixed',
  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
  width: '40px', height: '40px',
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: '50%',
  boxShadow: '0 2px 10px rgba(40,60,45,0.16)',
  cursor: 'pointer',
  color: '#2E3C33',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 3,
  padding: 0,
};

/*
 * The button at the foot of every step: the home screen's glass pill with the
 * round arrow. `marginTop: auto` in a column that fills the screen puts it at the
 * bottom, where the thumb is, and lets the content above it start at the top.
 */
/* The display face the "is saved" line uses; Instrument Serif has no Hangul, so Korean keeps the UI face (globals.css). */
const headingStyle = (isKo: boolean, enSize: number, koSize: number): React.CSSProperties => ({
  fontSize: isKo ? `${koSize}px` : `${enSize}px`,
  fontWeight: isKo ? 500 : 400,
  letterSpacing: isKo ? '-0.5px' : '0',
  lineHeight: 1.25,
  color: '#2E3C33',
  textAlign: 'center',
  fontFamily: isKo ? "'S-CoreDream', sans-serif" : 'var(--font-display), Georgia, serif',
});

const stepBody: React.CSSProperties = { width: '100%', flex: 1, display: 'flex', flexDirection: 'column' };

const NextButton = ({ label, onClick, disabled, done, top = 48 }: { label: React.ReactNode; onClick: () => void; disabled?: boolean; done?: boolean; top?: number }) => (
  <div style={{ marginTop: `${top}px`, marginBottom: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative', overflow: 'hidden',
        // As wide as its words (plus a floor so short ones don't shrink to a dot), centred.
        width: 'auto', minWidth: '240px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '28px',
        padding: '0 8px 0 26px',
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.85)',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: '16px', fontWeight: 700, textAlign: 'left',
        color: '#2E3C33',
        opacity: disabled && !done ? 0.45 : 1,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(40,60,45,0.16), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
        transition: 'opacity 0.2s, box-shadow 0.2s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{label}</span>
      <span aria-hidden="true" style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.96)',
        color: '#2E3C33',
        boxShadow: '0 2px 8px rgba(40,60,45,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{done ? <polyline points="20 6 9 17 4 12"/> : <polyline points="9 18 15 12 9 6"/>}</svg>
      </span>
    </button>
  </div>
);

/* The result screen's blocks: the home screen's glass, as a card. */
const glassCard: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
  backdropFilter: 'blur(22px) saturate(180%)',
  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: '24px',
  boxShadow: '0 8px 24px rgba(40,60,45,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
  padding: '20px 22px',
  width: '100%',
  boxSizing: 'border-box',
};
const sectionLabel: React.CSSProperties = {
  fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, color: '#7d8f82',
  fontWeight: 700, margin: '0 0 10px 6px', textAlign: 'left',
};

const Container = ({ children, onBack, onClose }: { children: React.ReactNode; onBack?: () => void; onClose: () => void }) => (
  <div style={{
    position: 'relative',
    zIndex: 2,
    width: '100%', maxWidth: '520px',
    boxSizing: 'border-box',
    // Starts at the top, just under the round controls, and uses the full height.
    padding: 'calc(env(safe-area-inset-top, 0px) + 68px) 22px calc(env(safe-area-inset-bottom, 0px) + 28px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    {onBack && (
      <button onClick={(e) => { e.stopPropagation(); onBack(); }} aria-label="Back" style={{ ...roundControl, left: '16px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    )}
    <button onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" style={{ ...roundControl, right: '16px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
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
  /*
   * The structured form of the same keywords — the ones that carry a category
   * and a sentiment and belong in `dream_keywords`.
   *
   * Tapping the circle and choosing a pebble is how a person records a dream in
   * this app, so this flow is the main way dreams get written down. It was
   * saving the row and nothing else, which meant Reflection's "The Sleeping
   * Mind" had no symbols to find and stayed empty no matter how much someone
   * wrote.
   */
  const [analysisKeywordRows, setAnalysisKeywordRows] = useState<
    { keyword: string; category: string; sentiment: string }[]
  >([]);
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [usageLimitReached, setUsageLimitReached] = useState(false);
  /*
   * How many readings are left, but only once that is worth saying.
   *
   * Null until loaded, and deliberately not shown while there are plenty. A
   * counter at seven-of-seven is noise on a screen whose whole argument is
   * that this takes five seconds, and putting it in front of someone before
   * they have written anything turns the ritual into an account balance.
   *
   * It appears at two remaining, which is the point where it stops being
   * trivia and starts being something a person would want to have known.
   */
  const [readingsLeft, setReadingsLeft] = useState<number | null>(null);
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

  /*
   * A signed-out person gets one reading, then a sign-in prompt.
   *
   * Someone who bought Pro without an account is also signed out, and metering
   * them would be taking the money and then withholding what it bought. That is
   * the substance of the 5.1.1(v) rejection rather than just the button that
   * triggered it, so the guest limit asks the store before it bites.
   */
  const guestOutOfReadings = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!localStorage.getItem('moodcard_guest_used')) return false;
    return !(await isPremiumNow(null));
  };

  const handleFinishRecord = async () => {
    // Check usage limits before analyzing
    if (!user) {
      if (await guestOutOfReadings()) {
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
      setAnalysisKeywordRows(analysisResult?.keywords ?? []);
      if (user) {
        recordAIUsage(user.id, undefined, 'moodcard_analysis');
      } else {
        localStorage.setItem('moodcard_guest_used', '1');
      }
    }
    setStep('revealed');
  };

  /* Loaded when the two-way card appears, because both of its buttons lead to
     a reading. One request, once per flow. */
  useEffect(() => {
    if (step !== 'blurred' || !user) return;
    let cancelled = false;
    canAnalyzeDream(user.id)
      .then(({ remaining }) => { if (!cancelled) setReadingsLeft(remaining); })
      .catch(() => { /* Not worth interrupting a morning over. */ });
    return () => { cancelled = true; };
  }, [step, user]);

  const handleFinishEgo = async () => {
    if (!user) {
      if (await guestOutOfReadings()) {
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
        setAnalysisKeywordRows(data.keywords ?? []);
      } else if (!res.ok) {
        console.error('[EgoAnalysis] API error:', res.status, data);
      }
      if (user) {
        /*
         * Its own label, so the two can be told apart later.
         *
         * It counts against the allowance exactly like a dream reading does —
         * see checkQuota — but both branches of this flow used to log
         * 'moodcard_analysis', which made it impossible to answer the question
         * 0-6 says to measure: what people actually spend their seven on, and
         * how many reach the end of them at all.
         */
        if (res.ok && data.analysis) recordAIUsage(user.id, undefined, 'mood_checkin');
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
        /*
         * `toISOString()` was giving this row a UTC date. For an app about
         * mornings that is exactly backwards: in KST every morning before 09:00
         * lands on the previous UTC day, so the calendar drew the pebble on the
         * wrong square for the people using it earliest. The ego branch above
         * already builds a local date; this one now does too.
         */
        const moodDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const { data: moodRow, error: moodError } = await supabase.from('dreams').insert([{
          user_id: user.id,
          title: `${selectedEmotion} — ${card.name}`,
          content: `[감정 기록] ${content}`,
          mood: selectedEmotion,
          tags: ['emotion-record', selectedEmotion, ...analysisKeywords.slice(0, 2)],
          date: moodDateStr,
          time: timeStr,
        }]).select('id').single();
        if (moodError) throw moodError;

        /*
         * The symbols, kept.
         *
         * This flow is how a dream gets written down — circle, pebble, then the
         * scene — so its keywords have to reach `dream_keywords` the same way
         * the long-press flow's do. Without this row Reflection's "The Sleeping
         * Mind" had nothing to read and stayed empty for anyone who recorded
         * their dreams the ordinary way.
         *
         * A failure here does not fail the save: the dream itself is written,
         * and losing its symbols is not worth losing the dream over.
         */
        if (moodRow?.id && analysisKeywordRows.length > 0) {
          const { error: kwError } = await supabase.from('dream_keywords').insert(
            analysisKeywordRows.map((kw) => ({
              user_id: user.id,
              dream_id: moodRow.id,
              keyword: kw.keyword,
              category: kw.category,
              sentiment: kw.sentiment,
              confidence: 0.8,
            }))
          );
          if (kwError) console.error('Error saving mood-card keywords:', kwError);
        }
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

  /*
   * The card on the saved screen.
   *
   * I took this out once and shouldn't have. The reasoning was that it only
   * ever rendered blurred, so the twenty hand-drawn arcana behind it were
   * never seen — but the card is not there to show the artwork. It is there
   * so the moment has an object in it. Without it the screen is two buttons
   * on an empty panel.
   *
   * The rendering fault was real, though, so this is not the old code back.
   * The blur used to be an overlay with `backdrop-filter` sitting over a
   * sibling SVG, and iOS composites that unreliably: dark cards came out
   * washed grey with a hard band through them. The blur is now `filter` on
   * the art itself, which is a single layer and composites the same way
   * everywhere.
   *
   * The padlock and the word UNCONSCIOUS are gone. A veil over a card reads
   * as something waiting; a padlock reads as something being sold.
   */
  const CardFrame = () => (
    <div style={{
      width: '150px',
      height: '218px',
      borderRadius: '18px',
      background: `linear-gradient(145deg, ${card.from} 0%, ${card.mid} 50%, ${card.to} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
      border: '1px solid rgba(255,255,255,0.8)',
      flexShrink: 0,
    }}>
      <svg
        width="100%" height="100%" viewBox="0 0 200 290"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, filter: 'blur(9px)', opacity: 0.85 }}
      >
        {arcanaArtChildren(arcanaId)}
      </svg>

      {/* A veil, not a lock — it softens the art without hiding that one is there. */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(244,249,245,0.28)' }} />
    </div>
  );

  // ==============================
  // STEP: blurred card
  // ==============================
  if (step === 'blurred') return (
    <SkyBackdrop onClick={onClose}>
      <Container onClose={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ ...stepBody, alignItems: 'center' }}>
          {/* Instrument Serif has no Hangul, so Korean keeps the UI face (globals.css). */}
          <p style={{ ...headingStyle(isKo, 42, 24), margin: 0 }}>
            {isKo ? `'${selectedEmotion}' 기록했어요` : `'${selectedEmotion}' is saved`}
          </p>

          {/* The pebble that was chosen, as the picker drew it — the object of this moment. */}
          <div style={{ marginTop: 'clamp(32px, 10vh, 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span aria-hidden="true" style={{
              position: 'absolute', inset: '-26px', borderRadius: '50%',
              background: `radial-gradient(circle, ${getEmotionPebble(selectedEmotion).background.replace('0.9)', '0.55)')} 0%, rgba(255,255,255,0) 68%)`,
              filter: 'blur(10px)',
            }} />
            <div style={{
              position: 'relative', width: '156px', height: '156px',
              background: getEmotionPebble(selectedEmotion).background,
              borderRadius: getEmotionPebble(selectedEmotion).borderRadius,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '8px 8px 24px rgba(0,0,0,0.07), -6px -6px 18px rgba(255,255,255,0.9), inset 3px 3px 6px rgba(255,255,255,0.8)',
            }} />
          </div>
          </div>

          <div style={{ marginTop: '80px', marginBottom: 'auto', width: '100%', display: 'grid', gridTemplateColumns: 'auto', justifyContent: 'center', gap: '12px' }}>
            {/* The two doors, as glass pills with the white round control — same as the home buttons. */}
            {([
              { key: 'dream', label: isKo ? '꿈 기억나요?' : 'Remember a dream?', primary: true,
                go: () => { setIsEgoMode(false); setStep('record-place'); },
                icon: <polyline points="9 18 15 12 9 6" /> },
              { key: 'mood', label: isKo ? '무드만 확인' : 'Check your mood', primary: false,
                go: () => { setIsEgoMode(true); setStep('ego-sleep'); },
                icon: <polyline points="9 18 15 12 9 6" /> },
            ] as const).map(b => (
              <button
                key={b.key}
                onClick={b.go}
                style={{
                  position: 'relative', overflow: 'hidden',
                  // The grid column is as wide as the longer label, so both pills match it
                  // and their arrows line up.
                  width: '100%', height: '56px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '28px',
                  padding: '0 8px 0 26px',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  color: '#2E3C33',
                  fontSize: '15px', fontWeight: b.primary ? 700 : 600,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
                  backdropFilter: 'blur(22px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 8px 24px rgba(40,60,45,0.16), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>{b.label}</span>
                <span aria-hidden="true" style={{
                  position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.96)', boxShadow: '0 2px 8px rgba(40,60,45,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                </span>
              </button>
            ))}

            {readingsLeft !== null && readingsLeft <= 2 && (
              <p style={{ fontSize: 12, color: '#7d8f82', margin: '4px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
                {readingsLeft > 0
                  ? (isKo
                      ? `이번 달 해석 ${readingsLeft}번 남았어요`
                      : `${readingsLeft} ${readingsLeft === 1 ? 'reading' : 'readings'} left this month`)
                  : (isKo
                      ? '이번 달 해석을 다 썼어요. 기록은 계속 저장돼요'
                      : "You've used this month's readings. Recording still works")}
              </p>
            )}
          </div>
        </div>
      </Container>
    </SkyBackdrop>
  );

  // ==============================
  // STEP: record-place
  // ==============================
  if (step === 'record-place') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('blurred')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={33} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: '12px' }}>
            {isKo ? '어떤 장소였나요?' : 'Where was it?'}
          </p>
          <p style={{ fontSize: '14px', color: '#7d8f82', textAlign: 'center', marginBottom: '28px' }}>
            {isKo ? '여러 개 선택할 수 있어요' : 'You can select multiple'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: '20px' }}>
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
                border: '1.5px solid rgba(46,60,51,0.30)', borderRadius: '12px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />
          )}

          <NextButton label={isKo ? '다음' : 'Next'} onClick={() => setStep('record-person')} disabled={selectedPlaces.length === 0 && !customPlace} />
        </div>
      </Container>
    </SkyBackdrop>
  );

  // ==============================
  // STEP: record-person
  // ==============================
  if (step === 'record-person') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('record-place')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={66} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: '12px' }}>
            {isKo ? '누가 나왔나요?' : 'Who appeared?'}
          </p>
          <p style={{ fontSize: '14px', color: '#7d8f82', textAlign: 'center', marginBottom: '28px' }}>
            {isKo ? '여러 명 선택할 수 있어요' : 'You can select multiple'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: '20px' }}>
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
                border: '1.5px solid rgba(46,60,51,0.30)', borderRadius: '12px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />
          )}

          <NextButton label={isKo ? '다음' : 'Next'} onClick={() => setStep('record-scene')} disabled={selectedPersons.length === 0 && !customPerson} />
        </div>
      </Container>
    </SkyBackdrop>
  );

  // ==============================
  // STEP: record-scene
  // ==============================
  if (step === 'record-scene') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('record-person')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={100} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: '12px' }}>
            {isKo ? '무엇을 하고 있었나요?' : 'What were you doing?'}
          </p>
          <p style={{ fontSize: '14px', color: '#7d8f82', textAlign: 'center', marginBottom: '28px' }}>
            {isKo ? '핵심 장면을 짧게 적어주세요' : 'Briefly describe the key scene'}
          </p>

          <div style={{ position: 'relative', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: 0 }}>
            <textarea
              value={isRecordingScene ? (isKo ? '음성 인식 중...' : 'Listening...') : sceneText}
              onChange={e => setSceneText(e.target.value)}
              placeholder={isKo
                ? '예: 누군가에게 쫓기다가 갑자기 하늘을 날았다.'
                : 'e.g. I was being chased, then suddenly I could fly.'}
              disabled={isRecordingScene}
              style={{
                width: '100%', height: '280px',
                background: 'rgba(255,255,255,0.65)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                borderRadius: '14px', padding: '14px', paddingBottom: '44px',
                fontSize: '14px', color: '#4A5D4E',
                fontFamily: 'inherit', outline: 'none',
                resize: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(46,60,51,0.30)'; }}
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
                background: isRecordingScene ? 'rgba(255,68,68,0.12)' : 'rgba(255,255,255,0.85)',
                color: isRecordingScene ? '#ff4444' : '#4A5D4E',
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

          <NextButton label={isKo ? '카드 열기' : 'Reveal card'} onClick={handleFinishRecord} />
        </div>
      </Container>
    </SkyBackdrop>
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
  
  const EgoChip = ({ label, value, setter, svg }: { label: string; value: string; setter: (v: string) => void; svg: React.ReactNode }) => (
    <button
      onClick={() => setter(label)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '17px 24px', borderRadius: 30,
        background: value === label ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.55)',
        color: value === label ? '#2E3C33' : '#4A5D4E',
        border: value === label ? '1.5px solid rgba(46,60,51,0.32)' : '1.5px solid rgba(255,255,255,0.9)',
        fontSize: 17, fontWeight: value === label ? 600 : 400,
        cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: value === label ? '0 6px 16px rgba(40,60,45,0.14)' : '0 3px 8px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ display: 'flex', color: '#7AB382' }}>{svg}</span>
      {label}
    </button>
  );

  if (step === 'ego-sleep') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('blurred')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={33} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: 12 }}>
            {isKo ? '간밤의 수면은 어땠나요?' : 'How did you sleep last night?'}
          </p>
          <p style={{ fontSize: 14, color: '#7d8f82', textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            {isKo ? '무의식의 에너지가 얼마나 충전되었는지 확인합니다' : 'Check how recharged your unconscious energy is'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: 0 }}>
            {([
              { label: isKo ? '아주 푹 잤어요' : 'Slept great', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
              { label: isKo ? '평범했어요' : 'Average', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
              { label: isKo ? '계속 뒤척였어요' : 'Restless', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { label: isKo ? '거의 못 잤어요' : 'Barely slept', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><line x1="1" y1="1" x2="23" y2="23"/></svg> },
            ] as {label:string;svg:React.ReactNode}[]).map(o => (
              <EgoChip key={o.label} label={o.label} value={selectedSleep} setter={setSelectedSleep} svg={o.svg} />
            ))}
          </div>
          <NextButton label={isKo ? '다음' : 'Next'} onClick={() => setStep('ego-stress')} disabled={!selectedSleep} />
        </div>
      </Container>
    </SkyBackdrop>
  );

  if (step === 'ego-stress') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('ego-sleep')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={66} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: 12 }}>
            {isKo ? '현재 체감하는 스트레스는?' : "What's your current stress level?"}
          </p>
          <p style={{ fontSize: 14, color: '#7d8f82', textAlign: 'center', marginBottom: 32, lineHeight: 1.5 }}>
            {isKo ? '그림자(Shadow)가 억압하고 있는 무게를 확인합니다' : 'Check the weight your Shadow is suppressing'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: 0 }}>
            {([
              { label: isKo ? '아주 가벼움' : 'Very light', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
              { label: isKo ? '적당한 긴장감' : 'Some tension', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
              { label: isKo ? '조금 지침' : 'A bit drained', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
              { label: isKo ? '무언가 짓누르는 느낌' : 'Weighed down', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
            ] as {label:string;svg:React.ReactNode}[]).map(o => (
              <EgoChip key={o.label} label={o.label} value={selectedStress} setter={setSelectedStress} svg={o.svg} />
            ))}
          </div>
          <NextButton label={isKo ? '다음' : 'Next'} onClick={() => setStep('ego-free')} disabled={!selectedStress} />
        </div>
      </Container>
    </SkyBackdrop>
  );

  if (step === 'ego-free') return (
    <SkyBackdrop>
      <Container onBack={() => setStep('ego-stress')} onClose={onClose}>
        <div style={stepBody}>
          <ProgressBar pct={100} />
          <p style={{ ...headingStyle(isKo, 36, 22), marginBottom: 12 }}>
            {isKo ? '지금 느껴지는 감정을 적어보세요' : 'Write about what you\'re feeling right now'}
          </p>
          <p style={{ fontSize: 14, color: '#7d8f82', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
            {isKo ? '감정의 원인이나 몸의 감각도 함께 적어도 좋아요 (선택)' : 'You can also describe the cause or a physical sensation (optional)'}
          </p>
          <div style={{ position: 'relative', marginTop: 'clamp(32px, 8vh, 80px)', marginBottom: 0 }}>
            <textarea
              value={isRecordingEgo ? (isKo ? '음성 인식 중...' : 'Listening...') : egoFreeText}
              onChange={e => setEgoFreeText(e.target.value)}
              placeholder={isKo ? '예: 오늘 중요한 회의가 있어서 명치가 답답하다.' : 'e.g. Big meeting today, feeling tightness in my chest.'}
              disabled={isRecordingEgo}
              rows={9}
              style={{ width: '100%', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.65)', padding: '14px 16px', paddingBottom: '44px', fontSize: 14, lineHeight: 1.7, color: '#4A5D4E', resize: 'none', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
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
                background: isRecordingEgo ? 'rgba(255,68,68,0.12)' : 'rgba(255,255,255,0.85)',
                color: isRecordingEgo ? '#ff4444' : '#4A5D4E',
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
          <NextButton label={isKo ? '카드 열기' : 'Reveal card'} onClick={handleFinishEgo} />
        </div>
      </Container>
    </SkyBackdrop>
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

  const pebble = getEmotionPebble(selectedEmotion);
  return (
    <SkyBackdrop>
      <Container onClose={onClose}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 32 }}>

          {/* Title, date */}
          <p style={{ ...headingStyle(isKo, 40, 24), margin: 0 }}>{isKo ? '오늘의 기분' : "Today's Mood"}</p>
          <div style={{ fontSize: 13, color: '#7d8f82', margin: '10px 0 26px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {username && username !== 'you' && (
              <>by <span style={{ color: '#4A5D4E', fontWeight: 500 }}>{username}</span><span>•</span></>
            )}
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{dateStr}</span>
          </div>

          {/* The card this record drew. */}
          <div style={{
              width: 110, height: 150, borderRadius: 22, flexShrink: 0,
              background: `linear-gradient(145deg, ${card.from}, ${card.mid}, ${card.to})`,
              border: '2px solid rgba(255,255,255,0.85)',
              boxShadow: `8px 10px 22px rgba(74,93,78,0.16), -4px -4px 14px rgba(255,255,255,0.8), inset 3px 3px 8px rgba(255,255,255,0.7)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <div style={{ width: 54, height: 70, borderRadius: '45% 55% 45% 55% / 55% 45% 55% 45%', background: `radial-gradient(ellipse at center, ${cardCore(card)} 0%, ${cardCore(card)}B3 55%, transparent 80%)`, filter: 'blur(2px)', opacity: 0.9 }} />
            </div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, color: '#7d8f82', fontWeight: 700, textAlign: 'center', margin: '16px 0 18px' }}>
            {card.arcana} · {card.name.toUpperCase()}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
            {dedupeTags(analysisKeywords.length > 0 ? [selectedEmotion, ...analysisKeywords.slice(0, 2)] : [selectedEmotion, card.name]).map(tag => (
              <span key={tag} style={{ fontFamily: 'monospace', fontSize: 12, padding: '6px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', color: '#4A5D4E', fontWeight: 700 }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Original record */}
          <div style={{ width: '100%', marginBottom: 22 }}>
            <div style={sectionLabel}>ORIGINAL RECORD</div>
            <div style={{ ...glassCard, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* The pebble that was chosen, small, where the record starts. */}
              <div aria-hidden="true" style={{
                width: 34, height: 34, flexShrink: 0, marginTop: 3,
                background: pebble.background, borderRadius: pebble.borderRadius,
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.9), inset 1px 1px 2px rgba(255,255,255,0.8)',
              }} />
              <div style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 400, color: '#4A5D4E', whiteSpace: 'pre-line', textAlign: 'left', minWidth: 0 }}>
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
          </div>

          {/* Analysis — only shown when there is content */}
          {analysisText && (
            <div style={{ width: '100%', marginBottom: 22 }}>
              <div style={sectionLabel}>READING</div>
              <div style={glassCard}>
                <div style={{ fontSize: 15, lineHeight: 1.85, fontWeight: 400, color: '#4A5D4E', textAlign: 'left' }}>
                  {analysisText.split(/\n\n+/).map((para, pi) => (
                    <p key={pi} style={{ margin: '0 0 14px', marginTop: pi === 0 ? 0 : 2 }}>
                      {para.split(/(\*\*[^*]+\*\*)/).map((chunk, ci) =>
                        chunk.startsWith('**') && chunk.endsWith('**')
                          ? <strong key={ci} style={{ fontWeight: 700, color: '#2E3C33' }}>{chunk.slice(2, -2)}</strong>
                          : <span key={ci}>{chunk}</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Today's affirmation — always shown */}
          <div style={{ width: '100%' }}>
            <div style={sectionLabel}>TODAY&apos;S AFFIRMATION</div>
            <div style={{ ...glassCard, textAlign: 'center' }}>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: '#4A5D4E', fontWeight: 400, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{affirmation}</div>
            </div>
          </div>

          {/* Usage limit banner for free users */}
          {usageLimitReached && (
            <div style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(244,196,80,0.15)', border: '1px solid rgba(244,196,80,0.4)', borderRadius: 18, padding: '12px 16px', marginTop: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#856404', fontWeight: 600, marginBottom: 4 }}>{isKo ? '이번 달 해석 횟수를 모두 사용했어요' : 'Monthly analysis limit reached'}</div>
              <div style={{ fontSize: 12, color: '#856404' }}>{isKo ? 'Pro로 업그레이드하면 매일 해석을 받을 수 있어요' : 'Upgrade to Pro for a daily interpretation'}</div>
            </div>
          )}

          {/* Save */}
          {user ? (
            <NextButton
              top={32}
              done={saved}
              disabled={saving || saved}
              onClick={handleSave}
              label={saved
                ? (isKo ? '내면의 기록에 저장됨' : 'Saved to Inner Journal')
                : saving
                  ? (isKo ? '저장 중...' : 'Saving...')
                  : (isKo ? '내면의 기록에 저장하기' : 'Save to Inner Journal')}
            />
          ) : (
            <NextButton top={32} onClick={() => setShowLoginPrompt(true)} label={isKo ? '내면의 기록에 저장하기' : 'Save to Inner Journal'} />
          )}
        </div>
      </Container>

      {/* Login prompt overlay */}
      {showLoginPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(60,50,70,0.28)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ ...glassCard, background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,247,240,0.90) 100%)', maxWidth: 340, padding: '32px 26px', textAlign: 'center', borderRadius: 30 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌙</div>
            <p style={{ ...headingStyle(isKo, 30, 20), margin: '0 0 22px' }}>
              {isKo ? '로그인이 필요해요' : 'Sign in to continue'}
            </p>
            <NextButton top={0} onClick={() => { setShowLoginPrompt(false); onClose(); if (onRequestLogin) onRequestLogin(); }} label={isKo ? '로그인 / 회원가입' : 'Sign in / Sign up'} />
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{ marginTop: 16, padding: '10px 18px', background: 'transparent', color: '#7d8f82', border: 'none', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {isKo ? '나중에' : 'Maybe later'}
            </button>
          </div>
        </div>
      )}
    </SkyBackdrop>
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

  const pebble = getEmotionPebble(emotion);
  const recordText = [places ? `${isKo ? '장소' : 'Place'}: ${places}` : '', persons ? `${isKo ? '등장' : 'Who'}: ${persons}` : '', scene || ''].filter(Boolean).join('\n') || (isKo ? '(기록 없음)' : '(no details recorded)');

  /*
   * The saved record, in the same design as the screen that made it: the home
   * sky, a glass card per section, the chosen pebble small inside the original
   * record. It was a white sheet; the old note about opaque-versus-frosted still
   * holds, and a full-screen sky is opaque too.
   */
  const view = (
    <SkyBackdrop>
      {/* Share, Edit, close: round white controls (and one pill), top right. */}
      <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 16, display: 'flex', gap: 10, alignItems: 'center', zIndex: 3 }}>
        {onShare && (
          <button onClick={onShare} aria-label={isKo ? '공유' : 'Share'} style={{ ...roundControl, position: 'static' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        )}
        {onEdit && (
          <button onClick={onEdit} aria-label={isKo ? '수정' : 'Edit'} style={{ ...roundControl, position: 'static' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
        )}
        <button onClick={onClose} aria-label={isKo ? '닫기' : 'Close'} style={{ ...roundControl, position: 'static' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: '520px', boxSizing: 'border-box',
        padding: 'calc(env(safe-area-inset-top, 0px) + 68px) 22px calc(env(safe-area-inset-bottom, 0px) + 40px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <p style={{ ...headingStyle(isKo, 40, 24), margin: 0 }}>{isKo ? '오늘의 기분' : "Today's Mood"}</p>
        <div style={{ fontSize: 13, color: '#7d8f82', margin: '10px 0 26px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {nickname && (
            <>by <span style={{ color: '#4A5D4E', fontWeight: 500 }}>{nickname}</span><span>•</span></>
          )}
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{dateStr}</span>
        </div>

        <div style={{
          width: 110, height: 150, borderRadius: 22, flexShrink: 0,
          background: `linear-gradient(145deg, ${card.from}, ${card.mid}, ${card.to})`,
          border: '2px solid rgba(255,255,255,0.85)',
          boxShadow: '8px 10px 22px rgba(74,93,78,0.16), -4px -4px 14px rgba(255,255,255,0.8), inset 3px 3px 8px rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <div style={{ width: 54, height: 70, borderRadius: '45% 55% 45% 55% / 55% 45% 55% 45%', background: `radial-gradient(ellipse at center, ${cardCore(card)} 0%, ${cardCore(card)}B3 55%, transparent 80%)`, filter: 'blur(2px)', opacity: 0.9 }} />
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, color: '#7d8f82', fontWeight: 700, textAlign: 'center', margin: '16px 0 18px' }}>
          {card.arcana} · {card.name.toUpperCase()}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          {dedupeTags(keywords.length > 0 ? [emotion, ...keywords.slice(0, 2)] : [emotion, card.name]).map(tag => (
            <span key={tag} style={{ fontFamily: 'monospace', fontSize: 12, padding: '6px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', color: '#4A5D4E', fontWeight: 700 }}>#{tag}</span>
          ))}
        </div>

        <div style={{ width: '100%', marginBottom: 22 }}>
          <div style={sectionLabel}>ORIGINAL RECORD</div>
          <div style={{ ...glassCard, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div aria-hidden="true" style={{
              width: 34, height: 34, flexShrink: 0, marginTop: 3,
              background: pebble.background, borderRadius: pebble.borderRadius,
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.9), inset 1px 1px 2px rgba(255,255,255,0.8)',
            }} />
            <div style={{ fontSize: 15, lineHeight: 1.7, color: '#4A5D4E', whiteSpace: 'pre-line', textAlign: 'left', minWidth: 0 }}>{recordText}</div>
          </div>
        </div>

        {analysis && (
          <div style={{ width: '100%', marginBottom: 22 }}>
            <div style={sectionLabel}>READING</div>
            <div style={glassCard}>
              <div style={{ fontSize: 15, lineHeight: 1.85, color: '#4A5D4E', whiteSpace: 'pre-line', textAlign: 'left' }}>
                {analysis.split(/(\*\*[^*]+\*\*)/).map((chunk, ci) =>
                  chunk.startsWith('**') && chunk.endsWith('**')
                    ? <strong key={ci} style={{ fontWeight: 700, color: '#2E3C33' }}>{chunk.slice(2, -2)}</strong>
                    : <span key={ci}>{chunk}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ width: '100%' }}>
          <div style={sectionLabel}>TODAY&apos;S AFFIRMATION</div>
          <div style={{ ...glassCard, textAlign: 'center' }}>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: '#4A5D4E', fontStyle: 'italic', whiteSpace: 'pre-line' }}>{affirmation}</div>
          </div>
        </div>
      </div>
    </SkyBackdrop>
  );
  // Above the shell's own controls (gear, tab bar), which live in a different stacking context.
  return typeof document === 'undefined' ? view : createPortal(view, document.body);
}

// The shared pieces of the sky screens, for the other full-screen panels.
export { SkyBackdrop, Container as SkyContainer, NextButton, headingStyle, stepBody, glassCard, sectionLabel, roundControl };
