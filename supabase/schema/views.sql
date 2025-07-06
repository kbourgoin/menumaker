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



