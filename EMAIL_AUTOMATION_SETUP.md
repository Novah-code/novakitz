# Email Automation Setup Guide

This guide walks you through setting up automated email campaigns for NovaKitz using Resend.

## Overview

NovaKitz sends three types of automated emails to engage users:

1. **Daily Morning Affirmation** (7 AM daily)
   - Personalized to user's Jungian archetype
   - Connects to yesterday's dream keywords if available
   - Encourages daily dream journaling habit

2. **Weekly Dream Report Teaser** (6 PM Sundays)
   - Shows weekly stats (dream count, top keyword)
   - Teases insights then locks full analysis
   - Only sent to free users to drive premium conversion

3. **Retention Nudge** (10 AM daily)
   - Sent to users inactive for 3-14 days
   - Provides tips for remembering dreams
   - Brings users back to the app

## Prerequisites

- NovaKitz app deployed on Vercel
- Resend account (3,000 free emails/month)
- Verified domain for sending emails

## Step 1: Set Up Resend Account

### 1.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 1.2 Verify Your Domain

**Important:** You must verify your domain to send emails from `noreply@novakitz.com`

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter `novakitz.com`
4. Resend will provide DNS records (SPF, DKIM, DMARC)
5. Add these DNS records to your domain registrar:
   - Go to your domain provider (e.g., Namecheap, GoDaddy, Cloudflare)
   - Add the TXT records provided by Resend
   - Wait 15-30 minutes for DNS propagation
6. Click **Verify** in Resend dashboard

**Example DNS records you'll need to add:**
```
Type: TXT
Name: resend._domainkey.novakitz.com
Value: [provided by Resend]

Type: TXT
Name: novakitz.com
Value: v=spf1 include:resend.com ~all
```

### 1.3 Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "NovaKitz Production"
4. Select **Full Access** permissions
5. Copy the API key (starts with `re_`)

**Security Note:** Never commit your API key to Git. It's already in `.env.local` which is gitignored.

## Step 2: Configure Environment Variables

### 2.1 Local Development (.env.local)

Update these values in `/Users/YOONA/novakitz-main/.env.local`:

```bash
# Resend Email API
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=noreply@novakitz.com

# Cron Job Secret (generate a random 32+ character string)
CRON_SECRET=your_secure_random_secret_here
```

To generate a secure CRON_SECRET, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 Vercel Production Environment

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add these variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `RESEND_API_KEY` | `re_your_actual_api_key` | Production |
| `RESEND_FROM_EMAIL` | `noreply@novakitz.com` | Production |
| `CRON_SECRET` | Your generated secret | Production |

3. Click **Save**
4. Redeploy your app for changes to take effect

## Step 3: Update Database Schema

Run the database migration to add email preferences:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[password]@db.wylrihmhfmgisgixnlrd.supabase.co:5432/postgres"

# Or run in Supabase SQL Editor
```

Then execute:
```sql
-- Copy contents from database/add_email_notifications.sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.users.email_notifications IS 'Whether user has opted in to receive automated emails';

UPDATE public.users
SET email_notifications = true
WHERE email_notifications IS NULL;
```

## Step 4: Deploy to Vercel

The cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/email/send-daily-affirmation",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/email/send-weekly-teaser",
      "schedule": "0 18 * * 0"
    },
    {
      "path": "/api/email/send-retention-nudge",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Schedule Explanation (UTC timezone):**
- `0 7 * * *` = 7:00 AM UTC daily (daily affirmation)
- `0 18 * * 0` = 6:00 PM UTC on Sundays (weekly teaser)
- `0 10 * * *` = 10:00 AM UTC daily (retention nudge)

**Note:** Adjust times based on your target audience timezone. Korean users (UTC+9) would receive:
- Daily affirmation: 4:00 PM KST
- Weekly teaser: 3:00 AM Monday KST
- Retention nudge: 7:00 PM KST

To adjust for Korean morning delivery (7 AM KST = 10 PM UTC previous day):
```json
"schedule": "0 22 * * *"  // Daily affirmation at 7 AM KST
```

### Deploy

```bash
git add .
git commit -m "Add email automation system"
git push origin main
```

Vercel will automatically deploy and activate the cron jobs.

## Step 5: Verify Cron Jobs

### 5.1 Check Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → **Cron Jobs** tab
2. You should see 3 cron jobs listed:
   - `/api/email/send-daily-affirmation` (daily at 7:00)
   - `/api/email/send-weekly-teaser` (weekly Sun 18:00)
   - `/api/email/send-retention-nudge` (daily at 10:00)
3. Each should show status: **Enabled**

### 5.2 Manual Testing

You can manually trigger emails to test:

```bash
# Test daily affirmation
curl -X POST https://novakitz.com/api/email/send-daily-affirmation \
  -H "Authorization: Bearer your_cron_secret_here"

# Test weekly teaser
curl -X POST https://novakitz.com/api/email/send-weekly-teaser \
  -H "Authorization: Bearer your_cron_secret_here"

# Test retention nudge
curl -X POST https://novakitz.com/api/email/send-retention-nudge \
  -H "Authorization: Bearer your_cron_secret_here"
```

### 5.3 Check Logs

View email sending logs:
1. Vercel Dashboard → Your Project → **Logs**
2. Filter by function: Select the email endpoint
3. Look for:
   - ✅ `Sent daily affirmation to user@example.com`
   - ⏭️ `Skipped user@example.com - No dreams this week`
   - ❌ Any error messages

## Step 6: Monitor Email Performance

### Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Monitor:
   - **Sent**: Number of emails successfully sent
   - **Delivered**: Emails that reached inbox
   - **Opened**: Users who opened the email
   - **Clicked**: Users who clicked CTA button
   - **Bounced**: Failed deliveries
   - **Complained**: Spam complaints

### Key Metrics to Track

- **Daily Affirmation**
  - Open rate (target: >40%)
  - Click-through to journal (target: >10%)

- **Weekly Teaser**
  - Open rate (target: >35%)
  - Upgrade conversion (target: >2%)

- **Retention Nudge**
  - Open rate (target: >30%)
  - Return to app rate (target: >15%)

## Step 7: Legal Compliance

### Unsubscribe Link

All emails include an unsubscribe link at the bottom. You need to implement the unsubscribe page:

**TODO:** Create `/app/unsubscribe/page.tsx`

```tsx
// Simple unsubscribe page
export default function UnsubscribePage() {
  const handleUnsubscribe = async () => {
    // Update user.email_notifications = false
  }

  return (
    <div>
      <h1>Unsubscribe from NovaKitz Emails</h1>
      <p>We're sorry to see you go!</p>
      <button onClick={handleUnsubscribe}>Unsubscribe</button>
    </div>
  )
}
```

### Privacy Policy & Terms

Ensure your privacy policy mentions:
- What emails you send
- How users can unsubscribe
- That you use Resend as email provider
- Data is not shared with third parties

## Troubleshooting

### Emails Not Sending

**Check 1: Environment Variables**
```bash
# In Vercel dashboard, verify:
- RESEND_API_KEY is set
- RESEND_FROM_EMAIL is correct
- CRON_SECRET is set
```

**Check 2: Domain Verification**
- Go to Resend → Domains
- Ensure `novakitz.com` shows green checkmark
- If not verified, check DNS records

**Check 3: API Key Permissions**
- Resend API key must have "Full Access"
- Try creating a new API key if issues persist

**Check 4: Cron Job Authorization**
```bash
# Test if endpoint is accessible
curl https://novakitz.com/api/email/send-daily-affirmation

# Should return: { "error": "Unauthorized" }
# This is correct! Means endpoint is protected.
```

### Emails Going to Spam

**Solution 1: Warm Up Domain**
- Start by sending emails to engaged users only
- Gradually increase volume over 2 weeks
- Monitor spam complaint rate (<0.1%)

**Solution 2: Check Email Content**
- Avoid spam trigger words: "FREE", "CLICK NOW", excessive caps
- Ensure text/HTML ratio is balanced
- Include physical address (not required for transactional emails)

**Solution 3: DMARC Policy**
Add DMARC record to DNS:
```
Type: TXT
Name: _dmarc.novakitz.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@novakitz.com
```

### Users Not Receiving Emails

**Check 1: User Has Email**
```sql
SELECT id, name, email, email_notifications
FROM users
WHERE id = 'user_id_here';
```

**Check 2: Email Notifications Enabled**
```sql
UPDATE users
SET email_notifications = true
WHERE email IS NOT NULL;
```

**Check 3: Resend Logs**
- Check Resend dashboard for delivery status
- Look for bounces or spam complaints

## Email Templates

The email templates are React components in `/src/emails/`:

- `DailyAffirmationEmail.tsx` - Morning affirmations
- `WeeklyReportTeaserEmail.tsx` - Weekly stats teaser
- `RetentionNudgeEmail.tsx` - Re-engagement email

### Customizing Templates

To modify email content:

1. Edit the translation object in the email component
2. Test locally with React Email dev server:
   ```bash
   npm run email:dev
   ```
3. Preview at `http://localhost:3000`

### Adding New Email Types

1. Create new email template: `src/emails/NewEmail.tsx`
2. Create API endpoint: `src/app/api/email/send-new-email/route.ts`
3. Add cron schedule to `vercel.json`
4. Deploy to Vercel

## Cost & Limits

### Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- All features included

### Estimated Usage
- Daily affirmations: ~100 users = 3,000/month
- Weekly teasers: ~100 users = 400/month
- Retention nudges: ~20 users/day = 600/month

**Total: ~4,000 emails/month** → Upgrade to paid plan at $20/month for 50,000 emails

### Paid Plan Trigger
Upgrade when you have >100 daily active users recording dreams.

## Next Steps

1. ✅ Set up Resend account
2. ✅ Verify domain
3. ✅ Add environment variables
4. ✅ Run database migration
5. ✅ Deploy to Vercel
6. ✅ Test cron jobs manually
7. 🔲 Create unsubscribe page
8. 🔲 Monitor metrics for 1 week
9. 🔲 A/B test email subject lines
10. 🔲 Optimize send times based on open rates

## Support

- **Resend Docs**: https://resend.com/docs
- **Vercel Cron Docs**: https://vercel.com/docs/cron-jobs
- **React Email**: https://react.email/docs

---

Created: 2026-01-18
Last Updated: 2026-01-18
