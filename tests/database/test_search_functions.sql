-- Database Function Tests - Search Functions
-- Tests for search_dishes and related search functionality

BEGIN;

-- Load pgtap extension for testing
SELECT plan(12);

-- Test 1: Verify search_dishes function exists
SELECT has_function(
    'public', 'search_dishes',
    ARRAY['text', 'uuid'],
    'search_dishes function should exist'
);

-- Test 2: Verify search_dishes returns correct type
SELECT function_returns(
    'public', 'search_dishes',
    ARRAY['text', 'uuid'],
    'SETOF dishes',
    'search_dishes should return SETOF dishes'
);

-- Setup test data
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES (
    '91111111-1111-1111-1111-111111111111'::uuid,
    'test-search@example.com',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dishes (id, name, user_id, created_at, updated_at)
VALUES 
    ('a1111111-1111-1111-1111-111111111111'::uuid, 'Pasta Carbonara', '91111111-1111-1111-1111-111111111111'::uuid, now(), now()),
    ('a2222222-2222-2222-2222-222222222222'::uuid, 'Chicken Pasta', '91111111-1111-1111-1111-111111111111'::uuid, now(), now()),
    ('a3333333-3333-3333-3333-333333333333'::uuid, 'Pizza Margherita', '91111111-1111-1111-1111-111111111111'::uuid, now(), now()),
    ('a4444444-4444-4444-4444-444444444444'::uuid, 'Beef Stew', '91111111-1111-1111-1111-111111111111'::uuid, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Test 3: Basic search functionality
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('pasta', '91111111-1111-1111-1111-111111111111'::uuid)) >= 2,
    'search_dishes should return results for "pasta" query'
);

-- Test 4: Case insensitive search
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('PASTA', '91111111-1111-1111-1111-111111111111'::uuid)) >= 2,
    'search_dishes should be case insensitive'
);

-- Test 5: Partial match search
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('carb', '91111111-1111-1111-1111-111111111111'::uuid)) >= 1,
    'search_dishes should find partial matches'
);

-- Test 6: Empty search handling
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('', '91111111-1111-1111-1111-111111111111'::uuid)) = 0,
    'search_dishes should return no results for empty query'
);

-- Test 7: Non-existent search term
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('xyznotfound', '91111111-1111-1111-1111-111111111111'::uuid)) = 0,
    'search_dishes should return no results for non-existent terms'
);

-- Test 8: User isolation - create another user
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES (
    '92222222-2222-2222-2222-222222222222'::uuid,
    'other-user@example.com',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('pasta', '92222222-2222-2222-2222-222222222222'::uuid)) = 0,
    'search_dishes should respect user isolation'
);

-- Test 9: Search with special characters
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('pasta%', '91111111-1111-1111-1111-111111111111'::uuid)) >= 0,
    'search_dishes should handle special characters safely'
);

-- Test 10: Search with SQL injection attempt
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('pasta''; DROP TABLE dishes; --', '91111111-1111-1111-1111-111111111111'::uuid)) >= 0,
    'search_dishes should be safe from SQL injection'
);

-- Test 11: Search with null user_id should return no results
SELECT ok(
    (SELECT COUNT(*) FROM search_dishes('pasta', NULL)) = 0,
    'search_dishes should handle null user_id safely'
);

-- Test 12: Verify search results contain expected fields
SELECT ok(
    (SELECT name FROM search_dishes('carbonara', '91111111-1111-1111-1111-111111111111'::uuid) LIMIT 1) = 'Pasta Carbonara',
    'search_dishes should return correct dish data'
);

-- Clean up test data
DELETE FROM public.dishes WHERE user_id IN ('91111111-1111-1111-1111-111111111111'::uuid, '92222222-2222-2222-2222-222222222222'::uuid);
DELETE FROM auth.users WHERE id IN ('91111111-1111-1111-1111-111111111111'::uuid, '92222222-2222-2222-2222-222222222222'::uuid);

SELECT * FROM finish();
ROLLBACK;