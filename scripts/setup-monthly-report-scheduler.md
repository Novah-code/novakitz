# Monthly Report Scheduler Setup

## Quick Start

Choose one option to schedule monthly report generation:

---

## Option 1: EasyCron (Recommended - Free tier available)

### Step 1: Create EasyCron Account
1. Go to https://www.easycron.com
2. Sign up (free tier available)
3. Log in to dashboard

### Step 2: Create New Cron Job
1. Click "Crontab" → "Add New Cron Job"
2. Configure:
   - **Cron Job URL**: `https://yourdomain.com/api/generate-monthly-reports`
   - **HTTP Method**: POST
   - **HTTP Headers**: Add header
     - Name: `Authorization`
     - Value: `Bearer YOUR_MONTHLY_REPORT_SECRET`
   - **Cron Expression**: `0 23 L * *` (11 PM UTC on last day of month)
     - Or use: `59 23 28-31 * *` (11:59 PM UTC, days 28-31)
   - **Timezone**: UTC

### Step 3: Test
1. Click "Run Manually" to verify it works
2. Check your app logs/database to confirm report was generated

---

## Option 2: Supabase Scheduler (For deployed projects)

### Step 1: Enable Cron Extension
1. Go to Supabase Dashboard
2. Navigate to "Database" → "Extensions"
3. Search for "pg_cron" and enable it

### Step 2: Create Scheduled Function
In Supabase SQL Editor, run:

```sql
-- Create a function to call your API
CREATE OR REPLACE FUNCTION public.trigger_monthly_reports()
RETURNS void AS $$
BEGIN
  PERFORM
    net.http_post(
      'https://yourdomain.com/api/generate-monthly-reports',
      '{}',
      '{"Authorization": "Bearer YOUR_MONTHLY_REPORT_SECRET", "Content-Type": "application/json"}',
      3000
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule to run at 11:59 PM UTC on last day of month
-- This cron expression: minute, hour, day of month, month, day of week
SELECT cron.schedule(
  'monthly-reports-trigger',
  '59 23 * * *',  -- Daily at 23:59 UTC (we'll filter in function)
  'SELECT public.trigger_monthly_reports();'
);
```

**Note**: You may need to adjust the cron expression based on month length

### Step 3: Verify
In Supabase SQL Editor:
```sql
SELECT * FROM cron.job;
```

---

## Option 3: GitHub Actions (For free public projects)

### Step 1: Create Workflow File
Create `.github/workflows/monthly-reports.yml`:

```yaml
name: Generate Monthly Reports

on:
  schedule:
    # Run at 11:59 PM UTC on the 28th of every month
    # (covers all month lengths since shortest is 28 days)
    - cron: '59 23 28 * *'

jobs:
  generate-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger monthly report generation
        run: |
          curl -X POST https://yourdomain.com/api/generate-monthly-reports \
            -H "Authorization: Bearer ${{ secrets.MONTHLY_REPORT_SECRET }}" \
            -H "Content-Type: application/json"
```

### Step 2: Add Secret
1. Go to GitHub repo → Settings → Secrets
2. Add `MONTHLY_REPORT_SECRET` with your token

### Step 3: Verify
Reports will run at scheduled time automatically

---

## Option 4: AWS Lambda + EventBridge (For AWS projects)

### Step 1: Create Lambda Function
1. Go to AWS Lambda console
2. Create new function (Node.js 18.x)
3. Paste this code:

```javascript
const https = require('https');

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({});
    const options = {
      hostname: 'yourdomain.com',
      path: '/api/generate-monthly-reports',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MONTHLY_REPORT_SECRET}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      resolve({ statusCode: res.statusCode });
    });

    req.on('error', (error) => {
      console.error(error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};
```

### Step 2: Add Environment Variable
1. In Lambda function → Configuration → Environment variables
2. Add: `MONTHLY_REPORT_SECRET` = `YOUR_TOKEN`

### Step 3: Create EventBridge Rule
1. Go to EventBridge → Rules → Create rule
2. Configure:
   - **Name**: `monthly-reports-trigger`
   - **Schedule**: `cron(59 23 L * ? *)` (11:59 PM UTC last day)
3. **Target**: Lambda function you created

---

## Verification Checklist

- [ ] API endpoint `/api/generate-monthly-reports` is deployed
- [ ] Environment variable `MONTHLY_REPORT_SECRET` is set in app
- [ ] `monthly_reports` database table exists with RLS policies
- [ ] Scheduler is configured and tested
- [ ] Logs show successful report generation

## Testing

### Manual Test (Before Setting Scheduler)
```bash
curl -X POST https://yourdomain.com/api/generate-monthly-reports \
  -H "Authorization: Bearer YOUR_MONTHLY_REPORT_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "Monthly reports generated",
  "generatedReports": 5,
  "totalUsers": 10,
  "errors": []
}
```

### Database Check
```sql
SELECT user_id, month, total_dreams, status, published_at
FROM monthly_reports
ORDER BY published_at DESC
LIMIT 5;
```

---

## Troubleshooting

**Reports not generating?**
- Check API endpoint is accessible
- Verify Bearer token is correct
- Check database logs for errors
- Ensure premium users exist in system

**Reports generating at wrong time?**
- Verify timezone is UTC
- Check cron expression syntax
- For Supabase, you may need `pg_cron` extension enabled

**Service returning 401 Unauthorized?**
- Verify `MONTHLY_REPORT_SECRET` matches in scheduler and environment
- Check Authorization header format: `Bearer TOKEN`

---

## Environment Variables Needed

Set these in your deployment environment:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONTHLY_REPORT_SECRET=your_custom_secret_token
```

The secret token should be a strong random string, e.g.:
```bash
openssl rand -hex 32
```
