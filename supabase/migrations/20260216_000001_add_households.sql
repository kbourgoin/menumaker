-- Migration: Add households table and household_id to all data tables
-- Description: Creates the households table for shared recipe collections and
--   adds household_id to profiles, dishes, sources, tags, and meal_history.
--   Backfills existing data so each user gets their own household.
-- Author: Keith Bourgoin
-- Date: 2026-02-16

BEGIN;

-- ============================================================
-- 1. Create households table
-- ============================================================
CREATE TABLE public.households (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL DEFAULT 'My Household',
    invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(9), 'base64'),
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.households OWNER TO postgres;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Add household_id to profiles (nullable for now)
-- ============================================================
ALTER TABLE public.profiles
    ADD COLUMN household_id uuid;

-- ============================================================
-- 3. Backfill: create one household per existing user, then
--    set profiles.household_id to match
-- ============================================================
DO $$
DECLARE
    rec RECORD;
    new_household_id uuid;
BEGIN
    FOR rec IN SELECT id FROM public.profiles LOOP
        INSERT INTO public.households (created_by)
        VALUES (rec.id)
        RETURNING id INTO new_household_id;

        UPDATE public.profiles
        SET household_id = new_household_id
        WHERE id = rec.id;
    END LOOP;
END;
$$;

-- ============================================================
-- 4. Make profiles.household_id NOT NULL and add FK
-- ============================================================
ALTER TABLE public.profiles
    ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id);

-- ============================================================
-- 5. Add household_id (nullable) to data tables
-- ============================================================
ALTER TABLE public.dishes
    ADD COLUMN household_id uuid;

ALTER TABLE public.sources
    ADD COLUMN household_id uuid;

ALTER TABLE public.tags
    ADD COLUMN household_id uuid;

ALTER TABLE public.meal_history
    ADD COLUMN household_id uuid;

-- ============================================================
-- 6. Backfill household_id on data tables from profiles
-- ============================================================
UPDATE public.dishes d
SET household_id = p.household_id
FROM public.profiles p
WHERE d.user_id = p.id;

UPDATE public.sources s
SET household_id = p.household_id
FROM public.profiles p
WHERE s.user_id = p.id;

UPDATE public.tags t
SET household_id = p.household_id
FROM public.profiles p
WHERE t.user_id = p.id;

UPDATE public.meal_history mh
SET household_id = p.household_id
FROM public.profiles p
WHERE mh.user_id = p.id;

-- ============================================================
-- 7. Make all household_id columns NOT NULL and add FKs
-- ============================================================
ALTER TABLE public.dishes
    ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.dishes
    ADD CONSTRAINT dishes_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id);

ALTER TABLE public.sources
    ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.sources
    ADD CONSTRAINT sources_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id);

ALTER TABLE public.tags
    ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.tags
    ADD CONSTRAINT tags_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id);

ALTER TABLE public.meal_history
    ALTER COLUMN household_id SET NOT NULL;

ALTER TABLE public.meal_history
    ADD CONSTRAINT meal_history_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id);

-- ============================================================
-- 8. Add indexes
-- ============================================================
CREATE INDEX idx_dishes_household_id ON public.dishes(household_id);
CREATE INDEX idx_sources_household_id ON public.sources(household_id);
CREATE INDEX idx_tags_household_id ON public.tags(household_id);
CREATE INDEX idx_meal_history_household_id ON public.meal_history(household_id);
CREATE INDEX idx_profiles_household_id ON public.profiles(household_id);
CREATE INDEX idx_households_invite_code ON public.households(invite_code);

COMMIT;
