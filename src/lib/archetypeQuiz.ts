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
  // Q1: 꿈-감정 (쉬움)
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
  // Q2: 철학-지도 없는 길 (쉬움)
  {
    id: 'q2',
    question: {
      ko: '지도가 없는 길을 선택할 수 있나요?',
      en: 'Can you choose a path without a map?'
    },
    options: [
      {
        text: { ko: '설레는 도전이다', en: 'An exciting challenge' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '불안하지만 해볼 수 있다', en: 'Anxious but willing to try' },
        archetypes: { warrior: 3, creator: 2, magician: 1 }
      },
      {
        text: { ko: '먼저 정보를 충분히 모으고 싶다', en: 'Want to gather information first' },
        archetypes: { sage: 3, ruler: 2, creator: 1 }
      },
      {
        text: { ko: '누군가와 함께라면 괜찮다', en: 'Fine if with someone' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '가능한 피하고 싶다', en: 'Would rather avoid it' },
        archetypes: { innocent: 3, orphan: 2, caregiver: 1 }
      }
    ]
  },
  // Q3: 꿈-행동 (쉬움)
  {
    id: 'q3',
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
  // Q4: 철학-이상적인 하루 (쉬움)
  {
    id: 'q4',
    question: {
      ko: '당신의 이상적인 하루는 어떤 모습인가요?',
      en: 'What does your ideal day look like?'
    },
    options: [
      {
        text: { ko: '새로운 것을 배우고 깨닫는 하루', en: 'Learning and discovering new things' },
        archetypes: { sage: 3, explorer: 2, creator: 1 }
      },
      {
        text: { ko: '사랑하는 사람과 함께하는 하루', en: 'Spending time with loved ones' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '무언가를 만들어내고 완성하는 하루', en: 'Creating and completing something' },
        archetypes: { creator: 3, magician: 2, warrior: 1 }
      },
      {
        text: { ko: '자유롭게 돌아다니고 탐험하는 하루', en: 'Freely wandering and exploring' },
        archetypes: { explorer: 3, jester: 2, outlaw: 1 }
      },
      {
        text: { ko: '목표를 달성하고 영향력을 발휘하는 하루', en: 'Achieving goals and making impact' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      }
    ]
  },
  // Q5: 꿈-장소 (쉬움)
  {
    id: 'q5',
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
  // Q6: 철학-혼자 vs 함께 (중간)
  {
    id: 'q6',
    question: {
      ko: '혼자서 완성하는 세계와, 함께 만들어가는 세계 중 어디에 더 끌리나요?',
      en: 'Between a world you complete alone and one built together, which attracts you more?'
    },
    options: [
      {
        text: { ko: '혼자 완성하는 온전한 나만의 세계', en: 'A complete world that\'s entirely mine' },
        archetypes: { creator: 3, sage: 2, explorer: 1 }
      },
      {
        text: { ko: '함께 만들어가는 불완전하지만 따뜻한 세계', en: 'An imperfect but warm world built together' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '내가 이끄는 함께하는 세계', en: 'A shared world that I lead' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      },
      {
        text: { ko: '계속 변화하고 재창조되는 세계', en: 'An ever-changing, recreating world' },
        archetypes: { magician: 3, creator: 2, jester: 1 }
      },
      {
        text: { ko: '정해진 규칙 없이 자유로운 세계', en: 'A free world without set rules' },
        archetypes: { outlaw: 3, explorer: 2, jester: 1 }
      }
    ]
  },
  // Q7: 꿈-사람들 (중간)
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
  // Q8: 철학-변화 태도 (중간)
  {
    id: 'q8',
    question: {
      ko: '변화 앞에서 당신은 어떤 태도를 취하나요?',
      en: 'How do you approach change?'
    },
    options: [
      {
        text: { ko: '적극적으로 변화를 만들어간다', en: 'Actively create change' },
        archetypes: { magician: 3, outlaw: 2, warrior: 1 }
      },
      {
        text: { ko: '변화를 분석하고 이해하려 한다', en: 'Analyze and understand change' },
        archetypes: { sage: 3, ruler: 2, creator: 1 }
      },
      {
        text: { ko: '변화를 받아들이고 적응한다', en: 'Accept and adapt to change' },
        archetypes: { explorer: 3, jester: 2, innocent: 1 }
      },
      {
        text: { ko: '변화에 저항하고 안정을 추구한다', en: 'Resist change and seek stability' },
        archetypes: { innocent: 3, caregiver: 2, ruler: 1 }
      },
      {
        text: { ko: '함께 변화를 겪고 싶어한다', en: 'Want to go through change together' },
        archetypes: { lover: 3, caregiver: 2, warrior: 1 }
      }
    ]
  },
  // Q9: 철학-어려운 순간에 필요한 것 (중간, Q4 대체)
  {
    id: 'q9',
    question: {
      ko: '어려운 순간, 당신에게 가장 필요한 것은?',
      en: 'In difficult moments, what do you need most?'
    },
    options: [
      {
        text: { ko: '혼자만의 시간과 고요함', en: 'Time alone and silence' },
        archetypes: { sage: 3, creator: 2, innocent: 1 }
      },
      {
        text: { ko: '믿을 수 있는 사람의 위로', en: 'Comfort from someone I trust' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '즉시 행동하고 돌파하는 용기', en: 'Courage to act and break through' },
        archetypes: { warrior: 3, outlaw: 2, ruler: 1 }
      },
      {
        text: { ko: '새로운 관점과 창의적 해결책', en: 'New perspective and creative solutions' },
        archetypes: { creator: 3, magician: 2, jester: 1 }
      },
      {
        text: { ko: '낯선 곳으로 떠날 자유', en: 'Freedom to escape somewhere new' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      }
    ]
  },
  // Q10: 철학-가치 (어려움)
  {
    id: 'q10',
    question: {
      ko: '인생에서 가장 중요한 가치는 무엇인가요?',
      en: 'What is the most important value in life?'
    },
    options: [
      {
        text: { ko: '진실과 지혜', en: 'Truth and wisdom' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '사랑과 연결', en: 'Love and connection' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '자유와 모험', en: 'Freedom and adventure' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '성취와 영향력', en: 'Achievement and influence' },
        archetypes: { ruler: 3, warrior: 2, creator: 1 }
      },
      {
        text: { ko: '창조와 표현', en: 'Creation and expression' },
        archetypes: { creator: 3, magician: 2, jester: 1 }
      }
    ]
  },
  // Q11: 꿈-악몽 (어려움)
  {
    id: 'q11',
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
  // Q12: 철학-안전 vs 의미 (어려움)
  {
    id: 'q12',
    question: {
      ko: '안전한 삶이지만 의미 없는 하루와, 불안하지만 살아있다고 느끼는 하루 중 어느 쪽을 택하겠나요?',
      en: 'Between a safe but meaningless life and an uncertain but vivid life, which would you choose?'
    },
    options: [
      {
        text: { ko: '불안해도 살아있다고 느끼는 삶', en: 'Vivid life, even if uncertain' },
        archetypes: { explorer: 3, warrior: 2, outlaw: 2 }
      },
      {
        text: { ko: '안전이 먼저, 의미는 그 안에서 찾는다', en: 'Safety first, find meaning within' },
        archetypes: { innocent: 3, caregiver: 2, ruler: 1 }
      },
      {
        text: { ko: '둘 다 필요하다, 균형을 찾고 싶다', en: 'Need both, seeking balance' },
        archetypes: { sage: 3, magician: 2, lover: 1 }
      },
      {
        text: { ko: '내가 직접 의미를 만들어낼 수 있다', en: 'I can create meaning myself' },
        archetypes: { creator: 3, magician: 2, ruler: 1 }
      },
      {
        text: { ko: '살아있다는 느낌 자체가 중요하다', en: 'The feeling of being alive matters' },
        archetypes: { jester: 3, lover: 2, warrior: 1 }
      }
    ]
  },
  // Q13: 철학-관계 vs 독립 (어려움, Q5 대체)
  {
    id: 'q13',
    question: {
      ko: '깊은 유대와 의존 관계, 완전한 독립과 고독 중 어느 쪽이 당신의 본성에 가까운가요?',
      en: 'Between deep bonds with dependence and complete independence with solitude, which is closer to your nature?'
    },
    options: [
      {
        text: { ko: '깊은 유대, 서로 의존하는 관계가 나를 완성한다', en: 'Deep bonds complete me, interdependence is natural' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '완전한 독립, 혼자여야 진정한 내가 된다', en: 'Complete independence, I am most authentic alone' },
        archetypes: { creator: 3, sage: 2, explorer: 1 }
      },
      {
        text: { ko: '독립적이되 사람들과 함께 성장한다', en: 'Independent but growing together with others' },
        archetypes: { warrior: 3, ruler: 2, magician: 1 }
      },
      {
        text: { ko: '자유롭게 연결되고 쉽게 떠난다', en: 'Connect freely and leave easily' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '둘 다 필요 없다, 나만의 세계를 창조한다', en: 'Need neither, create my own world' },
        archetypes: { magician: 3, creator: 2, outlaw: 1 }
      }
    ]
  },
  // Q14: 철학-두려움 (어려움)
  {
    id: 'q14',
    question: {
      ko: '당신이 가장 두려워하는 것은 무엇인가요?',
      en: 'What do you fear most?'
    },
    options: [
      {
        text: { ko: '버림받고 혼자 남겨지는 것', en: 'Being abandoned and left alone' },
        archetypes: { orphan: 3, lover: 2, innocent: 1 }
      },
      {
        text: { ko: '자유를 잃고 갇히는 것', en: 'Losing freedom and being trapped' },
        archetypes: { explorer: 3, outlaw: 2, warrior: 1 }
      },
      {
        text: { ko: '무능하고 쓸모없어지는 것', en: 'Becoming incompetent and useless' },
        archetypes: { warrior: 3, creator: 2, ruler: 1 }
      },
      {
        text: { ko: '진실을 모르고 속는 것', en: 'Not knowing truth and being deceived' },
        archetypes: { sage: 3, magician: 2, ruler: 1 }
      },
      {
        text: { ko: '평범하고 특별하지 않은 삶', en: 'An ordinary, unremarkable life' },
        archetypes: { jester: 3, creator: 2, outlaw: 1 }
      }
    ]
  },
  // Q15: 철학-세상 바꾸기 (어려움)
  {
    id: 'q15',
    question: {
      ko: '당신은 세상을 어떻게 바꾸고 싶나요?',
      en: 'How do you want to change the world?'
    },
    options: [
      {
        text: { ko: '지혜와 지식을 나누고 싶다', en: 'Share wisdom and knowledge' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '사람들을 돌보고 치유하고 싶다', en: 'Care for and heal people' },
        archetypes: { caregiver: 3, innocent: 2, lover: 1 }
      },
      {
        text: { ko: '불의에 맞서고 자유를 지키고 싶다', en: 'Fight injustice and protect freedom' },
        archetypes: { warrior: 3, outlaw: 2, ruler: 1 }
      },
      {
        text: { ko: '새로운 것을 창조하고 싶다', en: 'Create something new' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      },
      {
        text: { ko: '기쁨과 웃음을 전하고 싶다', en: 'Spread joy and laughter' },
        archetypes: { jester: 3, lover: 2, innocent: 1 }
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
