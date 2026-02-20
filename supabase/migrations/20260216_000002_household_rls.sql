-- Migration: Replace user-scoped RLS with household-scoped policies
-- Description: Drops all existing user-scoped RLS policies and replaces them with
--   household-scoped equivalents. Creates auth.household_id() helper function.
-- Author: Keith Bourgoin
-- Date: 2026-02-16

BEGIN;

-- ============================================================
-- 1. Create auth.household_id() helper function
-- ============================================================
CREATE OR REPLACE FUNCTION auth.household_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
    SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

ALTER FUNCTION auth.household_id() OWNER TO postgres;

-- ============================================================
-- 2. Drop ALL existing user-scoped policies
-- ============================================================

-- dishes
DROP POLICY IF EXISTS "Users can view their own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can insert their own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can update their own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can delete their own dishes" ON public.dishes;

-- sources
DROP POLICY IF EXISTS "Users can view their own sources" ON public.sources;
DROP POLICY IF EXISTS "Users can insert their own sources" ON public.sources;
DROP POLICY IF EXISTS "Users can update their own sources" ON public.sources;
DROP POLICY IF EXISTS "Users can delete their own sources" ON public.sources;

-- tags
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

-- meal_history
DROP POLICY IF EXISTS "Users can view their own meal history" ON public.meal_history;
DROP POLICY IF EXISTS "Users can insert their own meal history" ON public.meal_history;
DROP POLICY IF EXISTS "Users can update their own meal history" ON public.meal_history;
DROP POLICY IF EXISTS "Users can delete their own meal history" ON public.meal_history;

-- dish_tags
DROP POLICY IF EXISTS "Users can view dish_tags for their dishes" ON public.dish_tags;
DROP POLICY IF EXISTS "Users can insert dish_tags for their dishes" ON public.dish_tags;
DROP POLICY IF EXISTS "Users can delete dish_tags for their dishes" ON public.dish_tags;

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- ============================================================
-- 3. Create new household-scoped policies
-- ============================================================

-- ----- dishes -----
CREATE POLICY "Household members can view dishes"
    ON public.dishes FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert dishes"
    ON public.dishes FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update dishes"
    ON public.dishes FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete dishes"
    ON public.dishes FOR DELETE
    USING (household_id = auth.household_id());

-- ----- sources -----
CREATE POLICY "Household members can view sources"
    ON public.sources FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert sources"
    ON public.sources FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update sources"
    ON public.sources FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete sources"
    ON public.sources FOR DELETE
    USING (household_id = auth.household_id());

-- ----- tags -----
CREATE POLICY "Household members can view tags"
    ON public.tags FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert tags"
    ON public.tags FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update tags"
    ON public.tags FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete tags"
    ON public.tags FOR DELETE
    USING (household_id = auth.household_id());

-- ----- meal_history -----
CREATE POLICY "Household members can view meal_history"
    ON public.meal_history FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert meal_history"
    ON public.meal_history FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update meal_history"
    ON public.meal_history FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete meal_history"
    ON public.meal_history FOR DELETE
    USING (household_id = auth.household_id());

-- ----- dish_tags (indirect via dishes) -----
CREATE POLICY "Household members can view dish_tags"
    ON public.dish_tags FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM dishes d
        WHERE d.id = dish_tags.dish_id
          AND d.household_id = auth.household_id()
    ));

CREATE POLICY "Household members can insert dish_tags"
    ON public.dish_tags FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM dishes d
        WHERE d.id = dish_tags.dish_id
          AND d.household_id = auth.household_id()
    ));

CREATE POLICY "Household members can delete dish_tags"
    ON public.dish_tags FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM dishes d
        WHERE d.id = dish_tags.dish_id
          AND d.household_id = auth.household_id()
    ));

-- ----- profiles -----
CREATE POLICY "Users can view household members"
    ON public.profiles FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- ----- households -----
CREATE POLICY "Authenticated users can view households"
    ON public.households FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Members can update their household"
    ON public.households FOR UPDATE
    USING (id = auth.household_id());

COMMIT;
