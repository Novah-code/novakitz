// 융의 12 아키타입 정의 (NovaKitz 버전)
export const ARCHETYPES = {
  innocent: {
    ko: '빛의 아이',
    en: 'The Child of Light',
    tagline: {
      ko: '세상을 순수한 눈으로 바라보는 낙관주의자',
      en: 'An optimist who sees the world through innocent eyes'
    },
    description: {
      ko: '순수함과 희망, 믿음을 간직한 채 안전과 행복을 추구합니다.',
      en: 'Seeks safety and happiness while maintaining purity, hope, and faith.'
    },
    traits: {
      ko: ['순수', '희망', '믿음', '낙관'],
      en: ['Pure', 'Hopeful', 'Faithful', 'Optimistic']
    },
    color: '#FFE5E5',
    darkColor: '#FFB3B3'
  },
  sage: {
    ko: '예언자',
    en: 'The Seer',
    tagline: {
      ko: '지혜로 진실을 찾아내는 통찰의 탐구자',
      en: 'A seeker of truth who finds wisdom in everything'
    },
    description: {
      ko: '통찰과 지혜를 통해 진실을 꿰뚫어 봅니다.',
      en: 'Pierces through to truth with insight and wisdom.'
    },
    traits: {
      ko: ['통찰', '지혜', '진실', '직관'],
      en: ['Insightful', 'Wise', 'Truthful', 'Intuitive']
    },
    color: '#E5F3FF',
    darkColor: '#B3DAFF'
  },
  explorer: {
    ko: '방랑자',
    en: 'The Wanderer',
    tagline: {
      ko: '자유를 향해 끝없이 걷는 영혼의 모험가',
      en: 'A soul who endlessly walks toward freedom'
    },
    description: {
      ko: '탐험과 자유를 갈망하며 끝없이 새로운 길을 찾아 나섭니다.',
      en: 'Seeks adventure and freedom, endlessly searching for new paths.'
    },
    traits: {
      ko: ['탐험', '자유', '갈망', '모험'],
      en: ['Exploring', 'Free', 'Longing', 'Adventurous']
    },
    color: '#E5FFF3',
    darkColor: '#B3FFD9'
  },
  outlaw: {
    ko: '개척자',
    en: 'The Pioneer',
    tagline: {
      ko: '기존의 룰을 깨고 새로운 세상을 여는 자',
      en: 'One who breaks the rules and opens new worlds'
    },
    description: {
      ko: '기존의 틀을 넘어 혁신을 통해 새로운 길을 개척합니다.',
      en: 'Breaks existing frames and pioneers new paths through innovation.'
    },
    traits: {
      ko: ['개척', '혁신', '해방', '도전'],
      en: ['Pioneering', 'Innovative', 'Liberating', 'Challenging']
    },
    color: '#FFF3E5',
    darkColor: '#FFD9B3'
  },
  magician: {
    ko: '연금술사',
    en: 'The Alchemist',
    tagline: {
      ko: '불가능을 가능으로 바꾸는 변화의 마법사',
      en: 'A wizard who transforms the impossible into possible'
    },
    description: {
      ko: '변형과 창조를 통해 각성의 순간을 만들어냅니다.',
      en: 'Creates moments of awakening through transformation and creation.'
    },
    traits: {
      ko: ['변형', '창조', '각성', '비전'],
      en: ['Transformative', 'Creative', 'Awakening', 'Visionary']
    },
    color: '#F3E5FF',
    darkColor: '#D9B3FF'
  },
  hero: {
    ko: '전사',
    en: 'The Warrior',
    tagline: {
      ko: '두려움을 넘어 승리를 쟁취하는 용기의 화신',
      en: 'An embodiment of courage who conquers fear'
    },
    description: {
      ko: '용기와 의지로 모든 장애물을 돌파해 나갑니다.',
      en: 'Breaks through all obstacles with courage and willpower.'
    },
    traits: {
      ko: ['용기', '의지', '돌파', '승리'],
      en: ['Brave', 'Willful', 'Breakthrough', 'Victorious']
    },
    color: '#FFE5F5',
    darkColor: '#FFB3E5'
  },
  lover: {
    ko: '연인',
    en: 'The Lover',
    tagline: {
      ko: '열정과 감각으로 삶의 아름다움을 느끼는 자',
      en: 'One who feels the beauty of life through passion'
    },
    description: {
      ko: '사랑과 감각, 열정으로 삶을 온전히 느낍니다.',
      en: 'Fully experiences life through love, sensuality, and passion.'
    },
    traits: {
      ko: ['사랑', '감각', '열정', '친밀'],
      en: ['Loving', 'Sensual', 'Passionate', 'Intimate']
    },
    color: '#FFE5EC',
    darkColor: '#FFB3D1'
  },
  jester: {
    ko: '역설가',
    en: 'The Paradox',
    tagline: {
      ko: '진지함 속의 유희, 유희 속의 진실을 아는 자',
      en: 'One who finds play in seriousness and truth in play'
    },
    description: {
      ko: '유희와 역설을 통해 자유로운 삶을 살아갑니다.',
      en: 'Lives freely through play and paradox.'
    },
    traits: {
      ko: ['유희', '역설', '자유', '즐거움'],
      en: ['Playful', 'Paradoxical', 'Free', 'Joyful']
    },
    color: '#FFF9E5',
    darkColor: '#FFE8B3'
  },
  everyman: {
    ko: '공감자',
    en: 'The Empath',
    tagline: {
      ko: '타인의 마음을 느끼고 함께 걷는 연결의 다리',
      en: 'A bridge who feels others and walks together'
    },
    description: {
      ko: '공감과 연결, 인간성을 중시하며 모두와 함께 걸어갑니다.',
      en: 'Values empathy, connection, and humanity while walking together with all.'
    },
    traits: {
      ko: ['공감', '연결', '인간성', '소속'],
      en: ['Empathetic', 'Connected', 'Humane', 'Belonging']
    },
    color: '#F5F5F5',
    darkColor: '#D9D9D9'
  },
  caregiver: {
    ko: '수호자',
    en: 'The Guardian',
    tagline: {
      ko: '헌신과 사랑으로 세상을 보살피는 보호자',
      en: 'A protector who cares for the world with devotion'
    },
    description: {
      ko: '보호와 치유, 헌신을 통해 타인을 돌봅니다.',
      en: 'Cares for others through protection, healing, and devotion.'
    },
    traits: {
      ko: ['보호', '치유', '헌신', '돌봄'],
      en: ['Protective', 'Healing', 'Devoted', 'Caring']
    },
    color: '#E5FFF9',
    darkColor: '#B3FFE8'
  },
  ruler: {
    ko: '군주',
    en: 'The Sovereign',
    tagline: {
      ko: '질서와 책임으로 세상을 바로 세우는 통치자',
      en: 'A ruler who builds the world with order and duty'
    },
    description: {
      ko: '질서와 통제, 권위를 통해 세상을 이끌어갑니다.',
      en: 'Leads the world through order, control, and authority.'
    },
    traits: {
      ko: ['질서', '통제', '권위', '리더십'],
      en: ['Orderly', 'Controlling', 'Authoritative', 'Leadership']
    },
    color: '#F9E5FF',
    darkColor: '#E8B3FF'
  },
  creator: {
    ko: '설계자',
    en: 'The Architect',
    tagline: {
      ko: '상상력으로 존재하지 않던 세계를 창조하는 자',
      en: 'One who creates worlds that never existed before'
    },
    description: {
      ko: '상상과 창조, 예술을 통해 새로운 세계를 설계합니다.',
      en: 'Designs new worlds through imagination, creation, and art.'
    },
    traits: {
      ko: ['상상', '창조', '설계', '독창'],
      en: ['Imaginative', 'Creative', 'Designing', 'Original']
    },
    color: '#E5FFFF',
    darkColor: '#B3FFFF'
  }
} as const;

export type ArchetypeKey = keyof typeof ARCHETYPES;

// 아키타입별 추천 궁합 (잘 어울리는 유형)
export const ARCHETYPE_COMPATIBILITY = {
  innocent: ['caregiver', 'sage', 'lover'],
  sage: ['explorer', 'magician', 'innocent'],
  explorer: ['outlaw', 'hero', 'sage'],
  outlaw: ['explorer', 'magician', 'hero'],
  magician: ['creator', 'sage', 'outlaw'],
  hero: ['ruler', 'caregiver', 'explorer'],
  lover: ['innocent', 'jester', 'caregiver'],
  jester: ['lover', 'creator', 'explorer'],
  everyman: ['caregiver', 'lover', 'sage'],
  caregiver: ['innocent', 'everyman', 'hero'],
  ruler: ['hero', 'magician', 'creator'],
  creator: ['magician', 'jester', 'ruler']
} as const;

export function getArchetypeName(key: string, language: 'ko' | 'en' = 'ko'): string {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype[language] : key;
}

export function getArchetypeTagline(key: string, language: 'ko' | 'en' = 'ko'): string {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype.tagline[language] : '';
}

export function getArchetypeDescription(key: string, language: 'ko' | 'en' = 'ko'): string {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype.description[language] : '';
}

export function getArchetypeTraits(key: string, language: 'ko' | 'en' = 'ko'): readonly string[] {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype.traits[language] : [];
}

export function getArchetypeColor(key: string): string {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype.color : '#F5F5F5';
}

export function getArchetypeDarkColor(key: string): string {
  const archetype = ARCHETYPES[key as ArchetypeKey];
  return archetype ? archetype.darkColor : '#D9D9D9';
}

export function getCompatibleArchetypes(key: string): readonly string[] {
  return ARCHETYPE_COMPATIBILITY[key as ArchetypeKey] || [];
}
