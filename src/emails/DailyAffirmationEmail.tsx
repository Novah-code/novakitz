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
} from '@react-email/components';
import * as React from 'react';

interface DailyAffirmationEmailProps {
  userName: string;
  archetype: string;
  archetypeName: string;
  affirmation: string;
  dreamKeyword?: string;
  language: 'ko' | 'en';
}

export const DailyAffirmationEmail = ({
  userName,
  archetype,
  archetypeName,
  affirmation,
  dreamKeyword,
  language = 'ko',
}: DailyAffirmationEmailProps) => {
  const t = {
    ko: {
      preview: `${userName}님, 오늘의 확언이 도착했습니다`,
      greeting: `좋은 아침입니다, ${userName}님`,
      title: '🌙 오늘의 확언',
      subtitle: `당신의 유형인 ${archetypeName}에게 필요한 오늘의 메시지`,
      dreamContext: dreamKeyword ? `어제 기록하신 '${dreamKeyword}' 꿈과 연결된 확언입니다.` : '오늘 하루를 시작하는 당신을 위한 확언입니다.',
      instruction: '이 문장을 3번 외치고 하루를 시작해 보세요.',
      cta: '오늘의 꿈 기록하러 가기',
      footer: '당신의 무의식을 탐험하는 여정, NovaKitz와 함께',
      unsubscribe: '수신거부',
    },
    en: {
      preview: `${userName}, your daily affirmation has arrived`,
      greeting: `Good morning, ${userName}`,
      title: '🌙 Today\'s Affirmation',
      subtitle: `Today's message for your ${archetypeName} archetype`,
      dreamContext: dreamKeyword ? `An affirmation connected to your '${dreamKeyword}' dream from yesterday.` : 'An affirmation to start your day.',
      instruction: 'Repeat this affirmation 3 times to begin your day.',
      cta: 'Record Today\'s Dream',
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

            <Section style={affirmationBox}>
              <Text style={affirmationText}>"{affirmation}"</Text>
            </Section>

            <Text style={context}>{text.dreamContext}</Text>

            <Text style={instruction}>{text.instruction}</Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link
                style={button}
                href="https://novakitz.com/journal"
              >
                {text.cta}
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
  marginBottom: '16px',
};

const subtitle = {
  fontSize: '14px',
  color: '#7FB069',
  marginBottom: '24px',
  fontWeight: '600',
};

const affirmationBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #7FB069',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
};

const affirmationText = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#1f2937',
  fontWeight: '600',
  fontStyle: 'italic',
  margin: '0',
};

const context = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6b7280',
  marginBottom: '16px',
};

const instruction = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#4b5563',
  marginBottom: '32px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#7FB069',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
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

export default DailyAffirmationEmail;
