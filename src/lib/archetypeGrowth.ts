// 아키타입 성장 시스템 데이터
export interface GrowthStage {
  current: {
    ko: string;
    en: string;
  };
  next: {
    ko: string;
    en: string;
  };
  characteristics: {
    ko: string[];
    en: string[];
  };
  quests: {
    ko: string[];
    en: string[];
  };
}

export const ARCHETYPE_GROWTH: Record<string, GrowthStage> = {
  innocent: {
    current: {
      ko: '꿈꾸는 순수',
      en: 'Dreaming Innocence'
    },
    next: {
      ko: '각성한 희망',
      en: 'Awakened Hope'
    },
    characteristics: {
      ko: [
        '긍정적이지만 현실을 외면하는 경향',
        '순수함이 때로는 순진함으로 보임',
        '희망을 가지고 있지만 실천이 부족함'
      ],
      en: [
        'Positive but tends to avoid reality',
        'Purity sometimes appears as naivety',
        'Hopeful but lacks action'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '불편한 감정 하나를 인정하고 받아들이기',
        '희망적인 생각을 한 가지 행동으로 옮기기'
      ],
      en: [
        'Record your dream journal today',
        'Acknowledge and accept one uncomfortable emotion',
        'Turn one hopeful thought into action'
      ]
    }
  },
  sage: {
    current: {
      ko: '관찰하는 예언자',
      en: 'Observing Seer'
    },
    next: {
      ko: '실천하는 현자',
      en: 'Practicing Sage'
    },
    characteristics: {
      ko: [
        '깊은 통찰력을 가지고 있지만 행동으로 옮기지 못함',
        '완벽한 이해를 추구하느라 결정을 미룸',
        '지혜는 많지만 경험이 부족함'
      ],
      en: [
        'Deep insight but fails to act',
        'Delays decisions seeking perfect understanding',
        'Wise but lacks experience'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '배운 지혜 하나를 실천으로 옮기기',
        '불완전한 이해로도 결정 하나 내리기'
      ],
      en: [
        'Record your dream journal today',
        'Put one learned wisdom into practice',
        'Make one decision despite incomplete understanding'
      ]
    }
  },
  explorer: {
    current: {
      ko: '떠도는 방랑자',
      en: 'Drifting Wanderer'
    },
    next: {
      ko: '자유로운 탐험가',
      en: 'Liberated Explorer'
    },
    characteristics: {
      ko: [
        '자유를 갈망하지만 뿌리를 내리지 못함',
        '탐험은 하지만 깊이 있는 연결이 부족',
        '새로운 것을 찾지만 현재에 집중하지 못함'
      ],
      en: [
        'Craves freedom but cannot put down roots',
        'Explores but lacks deep connections',
        'Seeks new things but cannot focus on present'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '한 곳에 머물며 깊이 경험하기',
        '새로운 경험을 누군가와 공유하기'
      ],
      en: [
        'Record your dream journal today',
        'Stay in one place and experience deeply',
        'Share a new experience with someone'
      ]
    }
  },
  outlaw: {
    current: {
      ko: '반항하는 해커',
      en: 'Rebellious Hacker'
    },
    next: {
      ko: '창조하는 혁명가',
      en: 'Creating Revolutionary'
    },
    characteristics: {
      ko: [
        '기존 틀을 깨지만 대안을 제시하지 못함',
        '반항 자체가 목적이 되는 경향',
        '파괴는 하지만 건설적 변화가 부족'
      ],
      en: [
        'Breaks frames but offers no alternatives',
        'Rebellion itself becomes the goal',
        'Destroys but lacks constructive change'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '불합리한 것을 비판하고 대안 제시하기',
        '파괴보다 창조에 에너지 쓰기'
      ],
      en: [
        'Record your dream journal today',
        'Criticize something unfair and offer an alternative',
        'Spend energy on creation rather than destruction'
      ]
    }
  },
  magician: {
    current: {
      ko: '잠든 연금술사',
      en: 'Sleeping Alchemist'
    },
    next: {
      ko: '각성한 변화의 마법사',
      en: 'Awakened Transformer'
    },
    characteristics: {
      ko: [
        '직관은 강하지만 실행력이 부족함',
        '아이디어는 많은데 현실화가 어려움',
        '변화의 힘을 가졌지만 방향을 찾지 못함'
      ],
      en: [
        'Strong intuition but lacks execution',
        'Many ideas but difficult to realize',
        'Has power to transform but lacks direction'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '떠오른 아이디어 하나를 구체화하기',
        '작은 변화를 실제로 만들어내기'
      ],
      en: [
        'Record your dream journal today',
        'Materialize one idea that came to mind',
        'Create one small actual change'
      ]
    }
  },
  hero: {
    current: {
      ko: '싸우는 전사',
      en: 'Fighting Warrior'
    },
    next: {
      ko: '성숙한 영웅',
      en: 'Mature Hero'
    },
    characteristics: {
      ko: [
        '용기는 있지만 모든 것을 전쟁터로 만듦',
        '싸움에 중독되어 휴식을 거부함',
        '힘으로 증명하려 하지만 취약함을 인정하지 못함'
      ],
      en: [
        'Courageous but makes everything a battlefield',
        'Addicted to fighting and refuses rest',
        'Tries to prove through strength but cannot accept vulnerability'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '싸움이 아닌 대화로 문제 해결하기',
        '자신의 취약함을 한 번 인정하기'
      ],
      en: [
        'Record your dream journal today',
        'Solve a problem through dialogue, not fighting',
        'Acknowledge your vulnerability once'
      ]
    }
  },
  lover: {
    current: {
      ko: '갈구하는 연인',
      en: 'Craving Lover'
    },
    next: {
      ko: '온전한 사랑의 주인',
      en: 'Master of Complete Love'
    },
    characteristics: {
      ko: [
        '사랑하지만 관계에 지나치게 의존함',
        '열정은 있지만 자기 자신을 잃어버림',
        '연결을 갈망하지만 상실이 두려움'
      ],
      en: [
        'Loves but becomes too dependent on relationships',
        'Passionate but loses oneself',
        'Craves connection but fears loss'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '혼자만의 시간을 즐기며 자신을 사랑하기',
        '타인의 사랑에 의존하지 않고 완전함 느끼기'
      ],
      en: [
        'Record your dream journal today',
        'Enjoy time alone and love yourself',
        'Feel complete without depending on others\' love'
      ]
    }
  },
  jester: {
    current: {
      ko: '도피하는 조커',
      en: 'Escaping Joker'
    },
    next: {
      ko: '치유하는 역설가',
      en: 'Healing Paradox'
    },
    characteristics: {
      ko: [
        '유머가 있지만 진지함을 회피함',
        '즐거움을 주지만 깊은 감정을 숨김',
        '자유롭지만 무책임해 보일 수 있음'
      ],
      en: [
        'Humorous but avoids seriousness',
        'Brings joy but hides deep emotions',
        'Free but may appear irresponsible'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '진지한 대화 하나에 온전히 참여하기',
        '유머 뒤에 숨긴 진짜 감정 한 가지 표현하기'
      ],
      en: [
        'Record your dream journal today',
        'Fully participate in one serious conversation',
        'Express one true emotion hidden behind humor'
      ]
    }
  },
  everyman: {
    current: {
      ko: '숨는 동행자',
      en: 'Hiding Companion'
    },
    next: {
      ko: '진정한 연결의 다리',
      en: 'True Bridge of Connection'
    },
    characteristics: {
      ko: [
        '공감은 하지만 자신의 개성을 잃음',
        '함께하지만 진짜 자신을 숨김',
        '연결되지만 표면적인 관계에 머묾'
      ],
      en: [
        'Empathizes but loses individuality',
        'Together but hides true self',
        'Connected but stays in superficial relationships'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '자신만의 독특한 의견 하나 표현하기',
        '있는 그대로의 자신을 누군가에게 보이기'
      ],
      en: [
        'Record your dream journal today',
        'Express one unique opinion of your own',
        'Show your true self to someone'
      ]
    }
  },
  caregiver: {
    current: {
      ko: '희생하는 수호자',
      en: 'Sacrificing Guardian'
    },
    next: {
      ko: '균형 잡힌 돌봄의 주인',
      en: 'Master of Balanced Care'
    },
    characteristics: {
      ko: [
        '돌보지만 자신의 필요를 무시함',
        '헌신하지만 자신을 잃어버림',
        '사랑을 주지만 의존적 관계를 만듦'
      ],
      en: [
        'Cares but ignores own needs',
        'Devoted but loses self',
        'Gives love but creates dependent relationships'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '자기 자신을 위한 시간 한 가지 가지기',
        '도움을 거절하고 자신을 먼저 돌보기'
      ],
      en: [
        'Record your dream journal today',
        'Have one time for yourself',
        'Decline helping and care for yourself first'
      ]
    }
  },
  ruler: {
    current: {
      ko: '통제하는 군주',
      en: 'Controlling Sovereign'
    },
    next: {
      ko: '섬기는 리더',
      en: 'Servant Leader'
    },
    characteristics: {
      ko: [
        '이끌지만 통제에 집착함',
        '권위가 있지만 권위주의적임',
        '질서를 만들지만 유연성이 부족'
      ],
      en: [
        'Leads but obsesses over control',
        'Authoritative but authoritarian',
        'Creates order but lacks flexibility'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '통제를 내려놓고 다른 의견 경청하기',
        '권위가 아닌 섬김으로 이끌기'
      ],
      en: [
        'Record your dream journal today',
        'Let go of control and listen to other opinions',
        'Lead through service, not authority'
      ]
    }
  },
  creator: {
    current: {
      ko: '완벽주의 설계자',
      en: 'Perfectionist Architect'
    },
    next: {
      ko: '자유로운 창조자',
      en: 'Liberated Creator'
    },
    characteristics: {
      ko: [
        '창조하지만 완벽주의에 빠짐',
        '상상력은 있지만 현실과 단절됨',
        '무언가를 만들지만 자신을 혹사함'
      ],
      en: [
        'Creates but falls into perfectionism',
        'Imaginative but disconnected from reality',
        'Makes things but overworks self'
      ]
    },
    quests: {
      ko: [
        '오늘 하루 꿈 일기 기록하기',
        '불완전해도 창조물 하나를 세상에 내놓기',
        '과정을 즐기며 결과에 집착하지 않기'
      ],
      en: [
        'Record your dream journal today',
        'Put one imperfect creation into the world',
        'Enjoy the process without obsessing over results'
      ]
    }
  },
};

export function getGrowthStage(archetype: string, language: 'ko' | 'en' = 'ko'): GrowthStage | null {
  return ARCHETYPE_GROWTH[archetype] || null;
}
