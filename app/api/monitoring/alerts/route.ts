import { NextRequest, NextResponse } from 'next/server';

interface AlertPayload {
  type: 'high_error_rate' | 'api_overload' | 'response_time' | 'custom';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  timestamp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const alert: AlertPayload = await request.json();
    
    // 타임스탬프 추가
    if (!alert.timestamp) {
      alert.timestamp = Date.now();
    }

    // 콘솔에 알림 기록
    console.warn(`🚨 [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`, alert.data);

    // 실제 운영 환경에서는 여기에 다양한 알림 채널 추가
    await sendNotifications(alert);

    return NextResponse.json({ 
      success: true, 
      message: 'Alert processed successfully' 
    });
  } catch (error) {
    console.error('Failed to process alert:', error);
    return NextResponse.json({ 
      error: 'Failed to process alert' 
    }, { status: 500 });
  }
}

async function sendNotifications(alert: AlertPayload) {
  const notifications: Promise<any>[] = [];

  // 1. 슬랙 알림 (환경변수 설정 시)
  if (process.env.SLACK_WEBHOOK_URL && alert.severity !== 'low') {
    notifications.push(sendSlackAlert(alert));
  }

  // 2. 디스코드 알림 (환경변수 설정 시)
  if (process.env.DISCORD_WEBHOOK_URL && alert.severity === 'critical') {
    notifications.push(sendDiscordAlert(alert));
  }

  // 3. 이메일 알림 (중요한 알림만)
  if (process.env.EMAIL_SERVICE_API_KEY && (alert.severity === 'high' || alert.severity === 'critical')) {
    notifications.push(sendEmailAlert(alert));
  }

  // 4. 로그 파일 기록
  notifications.push(logAlert(alert));

  try {
    await Promise.allSettled(notifications);
  } catch (error) {
    console.error('Some notifications failed:', error);
  }
}

async function sendSlackAlert(alert: AlertPayload) {
  try {
    const color = {
      low: '#36a64f',      // 초록
      medium: '#ff9500',   // 주황
      high: '#ff0000',     // 빨강
      critical: '#8B0000'  // 진한 빨강
    }[alert.severity];

    const payload = {
      text: `🚨 API Alert: ${alert.type}`,
      attachments: [
        {
          color,
          title: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp!).toLocaleString(),
              short: true
            }
          ],
          text: alert.data ? `\`\`\`${JSON.stringify(alert.data, null, 2)}\`\`\`` : undefined
        }
      ]
    };

    const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

async function sendDiscordAlert(alert: AlertPayload) {
  try {
    const payload = {
      content: `🚨 **Critical Alert**: ${alert.message}`,
      embeds: [
        {
          title: alert.type,
          description: alert.message,
          color: 16711680, // 빨간색
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true
            },
            {
              name: 'Time',
              value: new Date(alert.timestamp!).toLocaleString(),
              inline: true
            }
          ],
          timestamp: new Date(alert.timestamp!).toISOString()
        }
      ]
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Discord notification failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Discord notification error:', error);
  }
}

async function sendEmailAlert(alert: AlertPayload) {
  try {
    // Gmail SMTP 또는 SendGrid 사용
    if (process.env.GMAIL_APP_PASSWORD && process.env.ADMIN_EMAIL) {
      await sendGmailAlert(alert);
    } else if (process.env.SENDGRID_API_KEY && process.env.ADMIN_EMAIL) {
      await sendSendGridAlert(alert);
    } else {
      console.log('Email alert would be sent to:', process.env.ADMIN_EMAIL || 'admin@yoursite.com', alert);
    }
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

// Gmail SMTP를 사용한 이메일 발송
async function sendGmailAlert(alert: AlertPayload) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `🚨 [${alert.severity.toUpperCase()}] API Alert: ${alert.type}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #d32f2f;">🚨 API 모니터링 알림</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${alert.message}</h3>
          <p><strong>심각도:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>유형:</strong> ${alert.type}</p>
          <p><strong>발생 시간:</strong> ${new Date(alert.timestamp!).toLocaleString('ko-KR')}</p>
        </div>
        
        ${alert.data ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>상세 정보:</h4>
            <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.data, null, 2)}
            </pre>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            이 알림은 Nova Dream API 모니터링 시스템에서 자동으로 발송되었습니다.<br>
            문제가 지속되면 즉시 개발팀에 연락하세요.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// SendGrid를 사용한 이메일 발송
async function sendSendGridAlert(alert: AlertPayload) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: process.env.ADMIN_EMAIL }],
          subject: `🚨 [${alert.severity.toUpperCase()}] API Alert: ${alert.type}`
        }
      ],
      from: { email: process.env.FROM_EMAIL || 'noreply@yoursite.com' },
      content: [
        {
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #d32f2f;">🚨 API 모니터링 알림</h2>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>${alert.message}</h3>
                <p><strong>심각도:</strong> ${alert.severity.toUpperCase()}</p>
                <p><strong>유형:</strong> ${alert.type}</p>
                <p><strong>발생 시간:</strong> ${new Date(alert.timestamp!).toLocaleString('ko-KR')}</p>
              </div>
              
              ${alert.data ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4>상세 정보:</h4>
                  <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alert.data, null, 2)}
                  </pre>
                </div>
              ` : ''}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">
                  이 알림은 Nova Dream API 모니터링 시스템에서 자동으로 발송되었습니다.<br>
                  문제가 지속되면 즉시 개발팀에 연락하세요.
                </p>
              </div>
            </div>
          `
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid API failed: ${response.statusText}`);
  }
}

async function logAlert(alert: AlertPayload) {
  // 파일이나 데이터베이스에 알림 기록
  const logEntry = {
    ...alert,
    timestamp: new Date(alert.timestamp!).toISOString()
  };
  
  console.log('[ALERT LOG]', JSON.stringify(logEntry));
}