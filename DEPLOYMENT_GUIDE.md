# Novakitz Premium Features - Deployment Guide

**Last Updated:** November 11, 2025
**Status:** ✅ Ready for Production

---

## Quick Start

All premium features have been implemented and tested. To deploy:

### Step 1: Execute Supabase Migration (5 minutes)

**Option A: Via Supabase Dashboard (Recommended)**

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your Novakitz project
3. Go to **SQL Editor** → **New Query**
4. Copy the entire contents of `supabase_migrations/affirmations_table.sql`
5. Paste into the SQL editor
6. Click **Run**
7. Verify success: All 8 SQL statements execute without error

**Option B: Via psql (CLI)**

```bash
# If you have Supabase CLI installed
supabase db push

# Or via psql directly
psql "postgresql://<user>:<password>@<host>/<database>" < supabase_migrations/affirmations_table.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE OR REPLACE VIEW
ALTER TABLE
CREATE POLICY (4 total)
```

### Step 2: Verify Environment Variables

Check that the following are set in your `.env.local`:

```env
# Existing (should be set)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...

# For Premium Features (should be set)
NEXT_PUBLIC_GUMROAD_MONTHLY_URL=https://novakitz.gumroad.com/l/novakitz
NEXT_PUBLIC_GUMROAD_YEARLY_URL=https://novakitz.gumroad.com/l/novakitz_year
```

### Step 3: Deploy to Production

```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build
npm run build

# If using Vercel
vercel deploy --prod

# Or your preferred deployment method
```

### Step 4: Test Features

**As Free User:**
1. Record a dream
2. Analyze it → Should be 150-200 words
3. Check-in → Should see 1 affirmation
4. View monthly report → No PDF export button
5. Check AI usage bar → Shows "1/10" after analysis

**As Premium User (Gumroad receipt):**
1. Record a dream
2. Analyze it → Should be 500+ words
3. Check-in → Should see 3 affirmations with navigation
4. View monthly report → PDF export button visible
5. No AI usage limit

---

## Feature Overview

### 1. Premium Subscription Tiers ✅

**Free User Limits:**
- 7 AI interpretations per month
- 150-200 word analysis
- 1 affirmation per check-in time
- View monthly report only
- Unlimited dream history

**Premium User Benefits:**
- Unlimited AI interpretations
- 500+ word comprehensive analysis
- 3 affirmations per check-in time
- Export monthly report as PDF
- Unlimited dream history

### 2. Affirmations System ✅

**How It Works:**
1. User records a dream
2. System tracks `lastSavedDreamId`
3. User checks in (morning/afternoon/evening)
4. AffirmationsDisplay component renders
5. Generates affirmations from dream content
6. Free users: 1 affirmation
7. Premium users: 3 affirmations with navigation

**Database:**
- Table: `affirmations`
- Columns: id, user_id, dream_id, affirmation_text, check_in_time, date, created_at, updated_at
- RLS: Enabled (users see only their own)

### 3. Monthly Report ✅

**Components:**
- Statistics: Total dreams, analyzed, mood, affirmations
- Expandable details: Dominant mood, keywords, trends, insights
- Premium-only: AI-generated monthly insights, PDF export

**Data:**
- Mood average: numeric 1-5 scale
- Top keywords: top 5 by frequency
- Emotional trends: all moods with counts
- Affirmation count: from affirmations table

### 4. Usage Tracking ✅

**Free User Progress Bar:**
- Shows remaining AI interpretations (X/10)
- Color codes: Green (>3) → Yellow (1-3) → Red (0)
- Resets monthly

**Premium User:**
- No progress bar shown
- Unlimited interpretations

---

## Detailed Feature Documentation

### Affirmations System

**Files:**
- `src/lib/affirmations.ts` - Core logic
- `src/components/AffirmationsDisplay.tsx` - UI component
- `src/components/DailyCheckin.tsx` - Integration point
- `supabase_migrations/affirmations_table.sql` - Database schema

**Key Functions:**

```typescript
// Generate affirmations from dream
generateAffirmationsFromDream(userId, dreamText, language)
→ Returns array of strings

// Save to database
saveAffirmations(userId, affirmations, checkInTime, dreamId?)
→ Returns boolean success

// Retrieve today's affirmations
getAffirmationsByTime(userId, checkInTime)
→ Returns Affirmation[] array

// Refresh affirmations
deleteAffirmationsForTime(userId, checkInTime)
→ Returns boolean success
```

**Integration:**
- DailyCheckin passes `dreamText`, `dreamId`, `isPremium` props
- AffirmationsDisplay uses `generateAffirmationsFromDream()`
- Affirmations stored with `dream_id` reference
- Previous/Next buttons for premium users (3 affirmations)
- Refresh button to regenerate

### Monthly Report System

**Files:**
- `src/lib/monthlyReport.ts` - Statistics calculation
- `src/components/MonthlyReport.tsx` - UI component
- `src/lib/pdfExport.ts` - PDF export logic

**Key Functions:**

```typescript
// Get dreams for current month
getMonthDreams(userId)
→ Returns Dream[] array

// Calculate statistics
getMonthDreamStats(userId)
→ Returns DreamStats object

// Generate AI insights
generateMonthlyInsights(dreams, stats, language)
→ Returns string (200-250 words)

// Export as PDF
generateMonthlyReportPDF(stats, insights, fileName)
→ Downloads HTML file (printable to PDF)
```

**Statistics Included:**
- Total dreams this month
- Total dreams analyzed
- Average mood (1-5 scale)
- Dominant mood (most frequent)
- Affirmations generated
- Top 5 keywords by frequency
- Emotional trends (all moods)
- Dream themes (top 5)

**AI Insights:**
- Emotional patterns analysis
- Major themes identification
- Psychological growth areas
- Suggested practices
- 200-250 words, bilingual (en/ko)

### AI Analysis Length Control

**Files:**
- `app/api/analyze-dream/route.ts` - API endpoint
- `src/components/SimpleDreamInterface.tsx` - Component integration

**Implementation:**
- API receives `isPremium` flag from frontend
- Generates different Gemini prompts
- Free: "Keep to 150-200 words"
- Premium: "500+ words comprehensive analysis"

---

## Testing Checklist

Use this checklist to verify all features work correctly:

### Premium Subscription
- [ ] Free user: Analysis limited to 150-200 words
- [ ] Free user: Progress bar shows usage
- [ ] Premium user: Analysis shows 500+ words
- [ ] Premium user: No progress bar visible
- [ ] Gumroad links work correctly

### Affirmations System
- [ ] Affirmation appears when dream is saved
- [ ] Free user: 1 affirmation per check-in
- [ ] Premium user: 3 affirmations with nav buttons
- [ ] Refresh button works
- [ ] Affirmations match dream content

### Monthly Report
- [ ] Statistics display correctly
- [ ] Mood average calculated (1-5 scale)
- [ ] Keywords extracted and ranked
- [ ] Emotional trends shown with bars
- [ ] Free user: No PDF export button
- [ ] Premium user: PDF export button visible
- [ ] AI insights displayed (premium only)
- [ ] Report expands/collapses

### Monthly Usage
- [ ] Free user: Shows "X/7" after analysis
- [ ] Color changes: green → yellow → red
- [ ] Resets on new month
- [ ] Premium user: Unlimited shown

### Edge Cases
- [ ] No dreams in month: Shows "No data yet"
- [ ] No mood selected: Average defaults to 0
- [ ] Missing API key: Graceful error message
- [ ] Affirmations disabled: No errors, UI still works
- [ ] Database offline: Error logged, not shown to user

---

## Monitoring & Debugging

### Check Database Setup

```sql
-- Verify affirmations table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'affirmations';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'affirmations';

-- View affirmations view
SELECT * FROM affirmations_today LIMIT 1;
```

### Monitor API Usage

Check your Gemini API dashboard:
- https://console.cloud.google.com/gen-app-builder

Monitor:
- API calls per month
- Average response time
- Error rates
- Token usage

### Check Logs

In Supabase:
1. Go to **Logs** → **Edge Function Logs** (if using functions)
2. Check browser console for errors
3. Monitor server logs for API responses

### Common Issues

**Issue:** "Cannot find module 'affirmations'"
**Solution:** Ensure `npm install` was run after pulling changes

**Issue:** Affirmations not saving
**Solution:**
1. Verify Supabase migration was executed
2. Check RLS policies allow INSERT
3. Verify API key is set

**Issue:** Monthly report shows "No data yet"
**Solution:**
1. Ensure dreams exist for current month
2. Check mood is set on dreams
3. Verify date fields are correct

**Issue:** PDF export not working
**Solution:**
1. Check browser allows downloads
2. Verify file path is correct
3. Check for JavaScript errors in console

---

## Performance Optimization

### Current State
- ✅ All components render efficiently
- ✅ API calls cached where possible
- ✅ Database queries indexed
- ✅ RLS policies optimized

### Recommendations for Future
1. **Memoize MonthlyReport component:**
   ```typescript
   export default React.memo(MonthlyReport)
   ```

2. **Add pagination for large datasets:**
   - Monthly reports for past months
   - Keyword frequency trends

3. **Implement service worker:**
   - Cache affirmations
   - Offline affirmation display
   - Sync when online

4. **Upgrade PDF library:**
   - Add jsPDF for native PDF generation
   - Include charts and graphs
   - Better layout control

---

## Rollback Plan

If issues occur post-deployment:

### Step 1: Disable Features (5 minutes)

**Temporarily disable affirmations:**
```typescript
// In AffirmationsDisplay.tsx, return early:
if (!affirmations.length) {
  return null; // Or placeholder
}
```

**Disable PDF export:**
```typescript
// In MonthlyReport.tsx, hide button:
{isPremium && false && !isLoading && stats && stats.totalDreams > 0 && (
  // PDF button
)}
```

### Step 2: Revert Commit (if needed)

```bash
git revert 4af550b  # Commit hash for this feature
git push origin main
```

### Step 3: Monitor

- Check error rates return to normal
- Verify users can still analyze dreams
- Ensure no data loss

---

## Support Resources

### Documentation
- [IMPLEMENTATION_TEST_REPORT.md](IMPLEMENTATION_TEST_REPORT.md) - Full test report
- [README.md](README.md) - Project overview
- Supabase Docs: https://supabase.com/docs

### API Documentation
- Gemini API: https://ai.google.dev/docs
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs

### Contact
- GitHub Issues: [Create issue in repo](https://github.com/novakitz/novakitz-main/issues)
- Email: [Your support email]

---

## Success Criteria

✅ **Launch is successful when:**
1. Supabase migration executes without error
2. Free users see 150-200 word analysis
3. Premium users see 500+ word analysis
4. Affirmations appear in check-in flow
5. Monthly report loads without errors
6. Premium users can export PDF
7. No errors in browser console
8. No errors in server logs
9. All database queries execute successfully
10. Users report positive experience

---

## Timeline

| Task | Duration | Responsible |
|------|----------|-------------|
| Execute Supabase migration | 5 min | DevOps/Admin |
| Verify environment variables | 5 min | DevOps/Admin |
| Deploy to production | 10-30 min | DevOps |
| Run test checklist | 15 min | QA |
| Monitor for 24 hours | ongoing | Engineering |
| Gather user feedback | 1 week | Product |

**Total Deploy Time:** ~1 hour

---

## Post-Launch Checklist

- [ ] All features verified working
- [ ] No errors in logs
- [ ] Users accessing features successfully
- [ ] Feedback collected
- [ ] Performance metrics within acceptable range
- [ ] Backup verified (Supabase auto-backup)
- [ ] Documentation updated
- [ ] Team notified of successful launch
- [ ] Release notes published
- [ ] Monitor metrics for 48 hours

---

## Future Roadmap

### Phase 2 (Next Month)
- [ ] Add data visualization to monthly reports
- [ ] Implement jsPDF for native PDF generation
- [ ] Add chart generation for mood trends

### Phase 3 (2-3 Months)
- [ ] Advanced analytics dashboard
- [ ] Predictive insights based on patterns
- [ ] Sharing monthly reports with others

### Phase 4 (3-6 Months)
- [ ] Mobile app integration
- [ ] API for third-party integrations
- [ ] Community features

---

## Questions?

Refer to:
1. [IMPLEMENTATION_TEST_REPORT.md](IMPLEMENTATION_TEST_REPORT.md) for technical details
2. Source code comments for implementation specifics
3. Supabase documentation for database questions
4. Gemini API docs for AI integration questions

---

**Deployment Date:** [To be filled in]
**Deployed By:** [To be filled in]
**Status:** ⏳ Pending Deployment

Good luck with your launch! 🚀
