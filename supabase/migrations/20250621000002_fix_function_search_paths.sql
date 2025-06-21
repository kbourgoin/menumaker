-- Fix function search_path security issues
-- This migration adds SET search_path to functions to prevent search path injection attacks

-- Fix handle_new_user function (auth trigger function)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at)
    VALUES (new.id, new.created_at);
    RETURN new;
END;
$$;

-- Fix increment_times_cooked function
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_times_cooked') THEN
        DROP FUNCTION IF EXISTS public.increment_times_cooked(uuid) CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_times_cooked(dish_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_count numeric;
BEGIN
    -- Get current times_cooked value
    SELECT times_cooked INTO current_count
    FROM dishes
    WHERE id = dish_id AND user_id = auth.uid();
    
    -- If dish not found or not owned by user, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Increment times_cooked
    UPDATE dishes
    SET times_cooked = times_cooked + 1
    WHERE id = dish_id AND user_id = auth.uid();
    
    -- Return new value
    RETURN current_count + 1;
END;
$$;

-- Fix increment_by function
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_by') THEN
        DROP FUNCTION IF EXISTS public.increment_by(uuid, numeric) CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.increment_by(dish_id uuid, increment_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_count numeric;
BEGIN
    -- Get current times_cooked value
    SELECT times_cooked INTO current_count
    FROM dishes
    WHERE id = dish_id AND user_id = auth.uid();
    
    -- If dish not found or not owned by user, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Increment times_cooked by specified amount
    UPDATE dishes
    SET times_cooked = times_cooked + increment_amount
    WHERE id = dish_id AND user_id = auth.uid();
    
    -- Return new value
    RETURN current_count + increment_amount;
END;
$$;

-- Fix refresh_dish_summary_secure function
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_dish_summary_secure') THEN
        DROP FUNCTION IF EXISTS public.refresh_dish_summary_secure() CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.refresh_dish_summary_secure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY dish_summary;
END;
$$;

-- Fix clear_user_data function
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clear_user_data') THEN
        DROP FUNCTION IF EXISTS public.clear_user_data(uuid) CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.clear_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only allow users to clear their own data
    IF target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: cannot clear other users data';
    END IF;
    
    -- Clear user's data in reverse dependency order
    DELETE FROM meal_history WHERE user_id = target_user_id;
    DELETE FROM dish_tags WHERE dish_id IN (SELECT id FROM dishes WHERE user_id = target_user_id);
    DELETE FROM dishes WHERE user_id = target_user_id;
    DELETE FROM tags WHERE user_id = target_user_id;
    DELETE FROM sources WHERE user_id = target_user_id;
    
    -- Note: We don't delete the profile as that might break auth
END;
$$;