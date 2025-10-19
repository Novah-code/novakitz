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

-- Create user_profiles table for additional user information
CREATE TABLE public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    country_code TEXT, -- ISO 3166-1 alpha-2 (e.g., 'US', 'KR', 'JP')
    country_name TEXT, -- Full country name (e.g., 'United States', 'South Korea')
    city TEXT,
    timezone TEXT, -- IANA timezone (e.g., 'America/New_York', 'Asia/Seoul')
    preferred_language TEXT DEFAULT 'en', -- 'en' or 'ko'
    signup_ip TEXT, -- IP address used during signup
    last_login_ip TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_profiles
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for user_profiles
CREATE INDEX user_profiles_user_id_idx ON public.user_profiles(user_id);
CREATE INDEX user_profiles_country_code_idx ON public.user_profiles(country_code);
CREATE INDEX user_profiles_created_at_idx ON public.user_profiles(created_at DESC);