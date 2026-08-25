import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Link,
  Section,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface WeeklyReportTeaserEmailProps {
  userName: string;
  dreamCount: number;
  topKeyword: string;
  keywordCount: number;
  language: 'ko' | 'en';
}

export const WeeklyReportTeaserEmail = ({
  userName,
  dreamCount,
  topKeyword,
  keywordCount,
  language = 'ko',
}: WeeklyReportTeaserEmailProps) => {
  const t = {
    ko: {
      preview: `이번 주 ${userName}님의 무의식 패턴 분석 완료`,
      greeting: `${userName}님`,
      title: '📊 주간 꿈 패턴 분석',
      subtitle: '지난 7일간의 꿈 데이터를 분석했습니다',
      dreamCountLabel: '이번 주 기록된 꿈',
      topKeywordLabel: '가장 많이 나온 키워드',
      insight: `이번 주 당신은 '${topKeyword}' 관련 꿈을 ${keywordCount}번 꾸었습니다.`,
      teaser: '이것이 의미하는 심리 상태는...',
      locked: '🔒 Pro 전용',
      upgradeMessage: '전체 분석을 보려면 Pro로 업그레이드하세요',
      benefits: [
        '매일 받는 AI 꿈 해석',
        '월간 패턴 리포트',
        '전체 히스토리 보관',
        '융 아키타입 분석',
      ],
      cta: 'Pro 알아보기',
      footer: '당신의 무의식을 탐험하는 여정, NovaKitz와 함께',
      unsubscribe: '수신거부',
    },
    en: {
      preview: `${userName}'s unconscious pattern analysis complete`,
      greeting: `${userName}`,
      title: '📊 Weekly Dream Pattern Analysis',
      subtitle: 'We analyzed your dreams from the past 7 days',
      dreamCountLabel: 'Dreams recorded this week',
      topKeywordLabel: 'Most frequent keyword',
      insight: `This week you had ${keywordCount} dreams about '${topKeyword}'.`,
      teaser: 'What this reveals about your psychological state is...',
      locked: '🔒 Pro Only',
      upgradeMessage: 'Upgrade to Pro to view the full analysis',
      benefits: [
        'A daily AI dream interpretation',
        'Monthly pattern reports',
        'Full dream history',
        'Jungian archetype analysis',
      ],
      cta: 'Learn About Pro',
      footer: 'Your journey of exploring the unconscious with NovaKitz',
      unsubscribe: 'Unsubscribe',
    },
  };

  const text = t[language];

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={title}>☀️ NovaKitz</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>{text.greeting}</Text>

            <Heading style={mainHeading}>{text.title}</Heading>

            <Text style={subtitle}>{text.subtitle}</Text>

            {/* Stats */}
            <Section style={statsContainer}>
              <Section style={statBox}>
                <Text style={statNumber}>{dreamCount}</Text>
                <Text style={statLabel}>{text.dreamCountLabel}</Text>
              </Section>
              <Section style={statBox}>
                <Text style={statNumber}>{topKeyword}</Text>
                <Text style={statLabel}>{text.topKeywordLabel}</Text>
              </Section>
            </Section>

            {/* Insight Teaser */}
            <Section style={insightBox}>
              <Text style={insightText}>{text.insight}</Text>
              <Text style={teaserText}>{text.teaser}</Text>
            </Section>

            {/* Locked Content Blur Effect (visual representation) */}
            <Section style={lockedBox}>
              <Text style={lockedText}>{text.locked}</Text>
            </Section>

            {/* Upgrade Message */}
            <Text style={upgradeText}>{text.upgradeMessage}</Text>

            {/* Benefits */}
            <Section style={benefitsContainer}>
              {text.benefits.map((benefit, index) => (
                <Text key={index} style={benefitItem}>
                  ✨ {benefit}
                </Text>
              ))}
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link
                style={button}
                href="https://novakitz.com/pricing"
              >
                💎 {text.cta}
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>{text.footer}</Text>
            <Link style={unsubscribeLink} href="https://novakitz.com/unsubscribe">
              {text.unsubscribe}
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
};

const title = {
  margin: '0',
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
};

const content = {
  padding: '0 40px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#6b7280',
  marginTop: '32px',
};

const mainHeading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1f2937',
  marginTop: '8px',
  marginBottom: '8px',
};

const subtitle = {
  fontSize: '14px',
  color: '#6b7280',
  marginBottom: '32px',
};

const statsContainer = {
  display: 'flex',
  justifyContent: 'space-around',
  marginBottom: '32px',
};

const statBox = {
  textAlign: 'center' as const,
  flex: '1',
};

const statNumber = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#7FB069',
  margin: '0',
  marginBottom: '8px',
};

const statLabel = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
};

const insightBox = {
  backgroundColor: '#fff7ed',
  border: '2px solid #fed7aa',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};

const insightText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#9a3412',
  marginBottom: '8px',
  fontWeight: '500',
};

const teaserText = {
  fontSize: '14px',
  color: '#7c2d12',
  fontStyle: 'italic',
  margin: '0',
};

const lockedBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '48px 24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  opacity: 0.6,
};

const lockedText = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#6b7280',
  margin: '0',
};

const upgradeText = {
  fontSize: '16px',
  color: '#1f2937',
  textAlign: 'center' as const,
  fontWeight: '600',
  marginBottom: '24px',
};

const benefitsContainer = {
  marginBottom: '32px',
};

const benefitItem = {
  fontSize: '14px',
  lineHeight: '28px',
  color: '#4b5563',
  margin: '4px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 4px 12px rgba(127, 176, 105, 0.3)',
};

const footer = {
  padding: '0 40px',
  marginTop: '40px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#9ca3af',
  textAlign: 'center' as const,
  marginBottom: '8px',
};

const unsubscribeLink = {
  fontSize: '12px',
  color: '#9ca3af',
  textDecoration: 'underline',
  display: 'block',
  textAlign: 'center' as const,
};

export default WeeklyReportTeaserEmail;
