-- Enable Row Level Security on core tables
-- This migration adds RLS policies to secure user data access for core tables only
-- (tags and dish_tags already have RLS enabled from previous migration)

-- Enable RLS on core tables
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dishes table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dishes' AND policyname = 'Users can view their own dishes') THEN
        CREATE POLICY "Users can view their own dishes" ON public.dishes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dishes' AND policyname = 'Users can insert their own dishes') THEN
        CREATE POLICY "Users can insert their own dishes" ON public.dishes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dishes' AND policyname = 'Users can update their own dishes') THEN
        CREATE POLICY "Users can update their own dishes" ON public.dishes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dishes' AND policyname = 'Users can delete their own dishes') THEN
        CREATE POLICY "Users can delete their own dishes" ON public.dishes
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for sources table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'Users can view their own sources') THEN
        CREATE POLICY "Users can view their own sources" ON public.sources
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'Users can insert their own sources') THEN
        CREATE POLICY "Users can insert their own sources" ON public.sources
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'Users can update their own sources') THEN
        CREATE POLICY "Users can update their own sources" ON public.sources
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sources' AND policyname = 'Users can delete their own sources') THEN
        CREATE POLICY "Users can delete their own sources" ON public.sources
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for meal_history table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_history' AND policyname = 'Users can view their own meal history') THEN
        CREATE POLICY "Users can view their own meal history" ON public.meal_history
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_history' AND policyname = 'Users can insert their own meal history') THEN
        CREATE POLICY "Users can insert their own meal history" ON public.meal_history
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_history' AND policyname = 'Users can update their own meal history') THEN
        CREATE POLICY "Users can update their own meal history" ON public.meal_history
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_history' AND policyname = 'Users can delete their own meal history') THEN
        CREATE POLICY "Users can delete their own meal history" ON public.meal_history
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- RLS Policies for profiles table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can delete their own profile') THEN
        CREATE POLICY "Users can delete their own profile" ON public.profiles
            FOR DELETE USING (auth.uid() = id);
    END IF;
END $$;