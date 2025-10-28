-- Evening Reflections table for daily evening reflection
-- This table stores evening reflection records where users reflect on their day

-- Disable RLS first to avoid conflicts during creation
ALTER TABLE IF EXISTS public.evening_reflections DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.evening_reflections CASCADE;

-- Create evening_reflections table
CREATE TABLE public.evening_reflections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    highlights TEXT,
    challenges TEXT,
    learnings TEXT,
    gratitude TEXT,
    tomorrow_focus TEXT,
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, reflection_date)
);

-- Enable Row Level Security
ALTER TABLE public.evening_reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Policy 1: Users can insert their own reflections
CREATE POLICY "Users can insert their own reflections" ON public.evening_reflections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own reflections
CREATE POLICY "Users can view their own reflections" ON public.evening_reflections
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 3: Users can update their own reflections
CREATE POLICY "Users can update their own reflections" ON public.evening_reflections
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own reflections
CREATE POLICY "Users can delete their own reflections" ON public.evening_reflections
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER on_evening_reflections_updated
    BEFORE UPDATE ON public.evening_reflections
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX evening_reflections_user_id_idx ON public.evening_reflections(user_id);
CREATE INDEX evening_reflections_reflection_date_idx ON public.evening_reflections(reflection_date DESC);
CREATE INDEX evening_reflections_user_date_idx ON public.evening_reflections(user_id, reflection_date DESC);

-- Grant permissions to authenticated users
ALTER TABLE public.evening_reflections ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.evening_reflections TO authenticated;
