-- Enable Row Level Security
ALTER TABLE IF EXISTS public.dreams DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.dreams;

-- Create dreams table
CREATE TABLE public.dreams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT NOT NULL DEFAULT 'peaceful',
    tags TEXT[] DEFAULT '{}',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own dreams" ON public.dreams
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own dreams" ON public.dreams
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams" ON public.dreams
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams" ON public.dreams
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_dreams_updated
    BEFORE UPDATE ON public.dreams
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX dreams_user_id_idx ON public.dreams(user_id);
CREATE INDEX dreams_created_at_idx ON public.dreams(created_at DESC);
CREATE INDEX dreams_tags_idx ON public.dreams USING GIN(tags);