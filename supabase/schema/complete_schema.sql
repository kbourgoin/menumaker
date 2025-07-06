

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."clear_user_data"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."clear_user_data"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at)
    VALUES (new.id, new.created_at);
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_dish_summary_secure"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Refresh the materialized view concurrently (now that we have unique index)
    REFRESH MATERIALIZED VIEW CONCURRENTLY dish_summary;
END;
$$;


ALTER FUNCTION "public"."refresh_dish_summary_secure"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_dish_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Call the existing refresh function
    PERFORM public.refresh_dish_summary_secure();
    
    -- Return appropriate value based on trigger type
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_dish_summary"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dish_tags" (
    "dish_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."dish_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dishes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "createdat" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cuisines" "text"[] DEFAULT '{Other}'::"text"[] NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_id" "uuid",
    "location" "text"
);


ALTER TABLE "public"."dishes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dishid" "uuid" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."meal_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "color" "text",
    CONSTRAINT "tags_category_check" CHECK (("category" = ANY (ARRAY['cuisine'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tags"."category" IS 'Type of tag: cuisine for cooking styles,
  general for other categorization';



COMMENT ON COLUMN "public"."tags"."color" IS 'CSS color classes for visual styling (primarily
  used for cuisine tags)';



CREATE MATERIALIZED VIEW "public"."dish_summary" AS
 SELECT "d"."id",
    "d"."name",
    "d"."location",
    "d"."cuisines",
    "d"."source_id",
    "d"."user_id",
    "d"."createdat",
    COALESCE("mh"."times_cooked", (0)::bigint) AS "times_cooked",
    "mh"."last_made",
    "mh"."last_comment",
    COALESCE("array_agg"("t"."name" ORDER BY "t"."name") FILTER (WHERE ("t"."name" IS NOT NULL)), '{}'::"text"[]) AS "tags"
   FROM ((("public"."dishes" "d"
     LEFT JOIN ( SELECT "mh_1"."dishid",
            "count"(*) AS "times_cooked",
            "max"("mh_1"."date") AS "last_made",
            ( SELECT "mh2"."notes"
                   FROM "public"."meal_history" "mh2"
                  WHERE (("mh2"."dishid" = "mh_1"."dishid") AND ("mh2"."notes" IS NOT NULL) AND ("mh2"."notes" <> ''::"text"))
                  ORDER BY "mh2"."date" DESC
                 LIMIT 1) AS "last_comment"
           FROM "public"."meal_history" "mh_1"
          GROUP BY "mh_1"."dishid") "mh" ON (("d"."id" = "mh"."dishid")))
     LEFT JOIN "public"."dish_tags" "dt" ON (("d"."id" = "dt"."dish_id")))
     LEFT JOIN "public"."tags" "t" ON (("dt"."tag_id" = "t"."id")))
  GROUP BY "d"."id", "d"."name", "d"."location", "d"."cuisines", "d"."source_id", "d"."user_id", "d"."createdat", "mh"."times_cooked", "mh"."last_made", "mh"."last_comment"
  WITH NO DATA;


ALTER TABLE "public"."dish_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dish_summary_secure" AS
 SELECT "dish_summary"."id",
    "dish_summary"."name",
    "dish_summary"."location",
    "dish_summary"."cuisines",
    "dish_summary"."source_id",
    "dish_summary"."user_id",
    "dish_summary"."createdat",
    "dish_summary"."times_cooked",
    "dish_summary"."last_made",
    "dish_summary"."last_comment",
    "dish_summary"."tags"
   FROM "public"."dish_summary"
  WHERE ("dish_summary"."user_id" = "auth"."uid"());


ALTER TABLE "public"."dish_summary_secure" OWNER TO "postgres";


COMMENT ON VIEW "public"."dish_summary_secure" IS 'This view uses SECURITY DEFINER (default) to access the dish_summary materialized view.
This is acceptable because:
1. The view filters results by auth.uid() ensuring users only see their own data
2. This is a read-only view with no data modification capabilities  
3. The underlying materialized view provides significant performance benefits
4. Direct access to the materialized view is properly restricted to service_role
5. This is the standard PostgreSQL pattern for secure access to materialized views';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "username" "text",
    "avatar_url" "text",
    "cuisines" "text"[] DEFAULT '{Italian,Mexican,American,Asian,Mediterranean,Indian,French,Greek,Thai,Japanese,Chinese,Korean,"Middle Eastern",Vietnamese,Spanish,Caribbean,German,British,Fusion,Other}'::"text"[]
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


ALTER TABLE ONLY "public"."dish_tags"
    ADD CONSTRAINT "dish_tags_pkey" PRIMARY KEY ("dish_id", "tag_id");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_history"
    ADD CONSTRAINT "meal_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_user_id_key" UNIQUE ("name", "user_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "dish_summary_id_idx" ON "public"."dish_summary" USING "btree" ("id");



CREATE INDEX "idx_dish_tags_dish_id" ON "public"."dish_tags" USING "btree" ("dish_id");



CREATE INDEX "idx_dish_tags_tag_id" ON "public"."dish_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_dishes_source_id" ON "public"."dishes" USING "btree" ("source_id");



CREATE INDEX "idx_dishes_user_id" ON "public"."dishes" USING "btree" ("user_id");



CREATE INDEX "idx_meal_history_dishid" ON "public"."meal_history" USING "btree" ("dishid");



CREATE INDEX "idx_meal_history_dishid_date" ON "public"."meal_history" USING "btree" ("dishid", "date" DESC);



CREATE INDEX "idx_meal_history_user_dish" ON "public"."meal_history" USING "btree" ("user_id", "dishid");



CREATE INDEX "idx_meal_history_user_id" ON "public"."meal_history" USING "btree" ("user_id");



CREATE INDEX "idx_tags_category" ON "public"."tags" USING "btree" ("category");



COMMENT ON INDEX "public"."idx_tags_category" IS 'Index for filtering tags by category (cuisine vs general). Used by CuisineTagSelector and cuisine migration utilities.';



CREATE INDEX "idx_tags_name" ON "public"."tags" USING "btree" ("name");



COMMENT ON INDEX "public"."idx_tags_name" IS 'Index for tag name lookups and search functionality.';



CREATE INDEX "idx_tags_user_category" ON "public"."tags" USING "btree" ("user_id", "category");



COMMENT ON INDEX "public"."idx_tags_user_category" IS 'Composite index for user-specific category queries. Optimizes common pattern of finding user''s cuisine tags.';



CREATE INDEX "idx_tags_user_id" ON "public"."tags" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_dish_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."dishes" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();



CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_history_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."meal_history" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();



CREATE OR REPLACE TRIGGER "refresh_dish_summary_on_tags_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."dish_tags" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_dish_summary"();



ALTER TABLE ONLY "public"."dish_tags"
    ADD CONSTRAINT "dish_tags_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dish_tags"
    ADD CONSTRAINT "dish_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id");



ALTER TABLE ONLY "public"."dishes"
    ADD CONSTRAINT "dishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meal_history"
    ADD CONSTRAINT "meal_history_dishid_fkey" FOREIGN KEY ("dishid") REFERENCES "public"."dishes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_history"
    ADD CONSTRAINT "meal_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete dish_tags for their dishes" ON "public"."dish_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."dishes" "d"
  WHERE (("d"."id" = "dish_tags"."dish_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete their own dishes" ON "public"."dishes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own meal history" ON "public"."meal_history" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own profile" ON "public"."profiles" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can delete their own sources" ON "public"."sources" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own tags" ON "public"."tags" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert dish_tags for their dishes" ON "public"."dish_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dishes" "d"
  WHERE (("d"."id" = "dish_tags"."dish_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert their own dishes" ON "public"."dishes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own meal history" ON "public"."meal_history" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert their own sources" ON "public"."sources" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own tags" ON "public"."tags" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own dishes" ON "public"."dishes" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own meal history" ON "public"."meal_history" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update their own sources" ON "public"."sources" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own tags" ON "public"."tags" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view dish_tags for their dishes" ON "public"."dish_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dishes" "d"
  WHERE (("d"."id" = "dish_tags"."dish_id") AND ("d"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view their own dishes" ON "public"."dishes" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own meal history" ON "public"."meal_history" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view their own sources" ON "public"."sources" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own tags" ON "public"."tags" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."dish_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dishes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."clear_user_data"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_user_data"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_user_data"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_by"("dish_id" "uuid", "increment_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_times_cooked"("dish_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_dish_summary_secure"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_dish_summary_secure"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_dish_summary_secure"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_dish_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_dish_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_dish_summary"() TO "service_role";


















GRANT ALL ON TABLE "public"."dish_tags" TO "anon";
GRANT ALL ON TABLE "public"."dish_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."dish_tags" TO "service_role";



GRANT ALL ON TABLE "public"."dishes" TO "anon";
GRANT ALL ON TABLE "public"."dishes" TO "authenticated";
GRANT ALL ON TABLE "public"."dishes" TO "service_role";



GRANT ALL ON TABLE "public"."meal_history" TO "anon";
GRANT ALL ON TABLE "public"."meal_history" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_history" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."dish_summary" TO "service_role";



GRANT ALL ON TABLE "public"."dish_summary_secure" TO "anon";
GRANT ALL ON TABLE "public"."dish_summary_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."dish_summary_secure" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
