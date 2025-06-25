-- Fix RLS performance issues by optimizing auth.uid() calls
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

-- Drop and recreate all policies with optimized auth.uid() calls

-- DISHES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own dishes" ON public.dishes;
CREATE POLICY "Users can view their own dishes" ON public.dishes
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own dishes" ON public.dishes;
CREATE POLICY "Users can insert their own dishes" ON public.dishes
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own dishes" ON public.dishes;
CREATE POLICY "Users can update their own dishes" ON public.dishes
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own dishes" ON public.dishes;
CREATE POLICY "Users can delete their own dishes" ON public.dishes
    FOR DELETE USING ((select auth.uid()) = user_id);

-- SOURCES TABLE POLICIES
-- Also clean up duplicate policies while we're at it
DROP POLICY IF EXISTS "Users can view their own sources" ON public.sources;
CREATE POLICY "Users can view their own sources" ON public.sources
    FOR SELECT USING ((select auth.uid()) = user_id);

-- Remove duplicate policies and create single optimized ones
DROP POLICY IF EXISTS "Users can insert their own sources" ON public.sources;
DROP POLICY IF EXISTS "Users can create their own sources" ON public.sources;
CREATE POLICY "Users can insert their own sources" ON public.sources
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own sources" ON public.sources;
CREATE POLICY "Users can update their own sources" ON public.sources
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON public.sources;
CREATE POLICY "Users can delete their own sources" ON public.sources
    FOR DELETE USING ((select auth.uid()) = user_id);

-- MEAL_HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own meal history" ON public.meal_history;
CREATE POLICY "Users can view their own meal history" ON public.meal_history
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own meal history" ON public.meal_history;
CREATE POLICY "Users can insert their own meal history" ON public.meal_history
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own meal history" ON public.meal_history;
CREATE POLICY "Users can update their own meal history" ON public.meal_history
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own meal history" ON public.meal_history;
CREATE POLICY "Users can delete their own meal history" ON public.meal_history
    FOR DELETE USING ((select auth.uid()) = user_id);

-- PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING ((select auth.uid()) = id);

-- TAGS TABLE POLICIES (if they exist)
-- These may have been created in earlier migrations that we don't have locally
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
CREATE POLICY "Users can insert their own tags" ON public.tags
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;
CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING ((select auth.uid()) = user_id);

-- DISH_TAGS TABLE POLICIES (if they exist)
-- These may reference dishes table for user_id validation
DROP POLICY IF EXISTS "Users can view dish_tags for their dishes" ON public.dish_tags;
CREATE POLICY "Users can view dish_tags for their dishes" ON public.dish_tags
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM dishes d WHERE d.id = dish_id AND d.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert dish_tags for their dishes" ON public.dish_tags;
CREATE POLICY "Users can insert dish_tags for their dishes" ON public.dish_tags
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM dishes d WHERE d.id = dish_id AND d.user_id = (select auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete dish_tags for their dishes" ON public.dish_tags;
CREATE POLICY "Users can delete dish_tags for their dishes" ON public.dish_tags
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM dishes d WHERE d.id = dish_id AND d.user_id = (select auth.uid())
    ));