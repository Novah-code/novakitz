// Archetype Quiz - Questionnaire-based archetype determination
// This allows new users to discover their archetype without recording 5 dreams
// Redesigned with Jungian unconscious principles for general audiences

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
  // Q1: 꿈-깨어날 때 (무의식 → 의식 전환)
  {
    id: 'q1',
    question: {
      ko: '꿈에서 깨어났을 때, 남아있는 느낌은?',
      en: 'When you wake from a dream, what feeling remains?'
    },
    options: [
      {
        text: { ko: '설렘과 궁금증', en: 'Excitement and curiosity' },
        archetypes: { explorer: 3, sage: 2, magician: 1 }
      },
      {
        text: { ko: '따뜻함과 그리움', en: 'Warmth and longing' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '불안과 막연한 두려움', en: 'Anxiety and vague fear' },
        archetypes: { innocent: 3, caregiver: 2, lover: 1 }
      },
      {
        text: { ko: '힘이 솟는 느낌', en: 'Feeling energized' },
        archetypes: { warrior: 3, ruler: 2, magician: 1 }
      },
      {
        text: { ko: '해방감과 자유로움', en: 'Liberation and freedom' },
        archetypes: { outlaw: 3, jester: 2, explorer: 1 }
      }
    ]
  },

  // Q2: 꿈-반복 상황 (억압된 콤플렉스)
  {
    id: 'q2',
    question: {
      ko: '꿈에서 자주 반복되는 상황이 있다면?',
      en: 'If there\'s a recurring situation in your dreams?'
    },
    options: [
      {
        text: { ko: '길을 잃거나 헤매고 있다', en: 'Lost or wandering' },
        archetypes: { explorer: 3, innocent: 2, sage: 1 }
      },
      {
        text: { ko: '누군가를 찾거나 기다리고 있다', en: 'Searching for or waiting for someone' },
        archetypes: { lover: 3, innocent: 2, caregiver: 1 }
      },
      {
        text: { ko: '무언가를 만들거나 고치고 있다', en: 'Creating or fixing something' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      },
      {
        text: { ko: '쫓기거나 싸우고 있다', en: 'Being chased or fighting' },
        archetypes: { warrior: 3, outlaw: 2, innocent: 1 }
      },
      {
        text: { ko: '날거나 웃고 있다', en: 'Flying or laughing' },
        archetypes: { jester: 3, innocent: 2, explorer: 1 }
      },
      {
        text: { ko: '특별히 반복되는 꿈은 없다', en: 'No recurring dreams' },
        archetypes: { everyman: 3, innocent: 2, ruler: 1 }
      }
    ]
  },

  // Q3: 투사-영화 주인공 (페르소나 vs 진짜 나)
  {
    id: 'q3',
    question: {
      ko: '영화 속 주인공이 혼자 남겨졌을 때, 이 사람은 무엇을 할까요?',
      en: 'When a movie protagonist is left alone, what do they do?'
    },
    options: [
      {
        text: { ko: '새로운 길을 찾아 떠난다', en: 'Set out to find a new path' },
        archetypes: { explorer: 3, warrior: 2, outlaw: 1 }
      },
      {
        text: { ko: '혼자 앉아서 울거나 멍하니 있다', en: 'Sit alone, crying or spacing out' },
        archetypes: { innocent: 3, lover: 2, caregiver: 1 }
      },
      {
        text: { ko: '상황을 분석하고 계획을 세운다', en: 'Analyze the situation and make a plan' },
        archetypes: { sage: 3, ruler: 2, creator: 1 }
      },
      {
        text: { ko: '무언가를 만들거나 변화를 시도한다', en: 'Create something or attempt change' },
        archetypes: { creator: 3, magician: 2, warrior: 1 }
      },
      {
        text: { ko: '농담하거나 노래를 부른다', en: 'Make jokes or sing' },
        archetypes: { jester: 3, innocent: 2, lover: 1 }
      }
    ]
  },

  // Q4: 꿈-장소 (집단 무의식 상징)
  {
    id: 'q4',
    question: {
      ko: '꿈에서 가장 자주 등장하는 장소는?',
      en: 'What location appears most often in your dreams?'
    },
    options: [
      {
        text: { ko: '끝없는 숲, 바다, 우주 같은 미지의 공간', en: 'Endless forest, ocean, space - unknown territories' },
        archetypes: { explorer: 3, sage: 2, innocent: 1 }
      },
      {
        text: { ko: '따뜻한 집이나 어릴 적 장소', en: 'Warm home or childhood place' },
        archetypes: { innocent: 3, caregiver: 2, lover: 1 }
      },
      {
        text: { ko: '파티, 무대, 사람들이 많은 곳', en: 'Party, stage, crowded place' },
        archetypes: { jester: 3, lover: 2, everyman: 1 }
      },
      {
        text: { ko: '위험한 곳, 무너지는 건물, 어두운 길', en: 'Dangerous place, crumbling building, dark path' },
        archetypes: { warrior: 3, outlaw: 2, explorer: 1 }
      },
      {
        text: { ko: '신비로운 도서관, 연구실, 비밀의 방', en: 'Mysterious library, lab, secret room' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '성, 궁전, 높은 건물 꼭대기', en: 'Castle, palace, top of tall building' },
        archetypes: { ruler: 3, warrior: 2, creator: 1 }
      }
    ]
  },

  // Q5: 일상-위기 순간 (무의식적 방어 기제)
  {
    id: 'q5',
    question: {
      ko: '예상치 못한 문제가 터졌을 때, 당신의 첫 반응은?',
      en: 'When an unexpected problem arises, your first reaction is?'
    },
    options: [
      {
        text: { ko: '일단 그 자리를 피하고 싶다', en: 'Want to escape the situation' },
        archetypes: { innocent: 3, caregiver: 2, explorer: 1 }
      },
      {
        text: { ko: '누군가에게 도움을 요청한다', en: 'Ask someone for help' },
        archetypes: { lover: 3, caregiver: 2, everyman: 1 }
      },
      {
        text: { ko: '침착하게 상황을 파악한다', en: 'Calmly assess the situation' },
        archetypes: { sage: 3, ruler: 2, warrior: 1 }
      },
      {
        text: { ko: '즉시 행동해서 해결한다', en: 'Act immediately to solve it' },
        archetypes: { warrior: 3, ruler: 2, outlaw: 1 }
      },
      {
        text: { ko: '농담으로 분위기를 풀려고 한다', en: 'Try to lighten the mood with humor' },
        archetypes: { jester: 3, everyman: 2, innocent: 1 }
      },
      {
        text: { ko: '새로운 각도로 문제를 본다', en: 'Look at the problem from a new angle' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      }
    ]
  },

  // Q6: 꿈-만나는 사람 (투사된 내면)
  {
    id: 'q6',
    question: {
      ko: '꿈에서 만나는 사람들은 주로 어떤 존재인가요?',
      en: 'People you meet in dreams are usually...?'
    },
    options: [
      {
        text: { ko: '가족이나 오래된 친구들', en: 'Family or old friends' },
        archetypes: { innocent: 3, caregiver: 2, lover: 1 }
      },
      {
        text: { ko: '낯선 사람들이나 적대적인 존재', en: 'Strangers or hostile beings' },
        archetypes: { warrior: 3, outlaw: 2, innocent: 1 }
      },
      {
        text: { ko: '현명한 스승이나 노인', en: 'Wise teacher or elder' },
        archetypes: { sage: 3, magician: 2, innocent: 1 }
      },
      {
        text: { ko: '신비한 존재나 동물', en: 'Mysterious beings or animals' },
        archetypes: { magician: 3, sage: 2, creator: 1 }
      },
      {
        text: { ko: '유명인이나 리더', en: 'Celebrities or leaders' },
        archetypes: { ruler: 3, jester: 2, everyman: 1 }
      },
      {
        text: { ko: '사람이 거의 안 나오고 혼자 있다', en: 'Rarely anyone, mostly alone' },
        archetypes: { creator: 3, explorer: 2, sage: 1 }
      }
    ]
  },

  // Q7: 투사-동화 결말 (귀환 단계)
  {
    id: 'q7',
    question: {
      ko: '모험을 마치고 돌아온 주인공, 무엇을 가장 하고 싶을까요?',
      en: 'After returning from an adventure, what does the hero want most?'
    },
    options: [
      {
        text: { ko: '배운 것을 사람들에게 가르쳐주고 싶다', en: 'Teach what they learned to others' },
        archetypes: { sage: 3, caregiver: 2, everyman: 1 }
      },
      {
        text: { ko: '사랑하는 사람과 함께 있고 싶다', en: 'Be with loved ones' },
        archetypes: { lover: 3, innocent: 2, caregiver: 1 }
      },
      {
        text: { ko: '이번엔 더 큰 모험을 떠나고 싶다', en: 'Embark on an even bigger adventure' },
        archetypes: { explorer: 3, warrior: 2, outlaw: 1 }
      },
      {
        text: { ko: '자신만의 왕국이나 작품을 만들고 싶다', en: 'Create their own kingdom or work' },
        archetypes: { creator: 3, ruler: 2, magician: 1 }
      },
      {
        text: { ko: '모두와 함께 축제를 열고 싶다', en: 'Celebrate with everyone' },
        archetypes: { jester: 3, everyman: 2, lover: 1 }
      },
      {
        text: { ko: '조용히 혼자만의 시간을 갖고 싶다', en: 'Have quiet time alone' },
        archetypes: { sage: 3, creator: 2, innocent: 1 }
      }
    ]
  },

  // Q8: 일상-혼자 있을 때 (진정한 자기)
  {
    id: 'q8',
    question: {
      ko: '아무도 보지 않는 혼자만의 시간, 당신은?',
      en: 'When no one is watching and you\'re alone, you...?'
    },
    options: [
      {
        text: { ko: '무언가를 만들거나 쓰고 있다', en: 'Creating or writing something' },
        archetypes: { creator: 3, sage: 2, magician: 1 }
      },
      {
        text: { ko: '음악을 듣거나 춤추고 있다', en: 'Listening to music or dancing' },
        archetypes: { jester: 3, lover: 2, innocent: 1 }
      },
      {
        text: { ko: '깊은 생각에 잠겨 있다', en: 'Lost in deep thought' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '운동하거나 몸을 움직이고 있다', en: 'Exercising or moving your body' },
        archetypes: { warrior: 3, explorer: 2, ruler: 1 }
      },
      {
        text: { ko: '불안하거나 공허한 느낌이 든다', en: 'Feeling anxious or empty' },
        archetypes: { innocent: 3, lover: 2, caregiver: 1 }
      },
      {
        text: { ko: '계획을 세우거나 정리하고 있다', en: 'Making plans or organizing' },
        archetypes: { ruler: 3, sage: 2, caregiver: 1 }
      }
    ]
  },

  // Q9: 꿈-어둠 속에서 (뱃속 단계)
  {
    id: 'q9',
    question: {
      ko: '꿈에서 완전한 어둠 속에 갇혔다면, 당신은?',
      en: 'If trapped in complete darkness in a dream, you...?'
    },
    options: [
      {
        text: { ko: '고요히 기다리며 무언가를 느낀다', en: 'Wait quietly and sense something' },
        archetypes: { sage: 3, innocent: 2, magician: 1 }
      },
      {
        text: { ko: '패닉 상태로 깨거나 소리를 지른다', en: 'Panic and wake up or scream' },
        archetypes: { innocent: 3, caregiver: 2, warrior: 1 }
      },
      {
        text: { ko: '탈출구를 찾으며 계속 움직인다', en: 'Keep moving to find an exit' },
        archetypes: { explorer: 3, warrior: 2, outlaw: 1 }
      },
      {
        text: { ko: '어둠 자체와 대화하거나 관찰한다', en: 'Talk to or observe the darkness itself' },
        archetypes: { magician: 3, sage: 2, creator: 1 }
      },
      {
        text: { ko: '누군가를 부르거나 찾는다', en: 'Call for or search for someone' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '어둠을 즐기거나 빛을 만들어낸다', en: 'Enjoy the darkness or create light' },
        archetypes: { jester: 3, creator: 2, magician: 1 }
      }
    ]
  },

  // Q10: 일상-거울 앞에서 (자아 인식)
  {
    id: 'q10',
    question: {
      ko: '거울을 볼 때 드는 생각은?',
      en: 'What do you think when looking in a mirror?'
    },
    options: [
      {
        text: { ko: '내가 나답지 않게 보인다', en: 'I don\'t look like myself' },
        archetypes: { innocent: 3, creator: 2, magician: 1 }
      },
      {
        text: { ko: '더 나아지고 싶다', en: 'Want to improve' },
        archetypes: { warrior: 3, ruler: 2, creator: 1 }
      },
      {
        text: { ko: '있는 그대로 괜찮다', en: 'I\'m okay as I am' },
        archetypes: { innocent: 3, everyman: 2, sage: 1 }
      },
      {
        text: { ko: '다른 사람들은 나를 어떻게 볼까?', en: 'How do others see me?' },
        archetypes: { lover: 3, jester: 2, everyman: 1 }
      },
      {
        text: { ko: '거울 속 내가 낯설다', en: 'The person in the mirror feels strange' },
        archetypes: { magician: 3, sage: 2, explorer: 1 }
      },
      {
        text: { ko: '별 생각 없다', en: 'No particular thought' },
        archetypes: { explorer: 3, jester: 2, caregiver: 1 }
      }
    ]
  },

  // Q11: 꿈-악몽 (그림자)
  {
    id: 'q11',
    question: {
      ko: '악몽을 꿀 때 가장 무서운 것은?',
      en: 'What\'s most terrifying in nightmares?'
    },
    options: [
      {
        text: { ko: '버림받거나 혼자 남겨지는 것', en: 'Being abandoned or left alone' },
        archetypes: { innocent: 3, lover: 2, caregiver: 1 }
      },
      {
        text: { ko: '통제할 수 없는 상황', en: 'Situations out of control' },
        archetypes: { ruler: 3, warrior: 2, magician: 1 }
      },
      {
        text: { ko: '갇히거나 움직일 수 없는 것', en: 'Being trapped or unable to move' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '실패하거나 무너지는 것', en: 'Failure or collapse' },
        archetypes: { warrior: 3, creator: 2, ruler: 1 }
      },
      {
        text: { ko: '사랑하는 사람이 다치는 것', en: 'Loved ones getting hurt' },
        archetypes: { caregiver: 3, lover: 2, innocent: 1 }
      },
      {
        text: { ko: '정체를 알 수 없는 무언가', en: 'Something unidentifiable' },
        archetypes: { sage: 3, magician: 2, innocent: 1 }
      }
    ]
  },

  // Q12: 투사-친구의 고민 (대극 통합)
  {
    id: 'q12',
    question: {
      ko: '친구가 "안전하지만 지루한 삶 vs 불안하지만 의미있는 삶" 중 고민한다면?',
      en: 'If a friend is torn between "safe but boring life" vs "uncertain but meaningful life"?'
    },
    options: [
      {
        text: { ko: '당연히 불안해도 의미를 택해야지', en: 'Obviously choose meaning despite uncertainty' },
        archetypes: { explorer: 3, warrior: 2, outlaw: 2 }
      },
      {
        text: { ko: '안전이 먼저야, 그 안에서 의미를 찾으면 돼', en: 'Safety first, find meaning within that' },
        archetypes: { innocent: 3, caregiver: 2, ruler: 1 }
      },
      {
        text: { ko: '둘 다 가질 수 있는 방법을 찾아봐', en: 'Find a way to have both' },
        archetypes: { sage: 3, magician: 2, ruler: 1 }
      },
      {
        text: { ko: '네가 직접 의미를 만들면 돼', en: 'You can create your own meaning' },
        archetypes: { creator: 3, magician: 2, warrior: 1 }
      },
      {
        text: { ko: '뭐든 재미있게 살면 되는 거 아냐?', en: 'Just live however it\'s fun?' },
        archetypes: { jester: 3, everyman: 2, lover: 1 }
      }
    ]
  },

  // Q13: 일상-관계의 거리 (친밀 vs 독립)
  {
    id: 'q13',
    question: {
      ko: '사람들과의 관계에서 당신은?',
      en: 'In relationships with others, you...?'
    },
    options: [
      {
        text: { ko: '깊게 연결되고 서로 의지하고 싶다', en: 'Want deep connection and mutual dependence' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '혼자 있을 때 가장 편하다', en: 'Feel most comfortable alone' },
        archetypes: { creator: 3, sage: 2, explorer: 1 }
      },
      {
        text: { ko: '독립적이지만 함께 성장하고 싶다', en: 'Independent but want to grow together' },
        archetypes: { warrior: 3, ruler: 2, magician: 1 }
      },
      {
        text: { ko: '가볍게 만나고 쉽게 떠나고 싶다', en: 'Meet casually and leave easily' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '사람들이 나를 이해 못 할 것 같다', en: 'Feel people won\'t understand me' },
        archetypes: { innocent: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '적당한 거리에서 편안하게 지내고 싶다', en: 'Want to maintain comfortable distance' },
        archetypes: { everyman: 3, sage: 2, innocent: 1 }
      }
    ]
  },

  // Q14: 일상-실패의 순간 (콤플렉스)
  {
    id: 'q14',
    question: {
      ko: '중요한 일에 실패했을 때, 가장 먼저 드는 생각은?',
      en: 'When you fail at something important, your first thought is?'
    },
    options: [
      {
        text: { ko: '역시 나는 안 되는구나', en: 'I knew I couldn\'t do it' },
        archetypes: { innocent: 3, lover: 2, caregiver: 1 }
      },
      {
        text: { ko: '다시 도전해야지', en: 'I must try again' },
        archetypes: { warrior: 3, explorer: 2, outlaw: 1 }
      },
      {
        text: { ko: '뭐가 잘못됐는지 분석해야겠다', en: 'Need to analyze what went wrong' },
        archetypes: { sage: 3, ruler: 2, creator: 1 }
      },
      {
        text: { ko: '다른 방법을 찾아보자', en: 'Let\'s find another way' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      },
      {
        text: { ko: '괜찮아, 다 별거 아니야', en: 'It\'s okay, not a big deal' },
        archetypes: { jester: 3, everyman: 2, innocent: 1 }
      },
      {
        text: { ko: '누군가에게 위로받고 싶다', en: 'Want comfort from someone' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      }
    ]
  },

  // Q15: 일상-인생의 의미 (최종 가치관)
  {
    id: 'q15',
    question: {
      ko: '인생에서 가장 중요한 것은?',
      en: 'What matters most in life?'
    },
    options: [
      {
        text: { ko: '진실을 알고 이해하는 것', en: 'Knowing and understanding truth' },
        archetypes: { sage: 3, magician: 2, creator: 1 }
      },
      {
        text: { ko: '사랑하고 사랑받는 것', en: 'Loving and being loved' },
        archetypes: { lover: 3, caregiver: 2, innocent: 1 }
      },
      {
        text: { ko: '자유롭게 살아가는 것', en: 'Living freely' },
        archetypes: { explorer: 3, outlaw: 2, jester: 1 }
      },
      {
        text: { ko: '무언가를 이루고 남기는 것', en: 'Achieving and leaving something behind' },
        archetypes: { ruler: 3, warrior: 2, creator: 1 }
      },
      {
        text: { ko: '새로운 것을 만들어내는 것', en: 'Creating something new' },
        archetypes: { creator: 3, magician: 2, sage: 1 }
      },
      {
        text: { ko: '안전하고 평온한 것', en: 'Safety and peace' },
        archetypes: { innocent: 3, caregiver: 2, everyman: 1 }
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
