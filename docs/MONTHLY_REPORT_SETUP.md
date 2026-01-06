# Monthly Report Automation Setup

## Overview

Monthly reports are automatically generated at midnight UTC on the last day of each month for all premium users. The reports are stored in the `monthly_reports` table and display in-app showing statistics, mood distribution, keywords, and patterns from dreams recorded that month.

## Architecture

1. **Supabase Edge Function** (`supabase/functions/generate-monthly-reports/index.ts`)
   - Runs at scheduled time
   - Fetches all premium users from `user_subscriptions` table
   - For each user, calculates statistics from their monthly dreams
   - Inserts/updates reports in `monthly_reports` table

2. **Next.js API Route** (`src/app/api/generate-monthly-reports/route.ts`)
   - Backup HTTP endpoint for manual triggering
   - Can be called by external cron services (e.g., EasyCron, AWS Lambda)
   - Uses Bearer token authentication

3. **React Component** (`src/components/MonthlyDreamReport.tsx`)
   - Fetches published reports from database
   - Displays report if month is complete
   - Shows placeholder message until month-end

## Setup Instructions

### 1. Supabase Function Deployment

Deploy the Edge Function to Supabase:

```bash
supabase functions deploy generate-monthly-reports
```

### 2. Environment Variables

Set these in your Supabase project settings:

```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONTHLY_REPORT_SECRET=your_secure_token
```

### 3. Scheduling

Choose one of these approaches:

#### Option A: Supabase Scheduler (Recommended)

Use Supabase's built-in scheduler via the dashboard:

1. Go to Supabase Dashboard → Cron
2. Create a new cron job
3. Set to trigger your Edge Function at: **11:59 PM UTC on the last day of each month**
4. Use cron expression: `59 23 28-31 * * ? *` (adjusted for month length)

#### Option B: External Cron Service (EasyCron, AWS Lambda)

1. Set up external cron to call your Next.js API route:
   ```
   POST https://yourdomain.com/api/generate-monthly-reports
   Authorization: Bearer YOUR_MONTHLY_REPORT_SECRET
   ```

2. Configure to run at **11:59 PM UTC on the last day of each month**

#### Option C: Vercel Cron (if using Vercel)

In `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/generate-monthly-reports",
    "schedule": "59 23 28-31 * *"
  }]
}
```

### 4. Database Migration

Run this SQL in Supabase Console to create the `monthly_reports` table:

```sql
-- From: database/create_monthly_reports_table.sql
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year_month DATE NOT NULL,
  total_dreams INTEGER NOT NULL DEFAULT 0,
  average_mood TEXT,
  top_keywords JSONB DEFAULT '[]'::jsonb,
  mood_distribution JSONB DEFAULT '{}'::jsonb,
  patterns JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, year_month)
);

-- Enable RLS
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reports"
  ON monthly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON monthly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON monthly_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON monthly_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_monthly_reports_user_year_month
  ON monthly_reports(user_id, year_month DESC);
```

## How It Works

### Report Generation Flow

1. **Scheduled Trigger** (monthly at 23:59 UTC)
   ↓
2. **Edge Function Executes**
   - Authenticate with service role key
   - Query all users with active premium subscriptions
   ↓
3. **Per-User Processing**
   - Fetch dreams for current month (1st to last day)
   - Extract keywords from dream content
   - Calculate mood distribution
   - Generate insight patterns
   ↓
4. **Database Storage**
   - UPSERT report into `monthly_reports` table
   - Status set to 'published'
   - `published_at` timestamp recorded
   ↓
5. **In-App Display**
   - MonthlyDreamReport component fetches published report
   - Shows statistics, charts, keywords, and insights
   - Users can download as PDF

### Timeline Example

- **Dec 1-30**: Users record dreams freely
- **Dec 31, 23:59 UTC**: Scheduler triggers report generation
- **Jan 1, 00:00 UTC**: Reports available in app
- **Jan 1-31**: Users view December report, record new dreams
- **Jan 31, 23:59 UTC**: January reports generated

## Testing

### Manual Trigger via API

Test the report generation:

```bash
curl -X POST https://yourdomain.com/api/generate-monthly-reports \
  -H "Authorization: Bearer YOUR_MONTHLY_REPORT_SECRET" \
  -H "Content-Type: application/json"
```

### Direct Edge Function Test

In Supabase Dashboard, invoke the function directly:

```bash
supabase functions invoke generate-monthly-reports --project-id YOUR_PROJECT_ID
```

### Database Verification

Check if reports were generated:

```sql
SELECT user_id, month, total_dreams, status, published_at
FROM monthly_reports
ORDER BY published_at DESC
LIMIT 10;
```

## Troubleshooting

### Reports Not Generated

1. Check environment variables are set in Supabase
2. Verify premium users exist in `user_subscriptions` table with `status='active'`
3. Check Edge Function logs in Supabase Dashboard
4. Ensure `monthly_reports` table has RLS policies allowing function to insert

### Wrong Timing

- Supabase scheduler runs on UTC time
- Adjust cron expression if your users are in different timezones
- Consider running at 23:59 UTC to catch most timezones before their midnight

### No Dreams for User

- If a user has 0 dreams that month, no report is generated (expected behavior)
- You can modify to generate empty reports if needed

## Monitoring

Add monitoring to your Edge Function logs:

```bash
# Stream logs from the function
supabase functions list
supabase functions logs generate-monthly-reports --project-id YOUR_PROJECT_ID
```

## Future Enhancements

- [ ] User timezone support (generate at user's local midnight)
- [ ] Email notification when report is published
- [ ] Archive old reports functionality
- [ ] Report comparison (previous months)
- [ ] Custom report generation date per user
- [ ] Dream export alongside monthly report
