import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export async function POST(request: NextRequest) {
  try {
    const { messages, language, userEmail } = await request.json();

    const conversationText = (messages as { role: string; content: string }[])
      .map(m => `[${m.role === 'user' ? 'User' : 'Bot'}] ${m.content}`)
      .join('\n');

    // Save to DB (fire and forget — don't fail if table doesn't exist yet)
    supabaseAdmin
      .from('contact_requests')
      .insert({ language, conversation: conversationText, user_email: userEmail || null, status: 'new' })
      .then(({ error }) => { if (error) console.warn('contact_requests insert:', error.message); });

    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ success: true }); // still ok, just no email
    }

    const conversationHtml = (messages as { role: string; content: string }[])
      .map(m => `
        <div style="margin-bottom:12px;display:flex;justify-content:${m.role === 'user' ? 'flex-end' : 'flex-start'}">
          <div style="max-width:80%;padding:10px 14px;border-radius:12px;background:${m.role === 'user' ? '#7fb069' : '#f3f4f6'};color:${m.role === 'user' ? 'white' : '#1f2937'};font-size:14px;line-height:1.5;">
            <strong>${m.role === 'user' ? 'User' : 'Bot'}:</strong> ${m.content}
          </div>
        </div>
      `)
      .join('');

    const subject = language === 'ko'
      ? '[Novakitz] 상담사 연결 요청'
      : '[Novakitz] Support Contact Request';

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@novakitz.com',
      to: adminEmail,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
          <div style="background:linear-gradient(135deg,#7fb069,#5a9a47);padding:24px;border-radius:12px 12px 0 0;">
            <h2 style="color:white;margin:0;font-size:20px;">
              ${language === 'ko' ? '상담사 연결 요청' : 'Support Contact Request'}
            </h2>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
              ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)
            </p>
          </div>
          <div style="padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            ${userEmail ? `<p style="margin:0 0 16px;font-size:14px;"><strong>${language === 'ko' ? '회신 이메일' : 'Reply to'}:</strong> <a href="mailto:${userEmail}" style="color:#7fb069;">${userEmail}</a></p>` : ''}
            <h3 style="color:#374151;font-size:15px;margin-top:0;">
              ${language === 'ko' ? '대화 내용' : 'Conversation History'}
            </h3>
            <div style="background:#f9fafb;border-radius:8px;padding:16px;">
              ${conversationHtml}
            </div>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">Novakitz Support System</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact support error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
