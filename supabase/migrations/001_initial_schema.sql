-- Migration: 001_initial_schema.sql
-- Description: Complete baseline schema representing production state as of 2025-07-06
-- This migration creates the entire database schema from scratch

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to clear all user data for a specific user
CREATE OR REPLACE FUNCTION "public"."clear_user_data"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Clear user-specific data in the correct order (respecting foreign key constraints)
    DELETE FROM public.meal_history WHERE user_id = target_user_id;
    DELETE FROM public.dish_tags WHERE dish_id IN (SELECT id FROM public.dishes WHERE user_id = target_user_id);
    DELETE FROM public.dishes WHERE user_id = target_user_id;
    DELETE FROM public.sources WHERE user_id = target_user_id;
    DELETE FROM public.tags WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;

-- Function to increment a dish's times_cooked by a specific amount
CREATE OR REPLACE FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_count numeric;
    new_count numeric;
BEGIN
    -- Get current times_cooked value
    SELECT times_cooked INTO current_count
    FROM public.dishes
    WHERE id = dish_id;
    
    -- If dish not found, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate new count
    new_count := current_count + increment_amount;
    
    -- Update the dish
    UPDATE public.dishes
    SET times_cooked = new_count,
        updated_at = NOW()
    WHERE id = dish_id;
    
    RETURN new_count;
END;
$$;

-- Function to increment times_cooked by 1
CREATE OR REPLACE FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_count numeric;
    new_count numeric;
BEGIN
    -- Get current times_cooked value
    SELECT times_cooked INTO current_count
    FROM public.dishes
    WHERE id = dish_id;
    
    -- If dish not found, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate new count
    new_count := current_count + 1;
    
    -- Update the dish
    UPDATE public.dishes
    SET times_cooked = new_count,
        updated_at = NOW()
    WHERE id = dish_id;
    
    RETURN new_count;
END;
$$;

-- Function to refresh the dish_summary materialized view
CREATE OR REPLACE FUNCTION "public"."refresh_dish_summary_secure"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Refresh the materialized view concurrently if possible
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dish_summary;
EXCEPTION
    WHEN others THEN
        -- If concurrent refresh fails, fall back to regular refresh
        REFRESH MATERIALIZED VIEW public.dish_summary;
END;
$$;

-- Trigger function to refresh dish_summary after changes
CREATE OR REPLACE FUNCTION "public"."trigger_refresh_dish_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Perform the refresh in a background job to avoid blocking
    PERFORM public.refresh_dish_summary_secure();
    RETURN NULL;
END;
$$;

-- =============================================
-- TABLES
-- =============================================

-- Junction table for dish tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "public"."dish_tags" (
    "dish_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dish_tags_pkey" PRIMARY KEY ("dish_id", "tag_id")
);

-- Main dishes table
CREATE TABLE IF NOT EXISTS "public"."dishes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "source_id" "uuid",
    "location" "text",
    "user_id" "uuid" NOT NULL,
    "times_cooked" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- Meal history tracking when dishes were cooked
CREATE TABLE IF NOT EXISTS "public"."meal_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dish_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cooked_at" timestamp with time zone NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meal_history_pkey" PRIMARY KEY ("id")
);

-- Tags for categorizing dishes (cuisines, etc.)
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- User profiles
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "display_name" "text",
    "custom_cuisines" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- Sources for dishes (cookbooks, websites, etc.)
CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text",
    "author" "text",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- MATERIALIZED VIEWS
-- =============================================

-- Materialized view for efficient dish summary queries
CREATE MATERIALIZED VIEW "public"."dish_summary" AS
 SELECT "d"."id",
    "d"."name",
    "d"."source_id",
    "d"."location",
    "d"."user_id",
    "d"."times_cooked",
    "d"."created_at",
    "d"."updated_at",
    "s"."name" AS "source_name",
    "s"."url" AS "source_url",
    "s"."author" AS "source_author",
    ( SELECT "max"("mh"."cooked_at") AS "max"
           FROM "public"."meal_history" "mh"
          WHERE ("mh"."dish_id" = "d"."id")) AS "last_cooked_at",
    ( SELECT "array_agg"("t"."name" ORDER BY "t"."name") AS "array_agg"
           FROM (("public"."dish_tags" "dt"
             JOIN "public"."tags" "t" ON (("dt"."tag_id" = "t"."id")))
             JOIN "public"."dishes" "d2" ON (("dt"."dish_id" = "d2"."id")))
          WHERE ("d2"."id" = "d"."id")) AS "tag_names"
   FROM ("public"."dishes" "d"
     LEFT JOIN "public"."sources" "s" ON (("d"."source_id" = "s"."id")))
  WITH NO DATA;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX "dish_summary_id_idx" ON "public"."dish_summary" USING "btree" ("id");

-- =============================================
-- SECURE VIEWS
-- =============================================

-- Security definer view for accessing dish_summary with RLS
CREATE OR REPLACE VIEW "public"."dish_summary_secure" AS
 SELECT "dish_summary"."id",
    "dish_summary"."name",
    "dish_summary"."source_id",
    "dish_summary"."location",
    "dish_summary"."user_id",
    "dish_summary"."times_cooked",
    "dish_summary"."created_at",
    "dish_summary"."updated_at",
    "dish_summary"."source_name",
    "dish_summary"."source_url",
    "dish_summary"."source_author",
    "dish_summary"."last_cooked_at",
    "dish_summary"."tag_names"
   FROM "public"."dish_summary"
  WHERE ("dish_summary"."user_id" = "auth"."uid"());

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

ALTER TABLE ONLY "public"."dish_tags"
    ADD CONSTRAINT "dish_tags_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dish_tags"
    ADD CONSTRAINT "dish_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."meal_history"
    ADD CONSTRAINT "meal_history_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."meal_history"
    ADD CONSTRAINT "meal_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Foreign key indexes for better join performance
CREATE INDEX IF NOT EXISTS "dish_tags_dish_id_idx" ON "public"."dish_tags" USING "btree" ("dish_id");
CREATE INDEX IF NOT EXISTS "dish_tags_tag_id_idx" ON "public"."dish_tags" USING "btree" ("tag_id");
CREATE INDEX IF NOT EXISTS "dishes_user_id_idx" ON "public"."dishes" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "dishes_source_id_idx" ON "public"."dishes" USING "btree" ("source_id");
CREATE INDEX IF NOT EXISTS "meal_history_dish_id_idx" ON "public"."meal_history" USING "btree" ("dish_id");
CREATE INDEX IF NOT EXISTS "meal_history_user_id_idx" ON "public"."meal_history" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "meal_history_cooked_at_idx" ON "public"."meal_history" USING "btree" ("cooked_at");
CREATE INDEX IF NOT EXISTS "sources_user_id_idx" ON "public"."sources" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "tags_user_id_idx" ON "public"."tags" USING "btree" ("user_id");

-- Unique constraints for business logic
CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_user_id_unique" ON "public"."tags" USING "btree" ("name", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sources_name_user_id_unique" ON "public"."sources" USING "btree" ("name", "user_id");

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to refresh dish_summary when dishes change
CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_dish_change" 
    AFTER INSERT OR DELETE OR UPDATE ON "public"."dishes" 
    FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();

-- Trigger to refresh dish_summary when meal_history changes
CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_history_change" 
    AFTER INSERT OR DELETE OR UPDATE ON "public"."meal_history" 
    FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();

-- Trigger to refresh dish_summary when dish_tags change
CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_tags_change" 
    AFTER INSERT OR DELETE OR UPDATE ON "public"."dish_tags" 
    FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();

-- Trigger to create user profile on registration
CREATE OR REPLACE TRIGGER "on_auth_user_created" 
    AFTER INSERT ON "auth"."users" 
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE "public"."dish_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."dishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meal_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

-- dish_tags policies
CREATE POLICY "Users can view dish_tags for their dishes" ON "public"."dish_tags" FOR SELECT 
    USING ((EXISTS ( SELECT 1 FROM "public"."dishes" WHERE (("dishes"."id" = "dish_tags"."dish_id") AND ("dishes"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can insert dish_tags for their dishes" ON "public"."dish_tags" FOR INSERT 
    WITH CHECK ((EXISTS ( SELECT 1 FROM "public"."dishes" WHERE (("dishes"."id" = "dish_tags"."dish_id") AND ("dishes"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can delete dish_tags for their dishes" ON "public"."dish_tags" FOR DELETE 
    USING ((EXISTS ( SELECT 1 FROM "public"."dishes" WHERE (("dishes"."id" = "dish_tags"."dish_id") AND ("dishes"."user_id" = "auth"."uid"())))));

-- dishes policies
CREATE POLICY "Users can view their own dishes" ON "public"."dishes" FOR SELECT 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can insert their own dishes" ON "public"."dishes" FOR INSERT 
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can update their own dishes" ON "public"."dishes" FOR UPDATE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can delete their own dishes" ON "public"."dishes" FOR DELETE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- meal_history policies
CREATE POLICY "Users can view their own meal history" ON "public"."meal_history" FOR SELECT 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can insert their own meal history" ON "public"."meal_history" FOR INSERT 
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can update their own meal history" ON "public"."meal_history" FOR UPDATE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can delete their own meal history" ON "public"."meal_history" FOR DELETE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- profiles policies
CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT 
    USING ((( SELECT "auth"."uid"() AS "uid") = "id"));

CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT 
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));

CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "id"));

CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "id"));

-- sources policies
CREATE POLICY "Users can view their own sources" ON "public"."sources" FOR SELECT 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can insert their own sources" ON "public"."sources" FOR INSERT 
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can update their own sources" ON "public"."sources" FOR UPDATE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can delete their own sources" ON "public"."sources" FOR DELETE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- tags policies
CREATE POLICY "Users can view their own tags" ON "public"."tags" FOR SELECT 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can insert their own tags" ON "public"."tags" FOR INSERT 
    WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can update their own tags" ON "public"."tags" FOR UPDATE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "Users can delete their own tags" ON "public"."tags" FOR DELETE 
    USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- =============================================
-- POPULATE MATERIALIZED VIEW
-- =============================================

-- Refresh the materialized view to populate it with existing data
REFRESH MATERIALIZED VIEW "public"."dish_summary";

-- Migration complete