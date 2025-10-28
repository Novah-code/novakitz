# Daily Checkins Setup Guide

## Changes Made

### 1. **Fixed Multiple Supabase Client Instances Issue**
All components now use the centralized Supabase client from `lib/supabase.ts` instead of creating their own instances.

**Components Fixed:**
- `src/components/DailyCheckin.tsx` - Changed from `createClient()` to imported `supabase`
- `src/components/MorningRitual.tsx` - Changed from `createClient()` to imported `supabase`
- `src/components/EveningReflection.tsx` - Changed from `createClient()` to imported `supabase`

**Benefits:**
- Eliminates the "multiple GoTrueClient instances" warning
- Ensures proper authentication and session management
- Reduces memory footprint

### 2. **Enhanced Error Logging in DailyCheckin**
Added comprehensive error logging to help diagnose why the save was failing:

```typescript
// Now logs:
// - Detailed submission data
// - Supabase response (data or error)
// - Error code, message, details, hint, status
// - Full error objects for debugging
```

### 3. **Added Type Definitions**
Added proper TypeScript interfaces to `src/lib/supabase.ts`:
- `Checkin` and `CheckinInsert`/`CheckinUpdate` interfaces
- `EveningReflection` and `EveningReflectionInsert`/`EveningReflectionUpdate` interfaces

### 4. **Created Comprehensive SQL Setup Files**
Two SQL files created for proper database setup with RLS policies:

**Files:**
- `database/create_checkins_table.sql` - Creates checkins table with proper RLS
- `database/create_evening_reflections_table.sql` - Creates evening_reflections table with proper RLS

## Next Steps: Database Setup in Supabase

You need to execute these SQL files in your Supabase dashboard to properly set up the tables with Row Level Security policies.

### How to Execute SQL in Supabase:

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project (novakitz)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/create_checkins_table.sql`
6. Click **Run** or press `Ctrl+Enter`
7. Repeat steps 4-6 for `database/create_evening_reflections_table.sql`

### What These SQL Files Do:

**For Checkins Table:**
- Creates `public.checkins` table with columns:
  - `id`: UUID primary key
  - `user_id`: Reference to auth.users
  - `check_date`: Date of the check-in
  - `time_of_day`: 'morning' | 'afternoon' | 'evening'
  - `mood`: Integer 1-10
  - `energy_level`: Integer 1-10
  - `progress_note`: Optional text field
  - Timestamps and constraints

- Adds 4 RLS Policies:
  - Users can INSERT their own checkins
  - Users can SELECT their own checkins
  - Users can UPDATE their own checkins
  - Users can DELETE their own checkins

- Creates indexes for performance

**For Evening Reflections Table:**
- Creates `public.evening_reflections` table with columns:
  - `id`: UUID primary key
  - `user_id`: Reference to auth.users
  - `reflection_date`: Date of reflection
  - `highlights`: Text field for day highlights
  - `challenges`: Text field for challenges
  - `learnings`: Text field for learnings
  - `gratitude`: Text field for gratitude
  - `tomorrow_focus`: Text field for next day focus
  - `mood`: Optional integer 1-10
  - Timestamps and constraints

- Adds 4 RLS Policies (same as checkins)
- Creates indexes for performance

## Testing the Fix

After setting up the database:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console:**
   - Press F12 or Cmd+Option+I
   - Go to **Console** tab

3. **Test DailyCheckin:**
   - Navigate to your app
   - Click on the "Afternoon Check-in" button (or whatever time is appropriate)
   - Fill in mood, energy level, and optional note
   - Click "Save"
   - Check console for logs starting with "DailyCheckin:"
   - You should see either:
     - Success: "DailyCheckin: Successfully saved: {...}"
     - Error: "DailyCheckin: Error saving checkin: {...error details}"

4. **Expected Success Flow:**
   - Console shows: "DailyCheckin: Starting submission..."
   - Console shows: "DailyCheckin: Insert response {data: {...}, error: null}"
   - Success alert shown
   - Modal closes
   - Button changes to "✅ Afternoon check-in done"

5. **If Still Failing:**
   - Check browser console for error details
   - Check Supabase dashboard > Logs for any database errors
   - Verify RLS policies are correctly set

## Troubleshooting

### Error: "column does not exist"
- Make sure you ran the SQL files in Supabase
- Verify column names: `check_date`, `time_of_day`, `mood`, `energy_level`, `progress_note`

### Error: "new row violates row-level security policy"
- This means RLS policies aren't set up correctly
- Run the SQL files again, making sure they execute without error

### Error: "Could not find the function"
- Make sure the `handle_updated_at()` trigger function exists
- It should be created by `database/schema.sql`

### "Saving..." never completes but no error shown
- Check if RLS SELECT policy is missing (needed for `.select().single()`)
- Verify `user_id` is being passed correctly
- Check that authenticated user has proper session

## Commits

These changes should be committed with message:
```
Fix DailyCheckin save by centralizing Supabase client and adding RLS policies

- Removed duplicate Supabase client instantiations from DailyCheckin, MorningRitual, EveningReflection
- Added comprehensive error logging to DailyCheckin for better debugging
- Created SQL files with proper RLS policies for checkins and evening_reflections tables
- Added TypeScript types for Checkin and EveningReflection to lib/supabase.ts
- Eliminates multiple GoTrueClient instances warning
```
