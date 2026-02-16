-- Migration: Recreate views and functions for household-aware data model
-- Description: Drops and recreates dish_summary materialized view and dish_summary_secure
--   view with household_id. Replaces handle_new_user to create households for new users.
--   Adds join_household, leave_household, and regenerate_invite_code functions.
-- Author: Keith Bourgoin
-- Date: 2026-02-16

BEGIN;

-- ============================================================
-- 1. Recreate dish_summary materialized view with household_id
-- ============================================================
-- CASCADE also drops the dependent dish_summary_secure view
DROP MATERIALIZED VIEW IF EXISTS public.dish_summary CASCADE;

CREATE MATERIALIZED VIEW public.dish_summary AS
SELECT
    d.id,
    d.name,
    d.location,
    d.cuisines,
    d.source_id,
    d.user_id,
    d.household_id,
    d.createdat,
    COALESCE(mh.times_cooked, 0::bigint) AS times_cooked,
    mh.last_made,
    mh.last_comment,
    COALESCE(array_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}'::text[]) AS tags
FROM public.dishes d
LEFT JOIN (
    SELECT
        mh_1.dishid,
        count(*) AS times_cooked,
        max(mh_1.date) AS last_made,
        (SELECT mh2.notes FROM public.meal_history mh2
         WHERE mh2.dishid = mh_1.dishid AND mh2.notes IS NOT NULL AND mh2.notes <> ''
         ORDER BY mh2.date DESC LIMIT 1) AS last_comment
    FROM public.meal_history mh_1
    GROUP BY mh_1.dishid
) mh ON d.id = mh.dishid
LEFT JOIN public.dish_tags dt ON d.id = dt.dish_id
LEFT JOIN public.tags t ON dt.tag_id = t.id
GROUP BY d.id, d.name, d.location, d.cuisines, d.source_id, d.user_id,
         d.household_id, d.createdat, mh.times_cooked, mh.last_made, mh.last_comment
WITH DATA;

ALTER MATERIALIZED VIEW public.dish_summary OWNER TO postgres;

CREATE UNIQUE INDEX idx_dish_summary_id ON public.dish_summary (id);

-- Restore grants on dish_summary
GRANT ALL ON TABLE public.dish_summary TO service_role;

-- ============================================================
-- 2. Recreate dish_summary_secure view (household-scoped)
-- ============================================================
CREATE OR REPLACE VIEW public.dish_summary_secure AS
SELECT
    dish_summary.id,
    dish_summary.name,
    dish_summary.location,
    dish_summary.cuisines,
    dish_summary.source_id,
    dish_summary.user_id,
    dish_summary.household_id,
    dish_summary.createdat,
    dish_summary.times_cooked,
    dish_summary.last_made,
    dish_summary.last_comment,
    dish_summary.tags
FROM public.dish_summary
WHERE dish_summary.household_id = auth.household_id();

ALTER VIEW public.dish_summary_secure OWNER TO postgres;

-- Restore grants on dish_summary_secure
GRANT ALL ON TABLE public.dish_summary_secure TO anon;
GRANT ALL ON TABLE public.dish_summary_secure TO authenticated;
GRANT ALL ON TABLE public.dish_summary_secure TO service_role;

-- ============================================================
-- 3. Replace handle_new_user function
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    new_household_id uuid;
BEGIN
    INSERT INTO public.households (created_by)
    VALUES (new.id)
    RETURNING id INTO new_household_id;

    INSERT INTO public.profiles (id, created_at, household_id)
    VALUES (new.id, new.created_at, new_household_id);

    RETURN new;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================================
-- 4. Create join_household(code text) function
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_household(code text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
    target_household_id uuid;
    current_household_id uuid;
    remaining_members int;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Look up target household by invite code
    SELECT id INTO target_household_id
    FROM public.households
    WHERE invite_code = code;

    IF target_household_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    -- Get current household
    SELECT household_id INTO current_household_id
    FROM public.profiles
    WHERE id = current_user_id;

    -- If already in target household, no-op
    IF current_household_id = target_household_id THEN
        RETURN target_household_id;
    END IF;

    -- Move user's data to target household
    UPDATE public.dishes
    SET household_id = target_household_id
    WHERE user_id = current_user_id AND household_id = current_household_id;

    UPDATE public.sources
    SET household_id = target_household_id
    WHERE user_id = current_user_id AND household_id = current_household_id;

    UPDATE public.tags
    SET household_id = target_household_id
    WHERE user_id = current_user_id AND household_id = current_household_id;

    UPDATE public.meal_history
    SET household_id = target_household_id
    WHERE user_id = current_user_id AND household_id = current_household_id;

    -- Move user's profile to target household
    UPDATE public.profiles
    SET household_id = target_household_id
    WHERE id = current_user_id;

    -- Check if old household has remaining members
    SELECT count(*) INTO remaining_members
    FROM public.profiles
    WHERE household_id = current_household_id;

    -- If no members remain, delete the old household
    IF remaining_members = 0 THEN
        DELETE FROM public.households WHERE id = current_household_id;
    END IF;

    RETURN target_household_id;
END;
$$;

ALTER FUNCTION public.join_household(text) OWNER TO postgres;

-- ============================================================
-- 5. Create leave_household() function
-- ============================================================
CREATE OR REPLACE FUNCTION public.leave_household() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
    current_household_id uuid;
    new_household_id uuid;
    member_count int;
BEGIN
    -- Get current user and household
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT household_id INTO current_household_id
    FROM public.profiles
    WHERE id = current_user_id;

    -- Count members in current household
    SELECT count(*) INTO member_count
    FROM public.profiles
    WHERE household_id = current_household_id;

    IF member_count <= 1 THEN
        RAISE EXCEPTION 'Cannot leave: you are the only member';
    END IF;

    -- Create a new household for the user
    INSERT INTO public.households (created_by)
    VALUES (current_user_id)
    RETURNING id INTO new_household_id;

    -- Move user to the new household (data stays behind)
    UPDATE public.profiles
    SET household_id = new_household_id
    WHERE id = current_user_id;

    RETURN new_household_id;
END;
$$;

ALTER FUNCTION public.leave_household() OWNER TO postgres;

-- ============================================================
-- 6. Create regenerate_invite_code() function
-- ============================================================
CREATE OR REPLACE FUNCTION public.regenerate_invite_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    current_household_id uuid;
    new_code text;
BEGIN
    -- Get user's household_id
    SELECT household_id INTO current_household_id
    FROM public.profiles
    WHERE id = auth.uid();

    -- Generate a new invite code
    new_code := encode(gen_random_bytes(9), 'base64');

    -- Update the household's invite code
    UPDATE public.households
    SET invite_code = new_code
    WHERE id = current_household_id;

    RETURN new_code;
END;
$$;

ALTER FUNCTION public.regenerate_invite_code() OWNER TO postgres;

COMMIT;
