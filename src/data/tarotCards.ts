export type Emotion = 'anxiety' | 'sadness' | 'calm' | 'joy' | 'loneliness' | 'hopeful' | 'anger' | 'numb';

export interface TarotCard {
  id: number;
  nameKo: string;
  nameEn: string;
  arcana: string; // e.g. "ARCANA.00"
  lightMessageKo: string;
  lightMessageEn: string;
  themeKeywords: string[]; // for AI prompt context
  emotions: Emotion[]; // which emotions this card maps to (primary)
}

export const TAROT_CARDS: TarotCard[] = [
  {
    id: 0, nameKo: '바보', nameEn: 'The Fool', arcana: 'ARCANA.00',
    lightMessageKo: '두려움 없이 내딛는 첫 발걸음이 새로운 길을 만듭니다.',
    lightMessageEn: 'A fearless first step creates an entirely new path.',
    themeKeywords: ['시작', '자유', '가능성', '순수'],
    emotions: ['joy', 'anxiety', 'hopeful'],
  },
  {
    id: 1, nameKo: '마법사', nameEn: 'The Magician', arcana: 'ARCANA.01',
    lightMessageKo: '당신 안에 이미 필요한 모든 것이 갖춰져 있습니다.',
    lightMessageEn: 'Everything you need already exists within you.',
    themeKeywords: ['의지', '창조', '능력', '집중'],
    emotions: ['calm', 'joy'],
  },
  {
    id: 2, nameKo: '여사제', nameEn: 'The High Priestess', arcana: 'ARCANA.02',
    lightMessageKo: '말해지지 않은 것들 속에 진짜 답이 숨어 있습니다.',
    lightMessageEn: 'The real answer hides in what remains unspoken.',
    themeKeywords: ['직관', '내면', '비밀', '무의식'],
    emotions: ['sadness', 'calm', 'loneliness'],
  },
  {
    id: 3, nameKo: '여황제', nameEn: 'The Empress', arcana: 'ARCANA.03',
    lightMessageKo: '스스로를 돌보는 것이 가장 강한 창조 행위입니다.',
    lightMessageEn: 'Nurturing yourself is the most powerful act of creation.',
    themeKeywords: ['풍요', '돌봄', '창조', '자연'],
    emotions: ['calm', 'joy'],
  },
  {
    id: 4, nameKo: '황제', nameEn: 'The Emperor', arcana: 'ARCANA.04',
    lightMessageKo: '경계를 세우는 것은 자신을 지키는 일입니다.',
    lightMessageEn: 'Setting boundaries is an act of self-protection.',
    themeKeywords: ['구조', '통제', '안정', '권위'],
    emotions: ['anxiety', 'calm'],
  },
  {
    id: 5, nameKo: '교황', nameEn: 'The Hierophant', arcana: 'ARCANA.05',
    lightMessageKo: '오래된 지혜가 지금 이 순간을 위해 준비되어 있었습니다.',
    lightMessageEn: 'Ancient wisdom has been waiting for exactly this moment.',
    themeKeywords: ['전통', '믿음', '지혜', '가르침'],
    emotions: ['calm', 'sadness'],
  },
  {
    id: 6, nameKo: '연인', nameEn: 'The Lovers', arcana: 'ARCANA.06',
    lightMessageKo: '선택은 두려움이 아닌 가치로부터 시작됩니다.',
    lightMessageEn: 'Choice begins not from fear, but from your deepest values.',
    themeKeywords: ['선택', '연결', '조화', '사랑'],
    emotions: ['joy', 'anxiety'],
  },
  {
    id: 7, nameKo: '전차', nameEn: 'The Chariot', arcana: 'ARCANA.07',
    lightMessageKo: '방향이 명확할 때 모순된 힘들도 하나로 모입니다.',
    lightMessageEn: 'When direction is clear, even opposing forces align.',
    themeKeywords: ['의지', '목표', '전진', '통제'],
    emotions: ['anxiety', 'calm', 'anger'],
  },
  {
    id: 8, nameKo: '힘', nameEn: 'Strength', arcana: 'ARCANA.08',
    lightMessageKo: '진짜 용기는 두려움이 없는 게 아니라 두려움과 함께 걷는 것입니다.',
    lightMessageEn: 'True courage is not the absence of fear, but walking with it.',
    themeKeywords: ['용기', '인내', '온화함', '내면의힘'],
    emotions: ['anxiety', 'calm', 'anger'],
  },
  {
    id: 9, nameKo: '은둔자', nameEn: 'The Hermit', arcana: 'ARCANA.09',
    lightMessageKo: '홀로 있는 시간이 당신만의 빛을 발견하게 합니다.',
    lightMessageEn: 'Time spent alone allows you to discover your own light.',
    themeKeywords: ['고독', '내성', '탐색', '지혜'],
    emotions: ['sadness', 'calm', 'loneliness', 'numb'],
  },
  {
    id: 10, nameKo: '운명의 수레바퀴', nameEn: 'Wheel of Fortune', arcana: 'ARCANA.10',
    lightMessageKo: '흐름이 바뀌고 있습니다. 변화의 파도에 올라타세요.',
    lightMessageEn: 'The tide is turning. Ride the wave of change.',
    themeKeywords: ['변화', '순환', '기회', '운명'],
    emotions: ['anxiety', 'joy', 'hopeful'],
  },
  {
    id: 11, nameKo: '정의', nameEn: 'Justice', arcana: 'ARCANA.11',
    lightMessageKo: '모든 것이 제자리를 찾을 때까지 과정을 신뢰하세요.',
    lightMessageEn: 'Trust the process until everything finds its place.',
    themeKeywords: ['균형', '진실', '공정', '결과'],
    emotions: ['anxiety', 'calm'],
  },
  {
    id: 12, nameKo: '매달린 사람', nameEn: 'The Hanged Man', arcana: 'ARCANA.12',
    lightMessageKo: '다른 각도에서 바라볼 때 막혔던 것이 열립니다.',
    lightMessageEn: 'Looking from a different angle opens what was blocked.',
    themeKeywords: ['전환', '희생', '통찰', '정지'],
    emotions: ['sadness', 'anxiety', 'loneliness', 'numb'],
  },
  {
    id: 13, nameKo: '죽음', nameEn: 'Death', arcana: 'ARCANA.13',
    lightMessageKo: '끝은 항상 다음 시작의 문 앞에 서 있습니다.',
    lightMessageEn: 'Every ending stands at the doorway of a new beginning.',
    themeKeywords: ['변환', '해방', '끝과시작', '전환점'],
    emotions: ['sadness', 'anxiety', 'numb'],
  },
  {
    id: 14, nameKo: '절제', nameEn: 'Temperance', arcana: 'ARCANA.14',
    lightMessageKo: '서로 다른 것들이 섞일 때 더 깊은 치유가 일어납니다.',
    lightMessageEn: 'Deeper healing emerges when opposites are blended together.',
    themeKeywords: ['균형', '치유', '인내', '흐름'],
    emotions: ['calm', 'sadness', 'numb'],
  },
  {
    id: 15, nameKo: '악마', nameEn: 'The Devil', arcana: 'ARCANA.15',
    lightMessageKo: '사슬이 보인다는 것은 이미 자유를 향해 손을 뻗고 있다는 것입니다.',
    lightMessageEn: 'Seeing the chains means you are already reaching for freedom.',
    themeKeywords: ['속박', '집착', '그림자', '각성'],
    emotions: ['anxiety', 'sadness', 'anger'],
  },
  {
    id: 16, nameKo: '탑', nameEn: 'The Tower', arcana: 'ARCANA.16',
    lightMessageKo: '무너지는 것은 당신이 아닙니다. 더 이상 당신이 아닌 것들입니다.',
    lightMessageEn: 'What collapses is not you — only what you no longer are.',
    themeKeywords: ['붕괴', '각성', '해방', '충격'],
    emotions: ['anxiety', 'sadness', 'anger'],
  },
  {
    id: 17, nameKo: '별', nameEn: 'The Star', arcana: 'ARCANA.17',
    lightMessageKo: '어둠이 짙을수록 별빛이 더 선명하게 닿습니다.',
    lightMessageEn: 'The darker the night, the more clearly the starlight reaches you.',
    themeKeywords: ['희망', '치유', '영감', '믿음'],
    emotions: ['sadness', 'calm', 'loneliness', 'hopeful'],
  },
  {
    id: 18, nameKo: '달', nameEn: 'The Moon', arcana: 'ARCANA.18',
    lightMessageKo: '보이지 않는 것들이 지금 가장 큰 목소리로 말하고 있습니다.',
    lightMessageEn: 'What cannot be seen is speaking the loudest right now.',
    themeKeywords: ['무의식', '환상', '직관', '불확실성'],
    emotions: ['anxiety', 'sadness', 'loneliness'],
  },
  {
    id: 19, nameKo: '태양', nameEn: 'The Sun', arcana: 'ARCANA.19',
    lightMessageKo: '오늘, 당신이 있는 그 자리가 가장 밝은 곳입니다.',
    lightMessageEn: 'Today, the brightest place is exactly where you stand.',
    themeKeywords: ['기쁨', '활력', '명료함', '성공'],
    emotions: ['joy', 'calm', 'hopeful'],
  },
  {
    id: 20, nameKo: '심판', nameEn: 'Judgement', arcana: 'ARCANA.20',
    lightMessageKo: '오래된 나를 내려놓을 준비가 되었을 때 새로운 나가 일어납니다.',
    lightMessageEn: 'A new self rises when you are ready to set the old one down.',
    themeKeywords: ['각성', '부��', '해방', '소명'],
    emotions: ['anxiety', 'joy', 'hopeful'],
  },
  {
    id: 21, nameKo: '세계', nameEn: 'The World', arcana: 'ARCANA.21',
    lightMessageKo: '완성은 끝이 아니라 더 큰 순환의 시작입니다.',
    lightMessageEn: 'Completion is not an ending — it is the start of a greater cycle.',
    themeKeywords: ['완성', '통합', '성취', '순환'],
    emotions: ['joy', 'calm'],
  },
];

export function getCardsByEmotion(emotion: Emotion): TarotCard[] {
  return TAROT_CARDS.filter(card => card.emotions.includes(emotion));
}

export function pickRandomCardByEmotion(emotion: Emotion): TarotCard {
  const pool = getCardsByEmotion(emotion);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const DREAM_KEYWORDS = {
  ko: {
    장소: ['물속', '하늘', '집', '낯선 곳', '어두운 곳', '숲속', '도시', '학교'],
    사건: ['추락', '달리기', '싸움', '길을 잃음', '비행', '쫓김', '찾기', '탈출'],
    인물: ['낯선 사람', '가족', '연인', '쫓는 존재', '과거의 나', '아이'],
    감각: ['빛', '공포', '무거움', '소리', '따뜻함', '차가움', '고요함'],
  },
  en: {
    Place: ['underwater', 'sky', 'home', 'unknown place', 'darkness', 'forest', 'city', 'school'],
    Event: ['falling', 'running', 'fighting', 'lost', 'flying', 'chased', 'searching', 'escaping'],
    Person: ['stranger', 'family', 'lover', 'pursuer', 'past self', 'child'],
    Sensation: ['light', 'fear', 'heaviness', 'sound', 'warmth', 'cold', 'stillness'],
  },
} as const;

export const EMOTION_CONFIG = {
  anxiety:    { labelKo: '불안',   labelEn: 'Anxious', emoji: '🌪️', color: '#b8a9c9' },
  sadness:    { labelKo: '우울',   labelEn: 'Fear',    emoji: '☁️', color: '#9ab5c7' },
  calm:       { labelKo: '평온',   labelEn: 'Peace',   emoji: '😌', color: '#a8c9b0' },
  joy:        { labelKo: '기쁨',   labelEn: 'Joyful',  emoji: '✨', color: '#f0d080' },
  loneliness: { labelKo: '외로움', labelEn: 'Lonely',  emoji: '🌙', color: '#b0b8d4' },
  hopeful:    { labelKo: '설렘',   labelEn: 'Hopeful', emoji: '🌱', color: '#c8e6c4' },
  anger:      { labelKo: '분노',   labelEn: 'Anger',   emoji: '🔥', color: '#e8b0a0' },
  numb:       { labelKo: '무감각', labelEn: 'Numb',    emoji: '🪨', color: '#c4c8cc' },
} satisfies Record<Emotion, { labelKo: string; labelEn: string; emoji: string; color: string }>;
