# Shared Households Design

Multi-user support via shared households. Users invite others to a shared recipe pool where all members have equal access.

## Decisions

- **Sharing model:** Shared household — one pool of recipes, all members contribute
- **Scope:** One household per user
- **Permissions:** Equal access, no roles
- **Migration:** Existing users auto-get a solo household
- **Invitations:** Shareable invite link/code (no email service)
- **Attribution:** `user_id` preserved on all records for future use (not surfaced in UI yet)
- **Leaving:** Dishes stay with the household; leaving user gets a new empty household

## Database Schema

### New table: `households`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| name | TEXT NOT NULL | Default `'My Household'` |
| invite_code | TEXT UNIQUE NOT NULL | Short random string, ~12 chars |
| created_by | UUID REFERENCES auth.users | |
| created_at | TIMESTAMPTZ | Default `now()` |

### Modified: `profiles`

Add `household_id UUID REFERENCES households NOT NULL`.

### Modified: `dishes`, `sources`, `tags`, `meal_history`

Add `household_id UUID REFERENCES households NOT NULL` to each. Existing `user_id` stays as "created by."

### Migration steps

1. Create `households` table
2. For each existing user: create a household, set `profiles.household_id`
3. Add `household_id` to data tables, backfill from `profiles.household_id` via `user_id`
4. Add NOT NULL constraint after backfill
5. Update RLS policies
6. Update `dish_summary` materialized view to be household-scoped

## RLS Policies

### Helper function

```sql
CREATE FUNCTION auth.household_id() RETURNS UUID AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Data tables (`dishes`, `sources`, `tags`, `meal_history`)

```sql
-- SELECT, UPDATE, DELETE
USING (household_id = auth.household_id())
-- INSERT
WITH CHECK (household_id = auth.household_id())
```

### `dish_tags`

Indirect check via `dishes.household_id`:

```sql
USING (EXISTS (
  SELECT 1 FROM dishes d
  WHERE d.id = dish_tags.dish_id
  AND d.household_id = auth.household_id()
))
```

### `profiles`

- SELECT: `household_id = auth.household_id()` (see household members)
- UPDATE: `id = auth.uid()` (own profile only)

### `households`

- SELECT, UPDATE: `id = auth.household_id()` (own household only)
- No INSERT via RLS — created by functions
- No DELETE — households persist until empty

## Invite Flow

1. User copies invite link from household settings: `/join/<invite_code>`
2. Recipient clicks link:
   - **Not logged in:** redirect to `/auth` with invite code preserved. After sign up, auto-join.
   - **Logged in, solo household:** abandon solo household, join new one. Existing dishes reassigned to new household.
   - **Logged in, multi-member household:** warning that they'll leave current household. Confirm to proceed.

### `join_household(code TEXT)` function

Single transaction:
- Look up household by `invite_code`
- Reassign caller's data to new household
- Update `profiles.household_id`
- Delete old household if no members remain

### Regenerating invite codes

Any member can regenerate (invalidates old link). UI button on household settings.

### Leaving a household

Member gets a new solo household. Their contributed dishes stay with the old household.

## Frontend Changes

### New: Household Settings page

- Household name (editable)
- Member list (username/email)
- Invite link with copy + regenerate buttons
- "Leave household" button with confirmation

### New: `/join/:inviteCode` route

Handles the join flow above.

### New: `useHousehold` hook

Fetches current user's household (id, name, invite_code, members). Cached in TanStack Query.

### Modified: mutation hooks

Include `household_id` from `useHousehold` cache on all inserts.

### Unchanged

Dashboard, dish list, meal planning — RLS handles scoping transparently. Read queries don't change.

## Not in scope (future work)

- "Added by" labels on dishes
- User avatars on meal history
- Activity feed
- Household size limits
- Invite expiration
- Blocking/kicking members
- Data export on leave
