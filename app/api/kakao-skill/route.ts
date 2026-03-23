import { NextRequest, NextResponse } from 'next/server';

// ─── Kakao Skill Types ───────────────────────────────────────────────────────

interface KakaoUser {
  id: string; // botUserKey — unique per user per bot
  type: string;
  properties: {
    botUserKey?: string;
    plusfriendUserKey?: string;
    plusfreindUserKey?: string; // Kakao docs have both spellings
    appUserId?: string;         // Only for Kakao-logged-in users
    appUserStatus?: 'REGISTERED' | string;
    isFriend?: boolean;
  };
}

interface KakaoSkillRequest {
  intent: { id: string; name: string; extra?: Record<string, unknown> };
  userRequest: {
    timezone: string;
    block: { id: string; name: string };
    utterance: string;
    lang: string;
    user: KakaoUser;
    // Group chat info — botGroupKey identifies the chat room
    chat?: {
      properties: {
        botGroupKey?: string;
      };
    };
    params?: Record<string, string>;
  };
  bot: { id: string; name: string };
  action: {
    name: string;
    id: string;
    params: Record<string, string>;
    detailParams?: Record<string, { origin: string; value: string; groupName: string }>;
    clientExtra?: Record<string, unknown>;
  };
  // Conversation flow info (trigger type, last block)
  flow?: {
    trigger?: {
      type?: string;
      referrerBlock?: { id: string; name: string };
    };
    lastBlock?: { id: string; name: string };
  };
  contexts?: unknown[];
}

// ─── Response Component Types ────────────────────────────────────────────────

interface SimpleText {
  simpleText: { text: string };
}

// TextCard: title or description required, no thumbnail needed
interface TextCard {
  textCard: {
    title?: string;
    description?: string;
    buttons?: KakaoButton[];
    buttonLayout?: 'vertical' | 'horizontal';
  };
}

// BasicCard: thumbnail is required
interface BasicCard {
  basicCard: {
    title?: string;
    description?: string;
    thumbnail: { imageUrl: string; fixedRatio?: boolean; altText?: string };
    buttons?: KakaoButton[];
    buttonLayout?: 'vertical' | 'horizontal';
  };
}

interface ListCard {
  listCard: {
    header: { title: string };
    items: Array<{
      title: string;
      description?: string;
      imageUrl?: string;
      action?: 'block' | 'message';
      blockId?: string;
      messageText?: string;
      extra?: Record<string, unknown>;
    }>;
    buttons?: KakaoButton[];
  };
}

interface Carousel {
  carousel: {
    type: 'basicCard' | 'textCard' | 'listCard';
    items: Array<BasicCard['basicCard'] | TextCard['textCard'] | ListCard['listCard']>;
    header?: {
      title: string;
      description: string;
      thumbnail: { imageUrl: string };
    };
  };
}

interface KakaoButton {
  action: 'webLink' | 'message' | 'block' | 'phone' | 'share';
  label: string;
  webLinkUrl?: string;
  messageText?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}

interface QuickReply {
  action: 'block' | 'message';
  label: string;
  messageText?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}

type OutputComponent = SimpleText | TextCard | BasicCard | ListCard | Carousel;

interface KakaoSkillResponse {
  version: string;
  template: {
    outputs: OutputComponent[];
    quickReplies?: QuickReply[];
  };
  context?: {
    values: Array<{ name: string; lifeSpan: number; ttl?: number; params?: Record<string, string> }>;
  };
  data?: Record<string, unknown>;
}

// ─── Helper: Build response ──────────────────────────────────────────────────

function buildResponse(outputs: OutputComponent[], quickReplies?: QuickReply[]): KakaoSkillResponse {
  return {
    version: '2.0',
    template: { outputs, ...(quickReplies ? { quickReplies } : {}) },
  };
}

function text(msg: string): SimpleText {
  return { simpleText: { text: msg } };
}

function textCard(
  title: string,
  description: string,
  buttons?: KakaoButton[],
  buttonLayout?: 'vertical' | 'horizontal'
): TextCard {
  return { textCard: { title, description, ...(buttons ? { buttons } : {}), ...(buttonLayout ? { buttonLayout } : {}) } };
}

// ─── Card data ────────────────────────────────────────────────────────────────

const CARDS = [
  { id: 'the_fool', name: 'The Fool', nameKo: '바보', emoji: '🌟', theme: '새로운 시작, 자유' },
  { id: 'the_magician', name: 'The Magician', nameKo: '마법사', emoji: '✨', theme: '의지, 변화의 힘' },
  { id: 'the_high_priestess', name: 'The High Priestess', nameKo: '여사제', emoji: '🌙', theme: '직관, 내면의 지혜' },
  { id: 'the_empress', name: 'The Empress', nameKo: '여황제', emoji: '🌺', theme: '풍요, 창조' },
  { id: 'the_emperor', name: 'The Emperor', nameKo: '황제', emoji: '👑', theme: '질서, 안정감' },
  { id: 'the_hierophant', name: 'The Hierophant', nameKo: '교황', emoji: '🏛️', theme: '전통, 신뢰' },
  { id: 'the_lovers', name: 'The Lovers', nameKo: '연인', emoji: '💕', theme: '선택, 조화' },
  { id: 'the_chariot', name: 'The Chariot', nameKo: '전차', emoji: '⚡', theme: '의지, 승리' },
  { id: 'strength', name: 'Strength', nameKo: '힘', emoji: '🦁', theme: '용기, 내면의 강함' },
  { id: 'the_hermit', name: 'The Hermit', nameKo: '은둔자', emoji: '🕯️', theme: '내면 탐구, 고독' },
  { id: 'wheel_of_fortune', name: 'Wheel of Fortune', nameKo: '운명의 수레바퀴', emoji: '🎡', theme: '변화, 순환' },
  { id: 'justice', name: 'Justice', nameKo: '정의', emoji: '⚖️', theme: '공정함, 균형' },
  { id: 'the_hanged_man', name: 'The Hanged Man', nameKo: '매달린 남자', emoji: '🌀', theme: '기다림, 새로운 시각' },
  { id: 'death', name: 'Death', nameKo: '죽음', emoji: '🌑', theme: '변환, 끝과 시작' },
  { id: 'temperance', name: 'Temperance', nameKo: '절제', emoji: '🌈', theme: '균형, 치유' },
  { id: 'the_devil', name: 'The Devil', nameKo: '악마', emoji: '🔥', theme: '속박, 욕망 인식' },
  { id: 'the_tower', name: 'The Tower', nameKo: '탑', emoji: '⛈️', theme: '해방, 급격한 변화' },
  { id: 'the_star', name: 'The Star', nameKo: '별', emoji: '⭐', theme: '희망, 치유' },
  { id: 'the_moon', name: 'The Moon', nameKo: '달', emoji: '🌕', theme: '무의식, 직관' },
  { id: 'the_sun', name: 'The Sun', nameKo: '태양', emoji: '☀️', theme: '기쁨, 활기' },
  { id: 'judgement', name: 'Judgement', nameKo: '심판', emoji: '🔔', theme: '각성, 재생' },
  { id: 'the_world', name: 'The World', nameKo: '세계', emoji: '🌍', theme: '완성, 통합' },
];

function seedHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

function handleWelcome(): KakaoSkillResponse {
  return buildResponse(
    [text('안녕하세요 👋\nNovakitz입니다.\n\n무의식 속 당신만의 이야기를 함께 탐험해요.')],
    [
      { action: 'message', label: '🃏 오늘의 카드 뽑기', messageText: '오늘의 카드' },
      { action: 'message', label: '🌙 내 아키타입 알아보기', messageText: '아키타입 테스트' },
      { action: 'message', label: '📖 꿈 기록하기', messageText: '꿈 기록' },
    ]
  );
}

function handleCardDraw(user: KakaoUser): KakaoSkillResponse {
  const today = new Date().toISOString().split('T')[0];
  const card = CARDS[seedHash(`${user.id}-${today}`) % CARDS.length];
  const baseUrl = 'https://www.novakitz.shop';

  return buildResponse([
    textCard(
      `${card.emoji} 오늘의 카드: ${card.nameKo}`,
      `🔑 오늘의 키워드\n${card.theme}\n\n카드가 전하는 메시지를 앱에서 더 자세히 확인해보세요.`,
      [
        { action: 'webLink', label: '앱에서 자세히 보기', webLinkUrl: `${baseUrl}?card=${card.id}&ref=kakao&uid=${user.id}` },
        { action: 'webLink', label: '꿈 기록하기', webLinkUrl: `${baseUrl}?mode=record&ref=kakao&uid=${user.id}` },
      ],
      'vertical'
    ),
  ]);
}

function handleGroupCardDraw(botGroupKey: string): KakaoSkillResponse {
  const today = new Date().toISOString().split('T')[0];
  const card = CARDS[seedHash(`${botGroupKey}-${today}`) % CARDS.length];

  return buildResponse([
    text(
      `🎴 오늘 우리 그룹의 카드\n\n${card.emoji} ${card.nameKo} (${card.name})\n\n💭 오늘의 키워드: ${card.theme}\n\n이 카드가 오늘 대화에 어떤 의미인지 함께 이야기해보세요!`
    ),
  ]);
}

function handleArchetypeTest(user: KakaoUser): KakaoSkillResponse {
  const baseUrl = 'https://www.novakitz.shop';

  return buildResponse([
    textCard(
      '🧠 나의 무의식 아키타입은?',
      'Carl Jung의 12 아키타입 이론을 기반으로\n내 무의식 속 숨겨진 원형을 발견해보세요.\n\n✨ 10문항 · 약 3분 소요',
      [{ action: 'webLink', label: '테스트 시작하기', webLinkUrl: `${baseUrl}/archetype-test?ref=kakao&uid=${user.id}` }]
    ),
  ]);
}

function handleDreamRecord(user: KakaoUser): KakaoSkillResponse {
  const baseUrl = 'https://www.novakitz.shop';

  return buildResponse([
    textCard(
      '🌙 꿈을 기록하세요',
      'AI가 융 심리학 기반으로 당신의 꿈을 분석해드립니다.\n\n기록한 꿈은 월간 리포트로 패턴을 분석해드려요.',
      [{ action: 'webLink', label: '꿈 기록 시작', webLinkUrl: `${baseUrl}?mode=dream&ref=kakao&uid=${user.id}` }]
    ),
  ]);
}

function handleHelp(): KakaoSkillResponse {
  return buildResponse(
    [text('📋 Novakitz 챗봇 메뉴\n\n🃏 오늘의 카드 — 오늘 나를 위한 카드\n🧠 아키타입 테스트 — 내 무의식 원형 발견\n🌙 꿈 기록 — AI 꿈 해몽\n\n더 궁금한 점은 novakitz.shop을 방문해주세요.')],
    [
      { action: 'message', label: '🃏 오늘의 카드', messageText: '오늘의 카드' },
      { action: 'message', label: '🧠 아키타입 테스트', messageText: '아키타입 테스트' },
      { action: 'message', label: '🌙 꿈 기록', messageText: '꿈 기록' },
    ]
  );
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Kakao
    const kakaoSecret = request.headers.get('x-kakao-skill-secret');
    const expectedSecret = process.env.KAKAO_SKILL_SECRET;
    if (expectedSecret && kakaoSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      console.error('[Kakao Skill] JSON parse failed');
      return NextResponse.json(buildResponse([text('메시지를 처리할 수 없어요. 텍스트로 입력해주세요. 🙏')]));
    }

    console.log('[Kakao Skill] raw body:', JSON.stringify(rawBody));

    const body = rawBody as KakaoSkillRequest;

    // Guard against unexpected structure (e.g. photo messages)
    if (!body?.userRequest) {
      return NextResponse.json(buildResponse([text('사진은 아직 지원하지 않아요. 텍스트로 입력해주세요. 🙏')]));
    }

    const { userRequest, action } = body;
    const user = userRequest.user;
    const utterance = userRequest.utterance?.trim() || '';
    const blockName = userRequest.block?.name || '';
    const actionName = action?.name || '';

    // Photo/image/file message — utterance is empty or a placeholder
    if (!utterance || utterance === '(사진)' || utterance === '(파일)' || utterance === '(동영상)') {
      return NextResponse.json(buildResponse(
        [text('사진은 아직 분석하지 못해요 😅\n텍스트로 꿈 내용을 적어주시면 AI가 해석해드릴게요!')],
        [
          { action: 'message', label: '🃏 오늘의 카드', messageText: '오늘의 카드' },
          { action: 'message', label: '🌙 꿈 기록', messageText: '꿈 기록' },
        ]
      ));
    }

    console.log('[Kakao Skill] utterance:', utterance, '| block:', blockName, '| action:', actionName);

    if (actionName === 'welcome' || blockName.includes('웰컴') || blockName.includes('시작')) {
      return NextResponse.json(handleWelcome());
    }

    if (
      actionName === 'card_draw' ||
      blockName.includes('카드') ||
      utterance.includes('오늘의 카드') ||
      utterance.includes('카드 뽑기')
    ) {
      const botGroupKey = userRequest.chat?.properties?.botGroupKey;
      if (botGroupKey) return NextResponse.json(handleGroupCardDraw(botGroupKey));
      return NextResponse.json(handleCardDraw(user));
    }

    if (
      actionName === 'archetype_test' ||
      blockName.includes('아키타입') ||
      utterance.includes('아키타입') ||
      utterance.includes('archetype')
    ) {
      return NextResponse.json(handleArchetypeTest(user));
    }

    if (
      actionName === 'dream_record' ||
      blockName.includes('꿈') ||
      utterance.includes('꿈 기록') ||
      utterance.includes('꿈기록')
    ) {
      return NextResponse.json(handleDreamRecord(user));
    }

    if (utterance.includes('도움') || utterance.includes('메뉴') || utterance.includes('help')) {
      return NextResponse.json(handleHelp());
    }

    return NextResponse.json(handleWelcome());
  } catch (error) {
    console.error('[Kakao Skill] Error:', error);
    return NextResponse.json(buildResponse([text('일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요. 🙏')]));
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'novakitz-kakao-skill' });
}
