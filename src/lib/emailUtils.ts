/**
 * Email utility functions for dynamic subject lines and unsubscribe links
 */

// Generate dynamic subject lines to avoid spam filters
export function generateDynamicSubject(
  type: 'daily-affirmation' | 'weekly-report' | 'retention-nudge',
  language: 'ko' | 'en',
  params?: {
    userName?: string;
    dayOfWeek?: string;
    keyword?: string;
  }
): string {
  const { userName, dayOfWeek, keyword } = params || {};

  const subjects = {
    'daily-affirmation': {
      ko: [
        `🌙 ${userName}님, ${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 오늘의 확언`,
        `✨ ${userName}님을 위한 ${dayOfWeek || '오늘'}의 메시지`,
        keyword ? `💫 "${keyword}" 꿈과 함께하는 오늘의 확언` : `💫 ${userName}님, 새로운 하루를 시작하세요`,
        `🌟 ${userName}님의 ${new Date().getHours() < 12 ? '아침' : '하루'}를 밝히는 확언`,
        `🎯 ${userName}님, 오늘은 이런 마음으로 시작해보세요`
      ],
      en: [
        `🌙 ${userName}, Your Affirmation for ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        `✨ ${userName}, Here's Your ${dayOfWeek || 'Daily'} Message`,
        keyword ? `💫 Today's Affirmation Inspired by "${keyword}"` : `💫 ${userName}, Start Your Day Right`,
        `🌟 Brighten Your ${new Date().getHours() < 12 ? 'Morning' : 'Day'}, ${userName}`,
        `🎯 ${userName}, Let This Guide Your Day`
      ]
    },
    'weekly-report': {
      ko: [
        `📊 ${userName}님의 이번 주 꿈 인사이트`,
        `🔮 ${userName}님, 한 주간의 꿈 패턴을 확인하세요`,
        `✨ 주간 꿈 분석 - ${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`,
        `🌙 ${userName}님의 꿈이 말하는 것들`,
        `💭 이번 주 ${userName}님의 무의식 여정`
      ],
      en: [
        `📊 ${userName}'s Weekly Dream Insights`,
        `🔮 ${userName}, Your Dream Patterns This Week`,
        `✨ Weekly Analysis - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
        `🌙 What Your Dreams Are Telling You, ${userName}`,
        `💭 Your Subconscious Journey This Week`
      ]
    },
    'retention-nudge': {
      ko: [
        `🌙 ${userName}님, 오랜만이에요!`,
        `✨ ${userName}님의 꿈 일기가 기다리고 있어요`,
        `💫 다시 만나서 반가워요, ${userName}님`,
        `🎯 ${userName}님, 오늘 꿈 이야기를 들려주세요`,
        `🌟 ${userName}님이 그리워요`
      ],
      en: [
        `🌙 ${userName}, We Miss You!`,
        `✨ Your Inner Journal is Waiting, ${userName}`,
        `💫 Welcome Back, ${userName}`,
        `🎯 ${userName}, Share Your Dreams Today`,
        `🌟 It's Been a While, ${userName}`
      ]
    }
  };

  const options = subjects[type][language];
  return options[Math.floor(Math.random() * options.length)];
}

// Generate unsubscribe link
export function getUnsubscribeLink(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://novakitz.com';
  return `${baseUrl}/unsubscribe`;
}

// Generate unsubscribe footer HTML (for email templates)
export function getUnsubscribeFooter(language: 'ko' | 'en'): string {
  const unsubscribeLink = getUnsubscribeLink();

  const footerText = {
    ko: {
      unsubscribe: '이메일 수신 설정',
      address: 'NovaKitz - 꿈을 통한 자기 발견의 여정'
    },
    en: {
      unsubscribe: 'Manage Email Preferences',
      address: 'NovaKitz - Your Journey of Self-Discovery Through Dreams'
    }
  };

  const t = footerText[language];

  return `
    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 0.875rem;">
      <p style="margin: 0.5rem 0;">${t.address}</p>
      <p style="margin: 0.5rem 0;">
        <a href="${unsubscribeLink}" style="color: #7FB069; text-decoration: underline;">
          ${t.unsubscribe}
        </a>
      </p>
    </div>
  `;
}
