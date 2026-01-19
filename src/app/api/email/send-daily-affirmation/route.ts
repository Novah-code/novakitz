import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';
import { DailyAffirmationEmail } from '@/emails/DailyAffirmationEmail';
import { generateDynamicSubject } from '@/lib/emailUtils';

const resend = new Resend(process.env.RESEND_API_KEY);

// Affirmation templates by archetype
const affirmations = {
  ko: {
    hero: [
      '나는 오늘 용기를 내어 새로운 도전을 시작합니다',
      '나의 강인함은 어떤 장애물도 극복할 수 있습니다',
      '나는 두려움을 마주하고 성장합니다'
    ],
    caregiver: [
      '나는 먼저 나 자신을 돌봄으로써 다른 이들도 돌볼 수 있습니다',
      '나의 따뜻함과 공감은 세상을 변화시킵니다',
      '나는 건강한 경계를 설정할 권리가 있습니다'
    ],
    explorer: [
      '나는 미지의 것을 탐험하며 나 자신을 발견합니다',
      '나의 호기심은 새로운 가능성의 문을 엽니다',
      '나는 자유롭게 나의 길을 걸어갑니다'
    ],
    rebel: [
      '나는 진정한 나의 모습으로 세상에 선언합니다',
      '나의 독특함은 강점이며 변화의 촉매입니다',
      '나는 불필요한 규칙을 깨고 새로운 길을 만듭니다'
    ],
    magician: [
      '나는 비전을 현실로 만드는 힘을 가지고 있습니다',
      '나의 상상력은 무한한 가능성을 창조합니다',
      '나는 변화의 마법사이며 꿈을 실현합니다'
    ],
    lover: [
      '나는 사랑받을 자격이 있으며 사랑을 줄 수 있습니다',
      '나의 열정은 삶에 아름다움을 더합니다',
      '나는 진정한 연결을 통해 성장합니다'
    ],
    jester: [
      '나는 유머와 즐거움으로 어둠을 밝힙니다',
      '나의 가벼움은 무거운 짐을 가볍게 만듭니다',
      '나는 삶의 순간순간을 즐깁니다'
    ],
    sage: [
      '나는 지혜를 통해 진실을 발견합니다',
      '나의 통찰력은 세상을 이해하는 열쇠입니다',
      '나는 배움을 통해 끊임없이 성장합니다'
    ],
    innocent: [
      '나는 순수한 마음으로 행복을 발견합니다',
      '나의 긍정적인 시각은 기적을 만듭니다',
      '나는 신뢰와 희망으로 세상을 봅니다'
    ],
    ruler: [
      '나는 책임감 있게 나의 삶을 이끌어갑니다',
      '나의 리더십은 안정과 번영을 만듭니다',
      '나는 현명한 결정으로 미래를 만듭니다'
    ],
    creator: [
      '나는 창조를 통해 나의 본질을 표현합니다',
      '나의 독창성은 세상에 새로운 가치를 더합니다',
      '나는 상상한 것을 현실로 만드는 창조자입니다'
    ],
    everyman: [
      '나는 있는 그대로의 나로 충분합니다',
      '나의 진정성은 다른 이들과 깊이 연결됩니다',
      '나는 평범함 속에서 특별함을 발견합니다'
    ]
  },
  en: {
    hero: [
      'I courageously embrace new challenges today',
      'My strength can overcome any obstacle',
      'I face my fears and grow stronger'
    ],
    caregiver: [
      'I care for myself first so I can care for others',
      'My warmth and empathy transform the world',
      'I have the right to set healthy boundaries'
    ],
    explorer: [
      'I discover myself by exploring the unknown',
      'My curiosity opens doors to new possibilities',
      'I freely walk my own path'
    ],
    rebel: [
      'I boldly show my authentic self to the world',
      'My uniqueness is my strength and catalyst for change',
      'I break unnecessary rules and create new paths'
    ],
    magician: [
      'I have the power to turn visions into reality',
      'My imagination creates infinite possibilities',
      'I am a magician of transformation who manifests dreams'
    ],
    lover: [
      'I deserve love and I have love to give',
      'My passion adds beauty to life',
      'I grow through genuine connection'
    ],
    jester: [
      'I brighten darkness with humor and joy',
      'My lightness makes heavy burdens lighter',
      'I enjoy every moment of life'
    ],
    sage: [
      'I discover truth through wisdom',
      'My insight is the key to understanding the world',
      'I constantly grow through learning'
    ],
    innocent: [
      'I find happiness with a pure heart',
      'My positive outlook creates miracles',
      'I see the world with trust and hope'
    ],
    ruler: [
      'I responsibly lead my life',
      'My leadership creates stability and prosperity',
      'I create the future with wise decisions'
    ],
    creator: [
      'I express my essence through creation',
      'My originality adds new value to the world',
      'I am a creator who turns imagination into reality'
    ],
    everyman: [
      'I am enough just as I am',
      'My authenticity connects deeply with others',
      'I find the extraordinary in the ordinary'
    ]
  }
};

export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users who have daily affirmation emails enabled
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, preferred_language, archetype_result')
      .eq('email_daily_affirmations', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users to send emails to' }, { status: 200 });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send emails to each user
    for (const user of users) {
      try {
        // Get user's archetype (default to 'everyman' if not set)
        const archetype = user.archetype_result?.primary_archetype || 'everyman';
        const language = (user.preferred_language || 'ko') as 'ko' | 'en';

        // Get archetype name
        const archetypeNames: Record<string, { ko: string; en: string }> = {
          hero: { ko: '영웅', en: 'Hero' },
          caregiver: { ko: '양육자', en: 'Caregiver' },
          explorer: { ko: '탐험가', en: 'Explorer' },
          rebel: { ko: '반항자', en: 'Rebel' },
          magician: { ko: '마법사', en: 'Magician' },
          lover: { ko: '연인', en: 'Lover' },
          jester: { ko: '광대', en: 'Jester' },
          sage: { ko: '현자', en: 'Sage' },
          innocent: { ko: '순수한 자', en: 'Innocent' },
          ruler: { ko: '통치자', en: 'Ruler' },
          creator: { ko: '창조자', en: 'Creator' },
          everyman: { ko: '보통 사람', en: 'Everyman' }
        };

        const archetypeName = archetypeNames[archetype]?.[language] || archetypeNames.everyman[language];

        // Get yesterday's dream keyword (if exists)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const { data: recentDream } = await supabase
          .from('dreams')
          .select('keywords')
          .eq('user_id', user.id)
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const dreamKeyword = recentDream?.keywords?.[0];

        // Select random affirmation for this archetype
        const archetypeAffirmations = affirmations[language][archetype as keyof typeof affirmations.ko] || affirmations[language].everyman;
        const randomAffirmation = archetypeAffirmations[Math.floor(Math.random() * archetypeAffirmations.length)];

        // Generate dynamic subject line to avoid spam filters
        const dayOfWeek = new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'long' });
        const dynamicSubject = generateDynamicSubject('daily-affirmation', language, {
          userName: user.name,
          dayOfWeek,
          keyword: dreamKeyword
        });

        // Send email using Resend
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'NovaKitz <noreply@novakitz.com>',
          to: user.email,
          subject: dynamicSubject,
          react: DailyAffirmationEmail({
            userName: user.name,
            archetype,
            archetypeName,
            affirmation: randomAffirmation,
            dreamKeyword,
            language
          })
        });

        results.sent++;
        console.log(`✅ Sent daily affirmation to ${user.email}`);
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to send to ${user.email}: ${error}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return NextResponse.json({
      message: 'Daily affirmation emails sent',
      results
    }, { status: 200 });

  } catch (error) {
    console.error('Error in send-daily-affirmation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
