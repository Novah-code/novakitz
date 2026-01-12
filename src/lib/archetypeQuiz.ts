// Archetype Quiz - Questionnaire-based archetype determination
// This allows new users to discover their archetype without recording 5 dreams

export interface QuizQuestion {
  id: string;
  question: {
    ko: string;
    en: string;
  };
  options: Array<{
    text: {
      ko: string;
      en: string;
    };
    archetypes: Record<string, number>; // archetype slug -> score weight
  }>;
}

export const ARCHETYPE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: {
      ko: '꿈에서 가장 자주 느끼는 감정은?',
      en: 'What emotion do you feel most often in your dreams?'
    },
    options: [
      {
        text: { ko: '호기심과 탐구욕', en: 'Curiosity and exploration' },
        archetypes: { explorer: 3, sage: 2, magician: 1 }
      },
      {
        text: { ko: '사랑과 연결감', en: 'Love and connection' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '두려움과 불안', en: 'Fear and anxiety' },
        archetypes: { orphan: 3, innocent: 2, caregiver: 1 }
      },
      {
        text: { ko: '힘과 통제감', en: 'Power and control' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      },
      {
        text: { ko: '자유와 반항심', en: 'Freedom and rebellion' },
        archetypes: { outlaw: 3, jester: 2, explorer: 1 }
      }
    ]
  },
  {
    id: 'q2',
    question: {
      ko: '꿈 속에서 주로 무엇을 하고 있나요?',
      en: 'What are you usually doing in your dreams?'
    },
    options: [
      {
        text: { ko: '새로운 장소를 탐험하고 있다', en: 'Exploring new places' },
        archetypes: { explorer: 3, innocent: 1, sage: 1 }
      },
      {
        text: { ko: '누군가를 돕거나 보살피고 있다', en: 'Helping or caring for someone' },
        archetypes: { caregiver: 3, innocent: 2, lover: 1 }
      },
      {
        text: { ko: '무언가를 창조하거나 만들고 있다', en: 'Creating or building something' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      },
      {
        text: { ko: '싸우거나 문제를 해결하고 있다', en: 'Fighting or solving problems' },
        archetypes: { warrior: 3, ruler: 2, outlaw: 1 }
      },
      {
        text: { ko: '즐기고 웃고 있다', en: 'Having fun and laughing' },
        archetypes: { jester: 3, innocent: 2, lover: 1 }
      }
    ]
  },
  {
    id: 'q3',
    question: {
      ko: '꿈에서 자주 등장하는 장소는?',
      en: 'What location appears most often in your dreams?'
    },
    options: [
      {
        text: { ko: '미지의 광활한 공간 (숲, 우주, 바다)', en: 'Vast unknown spaces (forest, space, ocean)' },
        archetypes: { explorer: 3, sage: 2, innocent: 1 }
      },
      {
        text: { ko: '따뜻한 집이나 안전한 공간', en: 'Warm home or safe space' },
        archetypes: { innocent: 3, caregiver: 2, lover: 1 }
      },
      {
        text: { ko: '화려한 파티나 무대', en: 'Glamorous party or stage' },
        archetypes: { jester: 3, lover: 2, ruler: 1 }
      },
      {
        text: { ko: '전쟁터나 위험한 장소', en: 'Battlefield or dangerous place' },
        archetypes: { warrior: 3, outlaw: 2, ruler: 1 }
      },
      {
        text: { ko: '신비로운 장소나 도서관', en: 'Mysterious place or library' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      }
    ]
  },
  {
    id: 'q4',
    question: {
      ko: '꿈에서 문제에 직면했을 때 당신은?',
      en: 'When facing a problem in your dreams, you...'
    },
    options: [
      {
        text: { ko: '분석하고 이해하려고 노력한다', en: 'Try to analyze and understand it' },
        archetypes: { sage: 3, creator: 2, magician: 1 }
      },
      {
        text: { ko: '직접 맞서 싸운다', en: 'Face it head-on and fight' },
        archetypes: { warrior: 3, outlaw: 2, ruler: 1 }
      },
      {
        text: { ko: '창의적인 해결책을 찾는다', en: 'Find creative solutions' },
        archetypes: { creator: 3, magician: 2, jester: 1 }
      },
      {
        text: { ko: '도움을 요청하거나 협력한다', en: 'Ask for help or cooperate' },
        archetypes: { caregiver: 3, innocent: 2, lover: 1 }
      },
      {
        text: { ko: '규칙을 깨고 자유롭게 행동한다', en: 'Break the rules and act freely' },
        archetypes: { outlaw: 3, jester: 2, explorer: 1 }
      }
    ]
  },
  {
    id: 'q5',
    question: {
      ko: '꿈에서 가장 중요하게 여기는 가치는?',
      en: 'What value is most important to you in dreams?'
    },
    options: [
      {
        text: { ko: '진실과 지혜', en: 'Truth and wisdom' },
        archetypes: { sage: 3, creator: 2, explorer: 1 }
      },
      {
        text: { ko: '사랑과 관계', en: 'Love and relationships' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '자유와 독립', en: 'Freedom and independence' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '힘과 리더십', en: 'Power and leadership' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      },
      {
        text: { ko: '창조와 혁신', en: 'Creation and innovation' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      }
    ]
  },
  {
    id: 'q6',
    question: {
      ko: '악몽을 꿀 때 주로 등장하는 것은?',
      en: 'What usually appears in your nightmares?'
    },
    options: [
      {
        text: { ko: '버림받거나 혼자 있는 상황', en: 'Being abandoned or alone' },
        archetypes: { orphan: 3, innocent: 2, lover: 1 }
      },
      {
        text: { ko: '통제할 수 없는 상황', en: 'Situations out of control' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      },
      {
        text: { ko: '갇히거나 제한받는 상황', en: 'Being trapped or restricted' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '실패하거나 무능한 모습', en: 'Failure or incompetence' },
        archetypes: { warrior: 3, creator: 2, sage: 1 }
      },
      {
        text: { ko: '사랑하는 사람을 잃는 것', en: 'Losing loved ones' },
        archetypes: { caregiver: 3, lover: 2, innocent: 1 }
      }
    ]
  },
  {
    id: 'q7',
    question: {
      ko: '꿈에서 만나는 사람들은 주로?',
      en: 'People you meet in dreams are usually...'
    },
    options: [
      {
        text: { ko: '현명한 스승이나 안내자', en: 'Wise teachers or guides' },
        archetypes: { sage: 3, magician: 2, innocent: 1 }
      },
      {
        text: { ko: '가족이나 친한 친구들', en: 'Family or close friends' },
        archetypes: { innocent: 3, caregiver: 2, lover: 1 }
      },
      {
        text: { ko: '낯선 사람들이나 적', en: 'Strangers or enemies' },
        archetypes: { warrior: 3, outlaw: 2, explorer: 1 }
      },
      {
        text: { ko: '신비롭거나 초자연적 존재', en: 'Mysterious or supernatural beings' },
        archetypes: { magician: 3, sage: 2, creator: 1 }
      },
      {
        text: { ko: '유명인이나 권력자', en: 'Celebrities or authority figures' },
        archetypes: { ruler: 3, jester: 2, lover: 1 }
      }
    ]
  },
  {
    id: 'q8',
    question: {
      ko: '꿈에서 초능력을 얻는다면?',
      en: 'If you gained superpowers in a dream?'
    },
    options: [
      {
        text: { ko: '날아다니거나 순간이동', en: 'Flying or teleportation' },
        archetypes: { explorer: 3, jester: 2, innocent: 1 }
      },
      {
        text: { ko: '사람들을 치유하는 능력', en: 'Ability to heal people' },
        archetypes: { caregiver: 3, innocent: 2, magician: 1 }
      },
      {
        text: { ko: '마음을 읽거나 미래를 보는 능력', en: 'Mind reading or seeing the future' },
        archetypes: { sage: 3, magician: 2, ruler: 1 }
      },
      {
        text: { ko: '무적의 힘이나 전투 능력', en: 'Invincibility or combat skills' },
        archetypes: { warrior: 3, ruler: 2, outlaw: 1 }
      },
      {
        text: { ko: '무에서 유를 창조하는 능력', en: 'Ability to create from nothing' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      }
    ]
  }
];

// Calculate archetype from quiz answers
export function calculateArchetypeFromQuiz(answers: Record<string, number>): {
  primary: string;
  secondary: string | null;
  scores: Record<string, number>;
} {
  const scores: Record<string, number> = {};

  // Process each answer
  Object.entries(answers).forEach(([questionId, optionIndex]) => {
    const question = ARCHETYPE_QUIZ_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;

    const option = question.options[optionIndex];
    if (!option) return;

    // Add scores from this answer
    Object.entries(option.archetypes).forEach(([archetype, points]) => {
      scores[archetype] = (scores[archetype] || 0) + points;
    });
  });

  // Sort archetypes by score
  const sortedArchetypes = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const primary = sortedArchetypes[0]?.[0] || 'explorer';
  const secondary = sortedArchetypes[1]?.[0] || null;

  return {
    primary,
    secondary,
    scores
  };
}

// Get quiz progress percentage
export function getQuizProgress(answers: Record<string, number>): number {
  return (Object.keys(answers).length / ARCHETYPE_QUIZ_QUESTIONS.length) * 100;
}
