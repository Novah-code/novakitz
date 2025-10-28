-- Checkins table for daily mood and energy tracking
-- This table stores daily check-in records with mood, energy level, and progress notes

-- Disable RLS first to avoid conflicts during creation
ALTER TABLE IF EXISTS public.checkins DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.checkins CASCADE;

-- Create checkins table
CREATE TABLE public.checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    check_date DATE NOT NULL,
    time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
    progress_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, check_date, time_of_day)
);

-- Enable Row Level Security
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy 1: Users can insert their own checkins
CREATE POLICY "Users can insert their own checkins" ON public.checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own checkins
CREATE POLICY "Users can view their own checkins" ON public.checkins
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Users can update their own checkins
CREATE POLICY "Users can update their own checkins" ON public.checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own checkins
CREATE POLICY "Users can delete their own checkins" ON public.checkins
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER on_checkins_updated
    BEFORE UPDATE ON public.checkins
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX checkins_user_id_idx ON public.checkins(user_id);
CREATE INDEX checkins_check_date_idx ON public.checkins(check_date DESC);
CREATE INDEX checkins_user_date_idx ON public.checkins(user_id, check_date DESC);
CREATE INDEX checkins_time_of_day_idx ON public.checkins(time_of_day);

-- Grant permissions to authenticated users
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.checkins TO authenticated;
