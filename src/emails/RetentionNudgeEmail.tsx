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

interface RetentionNudgeEmailProps {
  userName: string;
  daysInactive: number;
  language: 'ko' | 'en';
}

export const RetentionNudgeEmail = ({
  userName,
  daysInactive,
  language = 'ko',
}: RetentionNudgeEmailProps) => {
  const t = {
    ko: {
      preview: `${userName}님의 꿈이 기다리고 있어요`,
      greeting: `${userName}님, 안녕하세요`,
      title: '☁️ 혹시 꿈을 잊으셨나요?',
      subtitle: `${daysInactive}일간 꿈 기록이 없습니다`,
      message: [
        '꿈은 깨어난 후 10분이면 90%가 사라집니다.',
        '당신의 그림자(Shadow)가 할 말이 있다고 하네요.',
        '지금 들어가서 키워드라도 적어보세요.',
      ],
      tips: {
        title: '💡 꿈을 기억하는 팁',
        items: [
          '자기 전에 "오늘 꿈을 기억하겠다"고 다짐하세요',
          '일어나자마자 눈을 감고 5초간 꿈을 떠올려보세요',
          '완벽한 문장이 아니어도 괜찮아요. 단어만 적어도 됩니다',
        ],
      },
      cta: '꿈 기록하러 가기',
      footer: '당신의 무의식을 탐험하는 여정, NovaKitz와 함께',
      unsubscribe: '수신거부',
    },
    en: {
      preview: `${userName}, your dreams are waiting`,
      greeting: `Hello, ${userName}`,
      title: '☁️ Did you forget your dreams?',
      subtitle: `No dream records for ${daysInactive} days`,
      message: [
        'Dreams fade 90% within 10 minutes of waking up.',
        'Your Shadow has something to say.',
        'Come back and write down at least a few keywords.',
      ],
      tips: {
        title: '💡 Tips for Remembering Dreams',
        items: [
          'Before bed, affirm "I will remember my dreams tonight"',
          'Upon waking, close your eyes for 5 seconds and recall',
          'Don\'t worry about perfect sentences. Keywords are enough',
        ],
      },
      cta: 'Record Your Dreams',
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

            {/* Message */}
            <Section style={messageBox}>
              {text.message.map((line, index) => (
                <Text key={index} style={messageText}>
                  {line}
                </Text>
              ))}
            </Section>

            {/* Tips Section */}
            <Section style={tipsContainer}>
              <Text style={tipsTitle}>{text.tips.title}</Text>
              {text.tips.items.map((tip, index) => (
                <Text key={index} style={tipItem}>
                  {index + 1}. {tip}
                </Text>
              ))}
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link
                style={button}
                href="https://novakitz.com/journal"
              >
                ✍️ {text.cta}
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
  color: '#ef4444',
  marginBottom: '24px',
  fontWeight: '600',
};

const messageBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #bfdbfe',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
};

const messageText = {
  fontSize: '15px',
  lineHeight: '26px',
  color: '#1e40af',
  marginBottom: '12px',
};

const tipsContainer = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
};

const tipsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  marginBottom: '16px',
};

const tipItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4b5563',
  marginBottom: '8px',
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

export default RetentionNudgeEmail;
