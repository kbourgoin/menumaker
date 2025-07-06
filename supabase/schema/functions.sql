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

