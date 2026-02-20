# Shared Households Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shared household support so multiple users can share a recipe collection via invite links.

**Architecture:** Add a `households` table, put `household_id` on all data tables, scope RLS policies by household instead of user. Use `profiles.household_id` as the one-household-per-user membership link. Server-side `join_household()` and `leave_household()` functions handle transitions atomically.

**Tech Stack:** Supabase (PostgreSQL, RLS, SQL functions), React, TanStack Query, shadcn/ui, React Router

**Design doc:** `docs/plans/2026-02-16-shared-households-design.md`

---

### Task 1: Database migration — households table and schema changes

This is the foundation everything else depends on. One migration file, applied as a transaction.

**Files:**
- Create: `supabase/migrations/20260216_000001_add_households.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Migration: Add shared households
-- ============================================================

-- 1. Create households table
CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL DEFAULT 'My Household',
    "invite_code" text NOT NULL DEFAULT encode(gen_random_bytes(9), 'base64'),
    "created_by" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "households_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "households_invite_code_key" UNIQUE ("invite_code"),
    CONSTRAINT "households_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id")
);

ALTER TABLE "public"."households" OWNER TO "postgres";
ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;

-- 2. Add household_id to profiles (nullable first for backfill)
ALTER TABLE "public"."profiles" ADD COLUMN "household_id" uuid;

-- 3. Create a household for every existing user and assign them
DO $$
DECLARE
    r RECORD;
    new_household_id uuid;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        INSERT INTO public.households (created_by)
        VALUES (r.id)
        RETURNING id INTO new_household_id;

        UPDATE public.profiles SET household_id = new_household_id WHERE id = r.id;
    END LOOP;
END $$;

-- 4. Now make household_id NOT NULL and add FK
ALTER TABLE "public"."profiles"
    ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");

-- 5. Add household_id to data tables (nullable first)
ALTER TABLE "public"."dishes" ADD COLUMN "household_id" uuid;
ALTER TABLE "public"."sources" ADD COLUMN "household_id" uuid;
ALTER TABLE "public"."tags" ADD COLUMN "household_id" uuid;
ALTER TABLE "public"."meal_history" ADD COLUMN "household_id" uuid;

-- 6. Backfill household_id from profiles via user_id
UPDATE "public"."dishes" d
    SET household_id = p.household_id
    FROM "public"."profiles" p WHERE d.user_id = p.id;

UPDATE "public"."sources" s
    SET household_id = p.household_id
    FROM "public"."profiles" p WHERE s.user_id = p.id;

UPDATE "public"."tags" t
    SET household_id = p.household_id
    FROM "public"."profiles" p WHERE t.user_id = p.id;

UPDATE "public"."meal_history" mh
    SET household_id = p.household_id
    FROM "public"."profiles" p WHERE mh.user_id = p.id;

-- 7. Add NOT NULL constraints and FKs
ALTER TABLE "public"."dishes"
    ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "public"."dishes"
    ADD CONSTRAINT "dishes_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");

ALTER TABLE "public"."sources"
    ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "public"."sources"
    ADD CONSTRAINT "sources_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");

ALTER TABLE "public"."tags"
    ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "public"."tags"
    ADD CONSTRAINT "tags_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");

ALTER TABLE "public"."meal_history"
    ALTER COLUMN "household_id" SET NOT NULL;
ALTER TABLE "public"."meal_history"
    ADD CONSTRAINT "meal_history_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "public"."households"("id");

-- 8. Add indexes
CREATE INDEX "idx_dishes_household_id" ON "public"."dishes" USING btree ("household_id");
CREATE INDEX "idx_sources_household_id" ON "public"."sources" USING btree ("household_id");
CREATE INDEX "idx_tags_household_id" ON "public"."tags" USING btree ("household_id");
CREATE INDEX "idx_meal_history_household_id" ON "public"."meal_history" USING btree ("household_id");
CREATE INDEX "idx_profiles_household_id" ON "public"."profiles" USING btree ("household_id");
CREATE INDEX "idx_households_invite_code" ON "public"."households" USING btree ("invite_code");
```

**Step 2: Apply migration locally**

Run: `bun run dev:db:start && bun run db:migrate`
Expected: Migration applies successfully with no errors.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_000001_add_households.sql
git commit -m "feat: add households table and household_id to data tables"
```

---

### Task 2: Database migration — helper function and RLS policies

Replace all user-scoped RLS policies with household-scoped ones. Add `auth.household_id()` helper.

**Files:**
- Create: `supabase/migrations/20260216_000002_household_rls.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Migration: Household-scoped RLS policies
-- ============================================================

-- 1. Helper function: get current user's household_id
CREATE OR REPLACE FUNCTION auth.household_id() RETURNS uuid
    LANGUAGE sql SECURITY DEFINER STABLE
    SET search_path = 'public'
    AS $$
    SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$;

ALTER FUNCTION auth.household_id() OWNER TO "postgres";

-- 2. Drop all existing user-scoped policies

-- dishes
DROP POLICY IF EXISTS "Users can view their own dishes" ON "public"."dishes";
DROP POLICY IF EXISTS "Users can insert their own dishes" ON "public"."dishes";
DROP POLICY IF EXISTS "Users can update their own dishes" ON "public"."dishes";
DROP POLICY IF EXISTS "Users can delete their own dishes" ON "public"."dishes";

-- sources
DROP POLICY IF EXISTS "Users can view their own sources" ON "public"."sources";
DROP POLICY IF EXISTS "Users can insert their own sources" ON "public"."sources";
DROP POLICY IF EXISTS "Users can update their own sources" ON "public"."sources";
DROP POLICY IF EXISTS "Users can delete their own sources" ON "public"."sources";

-- tags
DROP POLICY IF EXISTS "Users can view their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can insert their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can update their own tags" ON "public"."tags";
DROP POLICY IF EXISTS "Users can delete their own tags" ON "public"."tags";

-- meal_history
DROP POLICY IF EXISTS "Users can view their own meal history" ON "public"."meal_history";
DROP POLICY IF EXISTS "Users can insert their own meal history" ON "public"."meal_history";
DROP POLICY IF EXISTS "Users can update their own meal history" ON "public"."meal_history";
DROP POLICY IF EXISTS "Users can delete their own meal history" ON "public"."meal_history";

-- dish_tags
DROP POLICY IF EXISTS "Users can view dish_tags for their dishes" ON "public"."dish_tags";
DROP POLICY IF EXISTS "Users can insert dish_tags for their dishes" ON "public"."dish_tags";
DROP POLICY IF EXISTS "Users can delete dish_tags for their dishes" ON "public"."dish_tags";

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can delete their own profile" ON "public"."profiles";

-- 3. Create household-scoped policies

-- dishes: household members can CRUD
CREATE POLICY "Household members can view dishes"
    ON "public"."dishes" FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert dishes"
    ON "public"."dishes" FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update dishes"
    ON "public"."dishes" FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete dishes"
    ON "public"."dishes" FOR DELETE
    USING (household_id = auth.household_id());

-- sources: household members can CRUD
CREATE POLICY "Household members can view sources"
    ON "public"."sources" FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert sources"
    ON "public"."sources" FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update sources"
    ON "public"."sources" FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete sources"
    ON "public"."sources" FOR DELETE
    USING (household_id = auth.household_id());

-- tags: household members can CRUD
CREATE POLICY "Household members can view tags"
    ON "public"."tags" FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert tags"
    ON "public"."tags" FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update tags"
    ON "public"."tags" FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete tags"
    ON "public"."tags" FOR DELETE
    USING (household_id = auth.household_id());

-- meal_history: household members can CRUD
CREATE POLICY "Household members can view meal history"
    ON "public"."meal_history" FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can insert meal history"
    ON "public"."meal_history" FOR INSERT
    WITH CHECK (household_id = auth.household_id());

CREATE POLICY "Household members can update meal history"
    ON "public"."meal_history" FOR UPDATE
    USING (household_id = auth.household_id());

CREATE POLICY "Household members can delete meal history"
    ON "public"."meal_history" FOR DELETE
    USING (household_id = auth.household_id());

-- dish_tags: check via dishes.household_id
CREATE POLICY "Household members can view dish_tags"
    ON "public"."dish_tags" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."dishes" d
        WHERE d.id = dish_tags.dish_id
        AND d.household_id = auth.household_id()
    ));

CREATE POLICY "Household members can insert dish_tags"
    ON "public"."dish_tags" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."dishes" d
        WHERE d.id = dish_tags.dish_id
        AND d.household_id = auth.household_id()
    ));

CREATE POLICY "Household members can delete dish_tags"
    ON "public"."dish_tags" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."dishes" d
        WHERE d.id = dish_tags.dish_id
        AND d.household_id = auth.household_id()
    ));

-- profiles: see household members, update own
CREATE POLICY "Users can view household members"
    ON "public"."profiles" FOR SELECT
    USING (household_id = auth.household_id());

CREATE POLICY "Users can insert their own profile"
    ON "public"."profiles" FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON "public"."profiles" FOR UPDATE
    USING (id = auth.uid());

-- households: members can view and update their own
CREATE POLICY "Members can view their household"
    ON "public"."households" FOR SELECT
    USING (id = auth.household_id());

CREATE POLICY "Members can update their household"
    ON "public"."households" FOR UPDATE
    USING (id = auth.household_id());

-- households: need a SELECT policy for join_household to look up by invite_code
-- This uses a permissive policy scoped to just the invite_code lookup
CREATE POLICY "Anyone authenticated can look up household by invite code"
    ON "public"."households" FOR SELECT
    USING (auth.uid() IS NOT NULL);
```

**Step 2: Apply migration locally**

Run: `bun run db:migrate`
Expected: All policies replaced successfully.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_000002_household_rls.sql
git commit -m "feat: replace user-scoped RLS with household-scoped policies"
```

---

### Task 3: Database migration — update views and functions

Update `dish_summary`, `dish_summary_secure`, `handle_new_user`, and create `join_household`/`leave_household`/`regenerate_invite_code` functions.

**Files:**
- Create: `supabase/migrations/20260216_000003_household_functions.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Migration: Household-aware views and functions
-- ============================================================

-- 1. Recreate dish_summary materialized view with household_id
DROP MATERIALIZED VIEW IF EXISTS "public"."dish_summary" CASCADE;

CREATE MATERIALIZED VIEW "public"."dish_summary" AS
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

ALTER TABLE "public"."dish_summary" OWNER TO "postgres";

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX "idx_dish_summary_id" ON "public"."dish_summary" ("id");

-- 2. Recreate dish_summary_secure view — now household-scoped
CREATE OR REPLACE VIEW "public"."dish_summary_secure" AS
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

ALTER TABLE "public"."dish_summary_secure" OWNER TO "postgres";

-- 3. Update handle_new_user to create household on signup
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
    AS $$
DECLARE
    new_household_id uuid;
BEGIN
    -- Create a household for the new user
    INSERT INTO public.households (created_by)
    VALUES (new.id)
    RETURNING id INTO new_household_id;

    -- Create profile with household link
    INSERT INTO public.profiles (id, created_at, household_id)
    VALUES (new.id, new.created_at, new_household_id);

    RETURN new;
END;
$$;

-- 4. join_household: atomic function to join a household by invite code
CREATE OR REPLACE FUNCTION "public"."join_household"("code" text)
    RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
    AS $$
DECLARE
    target_household_id uuid;
    current_household_id uuid;
    current_user_id uuid;
    members_remaining int;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Look up target household
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

    -- Already in this household?
    IF current_household_id = target_household_id THEN
        RETURN target_household_id;
    END IF;

    -- Reassign all user's data to new household
    UPDATE public.dishes SET household_id = target_household_id
        WHERE user_id = current_user_id AND household_id = current_household_id;
    UPDATE public.sources SET household_id = target_household_id
        WHERE user_id = current_user_id AND household_id = current_household_id;
    UPDATE public.tags SET household_id = target_household_id
        WHERE user_id = current_user_id AND household_id = current_household_id;
    UPDATE public.meal_history SET household_id = target_household_id
        WHERE user_id = current_user_id AND household_id = current_household_id;

    -- Move user to new household
    UPDATE public.profiles SET household_id = target_household_id
        WHERE id = current_user_id;

    -- Clean up old household if empty
    SELECT count(*) INTO members_remaining
    FROM public.profiles
    WHERE household_id = current_household_id;

    IF members_remaining = 0 THEN
        DELETE FROM public.households WHERE id = current_household_id;
    END IF;

    RETURN target_household_id;
END;
$$;

ALTER FUNCTION "public"."join_household"("code" text) OWNER TO "postgres";

-- 5. leave_household: create new solo household, leave data behind
CREATE OR REPLACE FUNCTION "public"."leave_household"()
    RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
    AS $$
DECLARE
    current_user_id uuid;
    current_household_id uuid;
    new_household_id uuid;
    members_count int;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT household_id INTO current_household_id
    FROM public.profiles
    WHERE id = current_user_id;

    -- Check if user is the only member (can't leave a solo household)
    SELECT count(*) INTO members_count
    FROM public.profiles
    WHERE household_id = current_household_id;

    IF members_count <= 1 THEN
        RAISE EXCEPTION 'Cannot leave: you are the only member';
    END IF;

    -- Create new solo household
    INSERT INTO public.households (created_by)
    VALUES (current_user_id)
    RETURNING id INTO new_household_id;

    -- Move user to new household (data stays behind)
    UPDATE public.profiles SET household_id = new_household_id
        WHERE id = current_user_id;

    RETURN new_household_id;
END;
$$;

ALTER FUNCTION "public"."leave_household"() OWNER TO "postgres";

-- 6. regenerate_invite_code: generate a new invite code
CREATE OR REPLACE FUNCTION "public"."regenerate_invite_code"()
    RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = 'public'
    AS $$
DECLARE
    user_household_id uuid;
    new_code text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT household_id INTO user_household_id
    FROM public.profiles
    WHERE id = auth.uid();

    new_code := encode(gen_random_bytes(9), 'base64');

    UPDATE public.households
    SET invite_code = new_code
    WHERE id = user_household_id;

    RETURN new_code;
END;
$$;

ALTER FUNCTION "public"."regenerate_invite_code"() OWNER TO "postgres";
```

**Step 2: Apply migration locally**

Run: `bun run db:migrate`
Expected: Views recreated, functions created successfully.

**Step 3: Commit**

```bash
git add supabase/migrations/20260216_000003_household_functions.sql
git commit -m "feat: add household-aware views and join/leave functions"
```

---

### Task 4: Regenerate Supabase types

After the migrations, regenerate TypeScript types so the app knows about `household_id` and `households`.

**Files:**
- Modify: `src/integrations/supabase/types.ts` (auto-generated)

**Step 1: Regenerate types**

Run: `bun run db:update-types`
Expected: `src/integrations/supabase/types.ts` updated with `households` table and `household_id` on all data tables.

**Step 2: Verify the types include households**

Run: `grep -n "households" src/integrations/supabase/types.ts | head -5`
Expected: Lines referencing `households` table definition.

**Step 3: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate Supabase types after household migration"
```

---

### Task 5: Add Household entity type and mapper

Add application-level types and DB-to-app mappers for the new household data.

**Files:**
- Modify: `src/types/entities.ts`
- Create: `src/integrations/supabase/mappers/householdMappers.ts`
- Modify: `src/utils/typeMapping.ts` (add re-export)

**Step 1: Add Household entity to `src/types/entities.ts`**

After the `Profile` type alias (around line 79), add:

```typescript
export interface HouseholdEntity {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
}

export type Household = HouseholdEntity;
```

Also add `householdId` to `ProfileEntity`:

```typescript
export interface ProfileEntity {
  id: string;
  username?: string;
  avatarUrl?: string;
  cuisines?: string[];
  updatedAt?: string;
  householdId: string;
}
```

**Step 2: Create household mappers**

Create `src/integrations/supabase/mappers/householdMappers.ts`:

```typescript
import { Tables } from "../types";
import { Household } from "@/types/entities";

type DBHousehold = Tables<"households">;

export function mapHouseholdFromDB(db: DBHousehold): Household {
  return {
    id: db.id,
    name: db.name,
    inviteCode: db.invite_code,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}
```

**Step 3: Add re-export in `src/utils/typeMapping.ts`**

Add to the existing re-exports:

```typescript
export { mapHouseholdFromDB } from "@/integrations/supabase/mappers/householdMappers";
```

**Step 4: Export from barrel file**

Check what `src/integrations/supabase/client.ts` exports and add household mapper there too. Also add `Household` to `src/types/index.ts` if it has barrel exports.

**Step 5: Verify types compile**

Run: `bun run type-check`
Expected: No type errors.

**Step 6: Commit**

```bash
git add src/types/entities.ts src/integrations/supabase/mappers/householdMappers.ts src/utils/typeMapping.ts
git commit -m "feat: add Household entity type and DB mapper"
```

---

### Task 6: Create useHousehold query hook

Fetches the current user's household with member list. This is the core hook everything else depends on.

**Files:**
- Create: `src/hooks/household/useHouseholdQueries.ts`
- Create: `src/hooks/household/index.ts`

**Step 1: Write the test**

Create `src/hooks/household/__tests__/useHouseholdQueries.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, createTestQueryClient } from "@/test/test-utils";
import { useHouseholdQueries } from "../useHouseholdQueries";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("useHouseholdQueries", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch household with members", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    } as any);

    const mockSelect = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: "household-1",
          name: "Test Household",
          invite_code: "abc123",
          created_by: "user-1",
          created_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      }),
    });

    const mockEq = vi.fn().mockReturnValue({ select: mockSelect });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockEq }),
    } as any);

    const { result } = renderHook(() => useHouseholdQueries(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.household).toBeDefined();
    expect(result.current.household?.name).toBe("Test Household");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test:run -- src/hooks/household/__tests__/useHouseholdQueries.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement useHouseholdQueries**

Create `src/hooks/household/useHouseholdQueries.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapHouseholdFromDB } from "@/integrations/supabase/mappers/householdMappers";
import { Household, Profile } from "@/types";
import { classifyError, logError } from "@/utils/errorHandling";
import { ErrorType } from "@/types/errors";

export function useHouseholdQueries() {
  const {
    data: household,
    isLoading: isLoadingHousehold,
    error: householdError,
  } = useQuery({
    queryKey: ["household"],
    queryFn: async (): Promise<Household | null> => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) return null;

      // Get user's profile to find household_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.household_id) {
        if (profileError) logError(classifyError(profileError), "useHouseholdQueries:profile");
        return null;
      }

      // Fetch household
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", profile.household_id)
        .single();

      if (error) {
        logError(classifyError(error), "useHouseholdQueries:household");
        return null;
      }

      return mapHouseholdFromDB(data);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      const appError = classifyError(error);
      return appError.type === ErrorType.NETWORK_ERROR && failureCount < 2;
    },
  });

  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: ["householdMembers"],
    queryFn: async (): Promise<Profile[]> => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) return [];

      // Profiles RLS already scopes to household members
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, updated_at, household_id");

      if (error) {
        logError(classifyError(error), "useHouseholdQueries:members");
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        username: p.username ?? undefined,
        avatarUrl: p.avatar_url ?? undefined,
        updatedAt: p.updated_at ?? undefined,
        householdId: p.household_id,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!household,
  });

  return {
    household,
    members,
    isLoading: isLoadingHousehold || isLoadingMembers,
    error: householdError ? classifyError(householdError) : null,
  };
}
```

Create `src/hooks/household/index.ts`:

```typescript
export { useHouseholdQueries } from "./useHouseholdQueries";
export { useHouseholdMutations } from "./useHouseholdMutations";
```

**Step 4: Run test to verify it passes**

Run: `bun run test:run -- src/hooks/household/__tests__/useHouseholdQueries.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/household/
git commit -m "feat: add useHouseholdQueries hook"
```

---

### Task 7: Create useHouseholdMutations hook

Mutations for joining, leaving, updating household name, and regenerating invite codes.

**Files:**
- Create: `src/hooks/household/useHouseholdMutations.ts`

**Step 1: Write the test**

Create `src/hooks/household/__tests__/useHouseholdMutations.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, createTestQueryClient } from "@/test/test-utils";
import { useHouseholdMutations } from "../useHouseholdMutations";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("useHouseholdMutations", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should call join_household RPC", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: "household-123",
      error: null,
    } as any);

    const { result } = renderHook(() => useHouseholdMutations(), { wrapper });

    await result.current.joinHousehold("invite-code-abc");

    expect(supabase.rpc).toHaveBeenCalledWith("join_household", {
      code: "invite-code-abc",
    });
  });

  it("should call leave_household RPC", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: "new-household-456",
      error: null,
    } as any);

    const { result } = renderHook(() => useHouseholdMutations(), { wrapper });

    await result.current.leaveHousehold();

    expect(supabase.rpc).toHaveBeenCalledWith("leave_household");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun run test:run -- src/hooks/household/__tests__/useHouseholdMutations.test.tsx`
Expected: FAIL — module not found.

**Step 3: Implement useHouseholdMutations**

Create `src/hooks/household/useHouseholdMutations.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { classifyError, logError } from "@/utils/errorHandling";

export function useHouseholdMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["household"] });
    queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
    queryClient.invalidateQueries({ queryKey: ["dishes"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    queryClient.invalidateQueries({ queryKey: ["suggestedDishes"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
  };

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc("join_household", {
        code: inviteCode,
      });
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:join");
        throw error;
      }
      return data as string;
    },
    onSuccess: invalidateAll,
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("leave_household");
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:leave");
        throw error;
      }
      return data as string;
    },
    onSuccess: invalidateAll,
  });

  const updateHouseholdMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", id);
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:update");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  const regenerateInviteCodeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("regenerate_invite_code");
      if (error) {
        logError(classifyError(error), "useHouseholdMutations:regenerateCode");
        throw error;
      }
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
    },
  });

  return {
    joinHousehold: (code: string) => joinHouseholdMutation.mutateAsync(code),
    leaveHousehold: () => leaveHouseholdMutation.mutateAsync(),
    updateHousehold: (id: string, name: string) =>
      updateHouseholdMutation.mutateAsync({ id, name }),
    regenerateInviteCode: () => regenerateInviteCodeMutation.mutateAsync(),

    isJoining: joinHouseholdMutation.isPending,
    isLeaving: leaveHouseholdMutation.isPending,
    isUpdating: updateHouseholdMutation.isPending,
    isRegenerating: regenerateInviteCodeMutation.isPending,

    joinError: joinHouseholdMutation.error ? classifyError(joinHouseholdMutation.error) : null,
    leaveError: leaveHouseholdMutation.error ? classifyError(leaveHouseholdMutation.error) : null,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test:run -- src/hooks/household/__tests__/useHouseholdMutations.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/household/
git commit -m "feat: add useHouseholdMutations hook"
```

---

### Task 8: Update dish mutations to include household_id

The `addDish` mutation needs to include `household_id` on insert. Reads are already handled by RLS.

**Files:**
- Modify: `src/hooks/dish/useDishMutations.tsx`

**Step 1: Update addDish to include household_id**

In `src/hooks/dish/useDishMutations.tsx`, the `addDish` mutation builds a `newDish` object at line 49-56. Update it to fetch the user's household_id and include it:

After the auth check (line 23-38), add:

```typescript
// Get user's household_id
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("household_id")
  .eq("id", user.id)
  .single();

if (profileError || !profile?.household_id) {
  throw new Error("Could not determine household");
}
```

Then update the `newDish` object to include `household_id: profile.household_id`.

**Step 2: Run existing tests**

Run: `bun run test:run -- src/hooks/dish/`
Expected: Tests may need mock updates for the new `profiles` query. Update mocks accordingly.

**Step 3: Commit**

```bash
git add src/hooks/dish/useDishMutations.tsx
git commit -m "feat: include household_id in dish inserts"
```

---

### Task 9: Update source, tag, and meal history mutations

Same pattern as Task 8 — add `household_id` to inserts in all other mutation hooks.

**Files:**
- Modify: `src/hooks/meal-history/` (find the meal history mutation hook)
- Modify: Any source/tag mutation hooks

**Step 1: Find all mutation hooks that do inserts**

Search for `.insert(` across the hooks directory to find every place that inserts data. Each one needs `household_id` added.

**Step 2: Update each to fetch profile.household_id and include it**

Follow the same pattern as Task 8: fetch `profiles.household_id` after auth, include in insert payload.

**Step 3: Run all tests**

Run: `bun run test:run`
Expected: PASS (update mocks if needed)

**Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: include household_id in all data inserts"
```

---

### Task 10: Update AuthProvider to allow /join routes

The AuthProvider redirects unauthenticated users to `/auth` unless they're already on `/auth`. It needs to also allow `/join/*`.

**Files:**
- Modify: `src/components/auth/AuthProvider.tsx`

**Step 1: Update the redirect condition**

In `src/components/auth/AuthProvider.tsx`, line 47 currently checks:
```typescript
if (!data.session && location.pathname !== "/auth") {
```

Change to:
```typescript
if (!data.session && location.pathname !== "/auth" && !location.pathname.startsWith("/join/")) {
```

Same change at line 66-68 for the `onAuthStateChange` handler.

**Step 2: Run type-check**

Run: `bun run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/auth/AuthProvider.tsx
git commit -m "feat: allow /join routes without authentication"
```

---

### Task 11: Create JoinHousehold page

Page at `/join/:inviteCode` that handles the join flow.

**Files:**
- Create: `src/pages/JoinHousehold.tsx`
- Modify: `src/App.tsx` (add route)

**Step 1: Create the JoinHousehold page**

Create `src/pages/JoinHousehold.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth";
import { useHouseholdMutations } from "@/hooks/household";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared";
import { Users, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinHousehold() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { joinHousehold, isJoining } = useHouseholdMutations();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // If not authenticated, redirect to auth with invite code preserved
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && inviteCode) {
      navigate(`/auth?invite=${encodeURIComponent(inviteCode)}`, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, inviteCode, navigate]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      setError(null);
      await joinHousehold(inviteCode);
      toast({ title: "Joined household!", description: "You now have access to shared recipes." });
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to join household. The invite link may be invalid.");
    }
  };

  if (isAuthLoading) {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null; // useEffect will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-terracotta-500 mx-auto mb-2" />
          <CardTitle>Join a Household</CardTitle>
          <CardDescription>
            You've been invited to share recipes with a household.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full"
          >
            {isJoining ? "Joining..." : "Join Household"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Add route to App.tsx**

In `src/App.tsx`, add lazy import:
```typescript
const JoinHousehold = lazy(() => import("./pages/JoinHousehold"));
```

Add route before the `*` catch-all:
```typescript
<Route
  path="/join/:inviteCode"
  element={
    <ErrorBoundary context="join-household-page">
      <JoinHousehold />
    </ErrorBoundary>
  }
/>
```

**Step 3: Handle invite code on auth page**

In the auth page, after successful signup/login, check for `?invite=` param and redirect to `/join/:code` if present. This requires reading `useSearchParams` in the auth flow and navigating after auth completes.

**Step 4: Run type-check and lint**

Run: `bun run type-check && bun run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/JoinHousehold.tsx src/App.tsx
git commit -m "feat: add JoinHousehold page and route"
```

---

### Task 12: Create HouseholdSettings component

Component for the Settings page that shows household info, members, invite link, and leave button.

**Files:**
- Create: `src/components/household/HouseholdSettings.tsx`
- Create: `src/components/household/index.ts`

**Step 1: Create the component**

Create `src/components/household/HouseholdSettings.tsx`:

```typescript
import { useState } from "react";
import { useHouseholdQueries } from "@/hooks/household/useHouseholdQueries";
import { useHouseholdMutations } from "@/hooks/household/useHouseholdMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Copy, RefreshCw, LogOut, Check, Pencil } from "lucide-react";
import { LoadingSpinner } from "@/components/shared";

export function HouseholdSettings() {
  const { household, members, isLoading } = useHouseholdQueries();
  const { updateHousehold, regenerateInviteCode, leaveHousehold, isUpdating, isRegenerating, isLeaving } = useHouseholdMutations();
  const { session } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [copied, setCopied] = useState(false);

  if (isLoading || !household) {
    return <LoadingSpinner size="md" text="Loading household..." />;
  }

  const inviteUrl = `${window.location.origin}/join/${household.inviteCode}`;
  const isSoloHousehold = members.length <= 1;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Invite link copied!" });
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) return;
    await updateHousehold(household.id, nameInput.trim());
    setIsEditingName(false);
    toast({ title: "Household name updated" });
  };

  const handleRegenerateCode = async () => {
    await regenerateInviteCode();
    toast({ title: "Invite link regenerated", description: "The old link no longer works." });
  };

  const handleLeave = async () => {
    await leaveHousehold();
    toast({ title: "Left household", description: "You now have a new personal household." });
  };

  return (
    <div className="space-y-6">
      {/* Household name */}
      <div>
        <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-terracotta-500" />
          Household
        </h3>
        {isEditingName ? (
          <div className="flex gap-2">
            <Input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Household name"
              onKeyDown={e => e.key === "Enter" && handleUpdateName()}
            />
            <Button onClick={handleUpdateName} disabled={isUpdating} size="sm">Save</Button>
            <Button onClick={() => setIsEditingName(false)} variant="outline" size="sm">Cancel</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg">{household.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setNameInput(household.name); setIsEditingName(true); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Members */}
      <div>
        <h4 className="font-medium mb-2">Members ({members.length})</h4>
        <ul className="space-y-2">
          {members.map(member => (
            <li key={member.id} className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(member.username || member.id.slice(0, 2)).charAt(0).toUpperCase()}
              </div>
              <span>{member.username || "Unnamed"}</span>
              {member.id === session?.user?.id && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Invite link */}
      <div>
        <h4 className="font-medium mb-2">Invite Link</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Share this link to invite someone to your household.
        </p>
        <div className="flex gap-2">
          <Input value={inviteUrl} readOnly className="font-mono text-xs" />
          <Button onClick={handleCopyLink} variant="outline" size="icon">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button onClick={handleRegenerateCode} variant="outline" size="icon" disabled={isRegenerating}>
            <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Leave household */}
      {!isSoloHousehold && (
        <div>
          <h4 className="font-medium mb-2">Leave Household</h4>
          <p className="text-sm text-muted-foreground mb-2">
            You'll get a new personal household. Your contributed recipes stay here.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isLeaving}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Household
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave household?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your recipes will stay with the household. You'll start fresh with a new personal collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeave}>Leave</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
```

Create `src/components/household/index.ts`:

```typescript
export { HouseholdSettings } from "./HouseholdSettings";
```

**Step 2: Run type-check**

Run: `bun run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/household/
git commit -m "feat: add HouseholdSettings component"
```

---

### Task 13: Add Household tab to Settings page

Wire the HouseholdSettings component into the existing Settings page.

**Files:**
- Modify: `src/pages/Settings.tsx`

**Step 1: Add the tab**

In `src/pages/Settings.tsx`:

Add import:
```typescript
import { HouseholdSettings } from "@/components/household";
import { Users } from "lucide-react";
```

Add tab trigger to the `TabsList` (after line 38):
```typescript
<TabsTrigger value="household">Household</TabsTrigger>
```

Add tab content (after the preferences tab, before `</Tabs>`):
```typescript
<TabsContent value="household" className="mt-6">
  <Card>
    <CardHeader>
      <CardTitle>Household</CardTitle>
      <CardDescription>
        Manage your shared household and invite members
      </CardDescription>
    </CardHeader>
    <CardContent>
      <HouseholdSettings />
    </CardContent>
  </Card>
</TabsContent>
```

**Step 2: Run type-check and lint**

Run: `bun run type-check && bun run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add Household tab to Settings page"
```

---

### Task 14: Handle invite code in auth flow

When a user lands on `/auth?invite=CODE` after being redirected from `/join/:code`, they should be sent back to `/join/:code` after successful auth.

**Files:**
- Modify: `src/components/auth/AuthProvider.tsx`
- Modify: `src/pages/Auth.tsx` (or auth form components)

**Step 1: Preserve invite code through auth**

In `AuthProvider.tsx`, after a successful auth state change (when session becomes non-null), check for invite code in the URL:

```typescript
// In onAuthStateChange handler, when session exists:
if (session) {
  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get("invite");
  if (inviteCode) {
    navigate(`/join/${inviteCode}`, { replace: true });
    return;
  }
}
```

**Step 2: Run type-check**

Run: `bun run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/auth/AuthProvider.tsx
git commit -m "feat: redirect to join page after auth with invite code"
```

---

### Task 15: Final verification

Run full quality checks to make sure everything compiles, lints, and tests pass.

**Step 1: Run all quality checks**

Run: `bun run quality`
Expected: PASS (type-check, lint, test, build all green)

**Step 2: Test the full flow manually**

1. Start local DB: `bun run dev:db:start`
2. Reset DB to apply migrations: `bun run dev:db:reset`
3. Start dev server: `bun run dev`
4. Log in as test user
5. Go to Settings > Household tab
6. Verify household name and invite link appear
7. Copy invite link
8. Open in incognito, sign up as new user
9. Verify new user joins the household
10. Verify both users see the same dishes

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues from integration testing"
```
