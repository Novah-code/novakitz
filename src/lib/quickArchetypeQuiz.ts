// 빠른 아키타입 진단 질문 (첫 꿈 + 7개 질문)

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
    archetypeScores: Record<string, number>; // 각 선택지가 어떤 아키타입에 점수를 주는지
  }>;
}

export const QUICK_ARCHETYPE_QUIZ: QuizQuestion[] = [
  {
    id: 'dream_feeling',
    question: {
      ko: '방금 기록한 꿈을 꾸고 깨어났을 때 어떤 느낌이 들었나요?',
      en: 'How did you feel when you woke up from this dream?'
    },
    options: [
      {
        text: { ko: '평화롭고 편안했어요', en: 'Peaceful and calm' },
        archetypeScores: { innocent: 1.0, caregiver: 0.5 }
      },
      {
        text: { ko: '흥분되고 모험하고 싶었어요', en: 'Excited and adventurous' },
        archetypeScores: { explorer: 1.0, hero: 0.5 }
      },
      {
        text: { ko: '혼란스럽고 이해하고 싶었어요', en: 'Confused and curious' },
        archetypeScores: { sage: 1.0, magician: 0.3 }
      },
      {
        text: { ko: '불안하거나 두려웠어요', en: 'Anxious or scared' },
        archetypeScores: { everyman: 0.7, caregiver: 0.3 }
      },
      {
        text: { ko: '창의적이고 영감을 받았어요', en: 'Creative and inspired' },
        archetypeScores: { creator: 1.0, magician: 0.5 }
      }
    ]
  },
  {
    id: 'life_approach',
    question: {
      ko: '일상에서 어려운 문제가 생기면 주로 어떻게 하시나요?',
      en: 'How do you usually handle difficult problems?'
    },
    options: [
      {
        text: { ko: '논리적으로 분석하고 연구해요', en: 'Analyze logically and research' },
        archetypeScores: { sage: 1.0, ruler: 0.3 }
      },
      {
        text: { ko: '과감하게 정면돌파해요', en: 'Face it head-on boldly' },
        archetypeScores: { hero: 1.0, outlaw: 0.5 }
      },
      {
        text: { ko: '다른 사람의 조언을 구해요', en: 'Seek advice from others' },
        archetypeScores: { everyman: 0.8, caregiver: 0.4 }
      },
      {
        text: { ko: '창의적인 해결책을 찾아요', en: 'Find creative solutions' },
        archetypeScores: { creator: 0.9, magician: 0.6 }
      },
      {
        text: { ko: '일단 긍정적으로 생각해요', en: 'Think positively first' },
        archetypeScores: { innocent: 1.0, jester: 0.4 }
      }
    ]
  },
  {
    id: 'social_role',
    question: {
      ko: '친구들 사이에서 당신은 어떤 역할인가요?',
      en: 'What role do you play among friends?'
    },
    options: [
      {
        text: { ko: '분위기 메이커', en: 'Life of the party' },
        archetypeScores: { jester: 1.0, lover: 0.3 }
      },
      {
        text: { ko: '조언자 / 멘토', en: 'Advisor / Mentor' },
        archetypeScores: { sage: 0.9, caregiver: 0.5 }
      },
      {
        text: { ko: '리더 / 결정자', en: 'Leader / Decision maker' },
        archetypeScores: { ruler: 1.0, hero: 0.4 }
      },
      {
        text: { ko: '경청자 / 위로자', en: 'Listener / Comforter' },
        archetypeScores: { caregiver: 1.0, everyman: 0.5 }
      },
      {
        text: { ko: '아이디어 제공자', en: 'Idea generator' },
        archetypeScores: { creator: 0.9, magician: 0.5 }
      },
      {
        text: { ko: '자유로운 관찰자', en: 'Free observer' },
        archetypeScores: { explorer: 0.8, sage: 0.4 }
      }
    ]
  },
  {
    id: 'change_attitude',
    question: {
      ko: '변화와 새로운 것에 대한 당신의 태도는?',
      en: 'What is your attitude toward change and new things?'
    },
    options: [
      {
        text: { ko: '항상 새로운 것을 찾아다녀요', en: 'Always seeking new things' },
        archetypeScores: { explorer: 1.0, outlaw: 0.4 }
      },
      {
        text: { ko: '변화를 두려워하지만 도전해요', en: 'Fear change but challenge it' },
        archetypeScores: { hero: 0.9, everyman: 0.3 }
      },
      {
        text: { ko: '안정을 선호하지만 필요하면 적응해요', en: 'Prefer stability but adapt when needed' },
        archetypeScores: { ruler: 0.7, everyman: 0.6 }
      },
      {
        text: { ko: '변화를 통해 성장한다고 믿어요', en: 'Believe growth comes from change' },
        archetypeScores: { magician: 0.9, creator: 0.5 }
      },
      {
        text: { ko: '현재에 만족하며 살아요', en: 'Content with the present' },
        archetypeScores: { innocent: 0.9, jester: 0.4 }
      }
    ]
  },
  {
    id: 'motivation',
    question: {
      ko: '무엇이 당신을 가장 움직이게 하나요?',
      en: 'What motivates you the most?'
    },
    options: [
      {
        text: { ko: '진리와 지식을 추구하는 것', en: 'Pursuing truth and knowledge' },
        archetypeScores: { sage: 1.0, magician: 0.3 }
      },
      {
        text: { ko: '사랑하는 사람들과의 관계', en: 'Relationships with loved ones' },
        archetypeScores: { lover: 1.0, caregiver: 0.6 }
      },
      {
        text: { ko: '목표 달성과 성공', en: 'Achievement and success' },
        archetypeScores: { hero: 0.9, ruler: 0.5 }
      },
      {
        text: { ko: '무언가를 만들어내는 것', en: 'Creating something' },
        archetypeScores: { creator: 1.0, magician: 0.4 }
      },
      {
        text: { ko: '자유와 독립', en: 'Freedom and independence' },
        archetypeScores: { explorer: 0.9, outlaw: 0.5 }
      },
      {
        text: { ko: '즐거움과 행복', en: 'Joy and happiness' },
        archetypeScores: { jester: 1.0, innocent: 0.5 }
      }
    ]
  },
  {
    id: 'conflict_response',
    question: {
      ko: '갈등 상황에서 당신은?',
      en: 'In conflict situations, you:'
    },
    options: [
      {
        text: { ko: '규칙과 질서를 강조해요', en: 'Emphasize rules and order' },
        archetypeScores: { ruler: 1.0, sage: 0.3 }
      },
      {
        text: { ko: '정의를 위해 싸워요', en: 'Fight for justice' },
        archetypeScores: { hero: 1.0, outlaw: 0.4 }
      },
      {
        text: { ko: '중재하고 화해시켜요', en: 'Mediate and reconcile' },
        archetypeScores: { caregiver: 0.9, everyman: 0.6 }
      },
      {
        text: { ko: '유머로 긴장을 풀어요', en: 'Use humor to ease tension' },
        archetypeScores: { jester: 1.0, lover: 0.3 }
      },
      {
        text: { ko: '기존 방식을 바꾸려고 해요', en: 'Try to change the old ways' },
        archetypeScores: { outlaw: 1.0, magician: 0.5 }
      },
      {
        text: { ko: '피하거나 관찰해요', en: 'Avoid or observe' },
        archetypeScores: { innocent: 0.6, explorer: 0.5 }
      }
    ]
  },
  {
    id: 'dream_world',
    question: {
      ko: '꿈에서 자주 나타나는 테마는?',
      en: 'What theme often appears in your dreams?'
    },
    options: [
      {
        text: { ko: '여행, 탐험, 새로운 장소', en: 'Travel, exploration, new places' },
        archetypeScores: { explorer: 1.0, hero: 0.3 }
      },
      {
        text: { ko: '사랑, 관계, 연결', en: 'Love, relationships, connection' },
        archetypeScores: { lover: 1.0, caregiver: 0.4 }
      },
      {
        text: { ko: '창조, 예술, 상상', en: 'Creation, art, imagination' },
        archetypeScores: { creator: 1.0, magician: 0.5 }
      },
      {
        text: { ko: '도전, 싸움, 극복', en: 'Challenge, fight, overcoming' },
        archetypeScores: { hero: 1.0, outlaw: 0.4 }
      },
      {
        text: { ko: '평화, 안전, 행복', en: 'Peace, safety, happiness' },
        archetypeScores: { innocent: 1.0, jester: 0.3 }
      },
      {
        text: { ko: '수수께끼, 비밀, 발견', en: 'Mystery, secrets, discovery' },
        archetypeScores: { sage: 0.9, magician: 0.6 }
      }
    ]
  }
];

/**
 * 첫 꿈 + 퀴즈 답변으로 빠른 아키타입 계산
 */
export function calculateQuickArchetype(
  dreamText: string,
  quizAnswers: Record<string, number> // questionId -> optionIndex
): {
  primaryArchetype: string;
  secondaryArchetype: string;
  archetypeScores: Record<string, number>;
  confidence: 'low' | 'medium' | 'high';
} {
  const scores: Record<string, number> = {
    innocent: 0,
    sage: 0,
    explorer: 0,
    outlaw: 0,
    magician: 0,
    hero: 0,
    lover: 0,
    jester: 0,
    everyman: 0,
    caregiver: 0,
    ruler: 0,
    creator: 0
  };

  // 퀴즈 답변 점수 합산
  QUICK_ARCHETYPE_QUIZ.forEach(question => {
    const answerIndex = quizAnswers[question.id];
    if (answerIndex !== undefined && question.options[answerIndex]) {
      const selectedOption = question.options[answerIndex];
      Object.entries(selectedOption.archetypeScores).forEach(([archetype, score]) => {
        scores[archetype] = (scores[archetype] || 0) + score;
      });
    }
  });

  // 꿈 텍스트 기반 간단한 키워드 분석 (보조)
  const dreamLower = dreamText.toLowerCase();

  // 간단한 키워드 매칭
  if (dreamLower.includes('여행') || dreamLower.includes('모험') || dreamLower.includes('travel')) {
    scores.explorer += 0.5;
  }
  if (dreamLower.includes('싸') || dreamLower.includes('fight') || dreamLower.includes('전쟁')) {
    scores.hero += 0.5;
  }
  if (dreamLower.includes('사랑') || dreamLower.includes('love') || dreamLower.includes('연인')) {
    scores.lover += 0.5;
  }
  if (dreamLower.includes('창조') || dreamLower.includes('만들') || dreamLower.includes('create')) {
    scores.creator += 0.5;
  }

  // 정규화
  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
  if (totalScore > 0) {
    Object.keys(scores).forEach(key => {
      scores[key] = scores[key] / totalScore;
    });
  }

  // 상위 2개 선택
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const primaryArchetype = sorted[0][0];
  const secondaryArchetype = sorted[1][0];

  // 신뢰도 계산 (주요 아키타입 점수가 얼마나 명확한지)
  const primaryScore = sorted[0][1];
  const secondaryScore = sorted[1][1];
  const gap = primaryScore - secondaryScore;

  let confidence: 'low' | 'medium' | 'high';
  if (gap > 0.15) {
    confidence = 'high';
  } else if (gap > 0.08) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    primaryArchetype,
    secondaryArchetype,
    archetypeScores: scores,
    confidence
  };
}
