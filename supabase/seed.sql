-- Development Seed Data for MenuMaker
-- This file creates realistic sample data for local development and testing

-- Insert test users into auth.users (for local development)
-- Note: In production, users are created through Supabase Auth
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'authenticated',
    'authenticated',
    'test@menumaker.dev',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    FALSE,
    '',
    '',
    '',
    ''
), (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'authenticated',
    'authenticated',
    'chef@menumaker.dev',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Chef Marie"}',
    FALSE,
    '',
    '',
    '',
    ''
);

-- Create user profiles
INSERT INTO profiles (id, username, avatar_url, cuisines) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'testuser', null, 
     '{"Italian","Mexican","American","Asian","Mediterranean","Indian","French","Greek","Thai","Japanese","Chinese","Korean","Middle Eastern","Vietnamese","Spanish","Caribbean","German","British","Fusion","Other"}'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'chefmarie', null, 
     '{"French","Italian","Mediterranean","American","Asian","Fusion"}');

-- Create sample sources (cookbooks and websites)
INSERT INTO sources (id, user_id, name, type, description, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 
     'Joy of Cooking', 'book', 'Classic American cookbook with comprehensive recipes', NOW()),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 
     'Serious Eats', 'website', 'Food science and recipe development website', NOW()),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 
     'Salt, Fat, Acid, Heat', 'book', 'Samin Nosrat cookbook focusing on cooking fundamentals', NOW()),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 
     'Family Recipe', 'book', 'Traditional family recipes passed down', NOW()),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 
     'Le Cordon Bleu', 'book', 'French culinary techniques and recipes', NOW()),
    ('66666666-6666-6666-6666-666666666666'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 
     'NYT Cooking', 'website', 'New York Times cooking section with tested recipes', NOW());

-- Create cuisine and general tags
INSERT INTO tags (id, name, user_id, description, category, color, created_at) VALUES
    -- Cuisine tags for first user
    ('c1111111-1111-1111-1111-111111111111'::uuid, 'Italian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Italian cuisine', 'cuisine', 'bg-red-100 text-red-800', NOW()),
    ('c2222222-2222-2222-2222-222222222222'::uuid, 'Mexican', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Mexican cuisine', 'cuisine', 'bg-orange-100 text-orange-800', NOW()),
    ('c3333333-3333-3333-3333-333333333333'::uuid, 'Asian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Asian cuisine', 'cuisine', 'bg-yellow-100 text-yellow-800', NOW()),
    ('c4444444-4444-4444-4444-444444444444'::uuid, 'American', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'American cuisine', 'cuisine', 'bg-blue-100 text-blue-800', NOW()),
    ('c5555555-5555-5555-5555-555555555555'::uuid, 'French', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'French cuisine', 'cuisine', 'bg-purple-100 text-purple-800', NOW()),
    ('c6666666-6666-6666-6666-666666666666'::uuid, 'Mediterranean', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Mediterranean cuisine', 'cuisine', 'bg-green-100 text-green-800', NOW()),
    -- General tags for first user
    ('91111111-1111-1111-1111-111111111111'::uuid, 'Quick', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Quick and easy recipes under 30 minutes', 'general', null, NOW()),
    ('92222222-2222-2222-2222-222222222222'::uuid, 'Comfort Food', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Hearty, satisfying comfort foods', 'general', null, NOW()),
    ('93333333-3333-3333-3333-333333333333'::uuid, 'Vegetarian', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Vegetarian-friendly recipes', 'general', null, NOW()),
    ('94444444-4444-4444-4444-444444444444'::uuid, 'Spicy', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Recipes with heat and spice', 'general', null, NOW()),
    ('95555555-5555-5555-5555-555555555555'::uuid, 'Healthy', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Nutritious and health-conscious recipes', 'general', null, NOW()),
    -- Tags for second user (chef)
    ('c7777777-7777-7777-7777-777777777777'::uuid, 'French', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'French cuisine', 'cuisine', 'bg-purple-100 text-purple-800', NOW()),
    ('96666666-6666-6666-6666-666666666666'::uuid, 'Advanced', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Complex techniques and recipes', 'general', null, NOW());

-- Create sample dishes
INSERT INTO dishes (id, name, createdat, cuisines, user_id, source_id, location) VALUES
    -- Italian dishes
    ('d1111111-1111-1111-1111-111111111111'::uuid, 'Spaghetti Carbonara', NOW() - INTERVAL '30 days', '{"Italian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Page 142'),
    ('d2222222-2222-2222-2222-222222222222'::uuid, 'Margherita Pizza', NOW() - INTERVAL '25 days', '{"Italian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, null),
    ('d3333333-3333-3333-3333-333333333333'::uuid, 'Chicken Parmigiana', NOW() - INTERVAL '20 days', '{"Italian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Page 287'),
    -- Mexican dishes
    ('d4444444-4444-4444-4444-444444444444'::uuid, 'Beef Tacos', NOW() - INTERVAL '15 days', '{"Mexican"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, null),
    ('d5555555-5555-5555-5555-555555555555'::uuid, 'Chicken Enchiladas', NOW() - INTERVAL '18 days', '{"Mexican"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, null),
    -- Asian dishes
    ('d6666666-6666-6666-6666-666666666666'::uuid, 'Chicken Teriyaki', NOW() - INTERVAL '12 days', '{"Asian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, null),
    ('d7777777-7777-7777-7777-777777777777'::uuid, 'Pad Thai', NOW() - INTERVAL '22 days', '{"Asian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Page 445'),
    -- American dishes
    ('d8888888-8888-8888-8888-888888888888'::uuid, 'Classic Burger', NOW() - INTERVAL '8 days', '{"American"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, null),
    ('d9999999-9999-9999-9999-999999999999'::uuid, 'Mac and Cheese', NOW() - INTERVAL '14 days', '{"American"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Page 201'),
    -- French dishes for chef user
    ('da111111-1111-1111-1111-111111111111'::uuid, 'Coq au Vin', NOW() - INTERVAL '5 days', '{"French"}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'Page 89'),
    -- More dishes for variety
    ('db111111-1111-1111-1111-111111111111'::uuid, 'Greek Salad', NOW() - INTERVAL '3 days', '{"Mediterranean"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Page 67'),
    ('dc111111-1111-1111-1111-111111111111'::uuid, 'Chicken Curry', NOW() - INTERVAL '6 days', '{"Asian"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, null);

-- Create dish-tag relationships
INSERT INTO dish_tags (dish_id, tag_id, created_at) VALUES
    -- Spaghetti Carbonara
    ('d1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, NOW()),
    ('d1111111-1111-1111-1111-111111111111'::uuid, '91111111-1111-1111-1111-111111111111'::uuid, NOW()),
    -- Margherita Pizza
    ('d2222222-2222-2222-2222-222222222222'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, NOW()),
    ('d2222222-2222-2222-2222-222222222222'::uuid, '93333333-3333-3333-3333-333333333333'::uuid, NOW()),
    -- Chicken Parmigiana
    ('d3333333-3333-3333-3333-333333333333'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, NOW()),
    ('d3333333-3333-3333-3333-333333333333'::uuid, '92222222-2222-2222-2222-222222222222'::uuid, NOW()),
    -- Beef Tacos
    ('d4444444-4444-4444-4444-444444444444'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, NOW()),
    ('d4444444-4444-4444-4444-444444444444'::uuid, '91111111-1111-1111-1111-111111111111'::uuid, NOW()),
    ('d4444444-4444-4444-4444-444444444444'::uuid, '94444444-4444-4444-4444-444444444444'::uuid, NOW()),
    -- Chicken Enchiladas
    ('d5555555-5555-5555-5555-555555555555'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, NOW()),
    ('d5555555-5555-5555-5555-555555555555'::uuid, '92222222-2222-2222-2222-222222222222'::uuid, NOW()),
    -- Chicken Teriyaki
    ('d6666666-6666-6666-6666-666666666666'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, NOW()),
    ('d6666666-6666-6666-6666-666666666666'::uuid, '91111111-1111-1111-1111-111111111111'::uuid, NOW()),
    ('d6666666-6666-6666-6666-666666666666'::uuid, '95555555-5555-5555-5555-555555555555'::uuid, NOW()),
    -- Pad Thai
    ('d7777777-7777-7777-7777-777777777777'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, NOW()),
    ('d7777777-7777-7777-7777-777777777777'::uuid, '94444444-4444-4444-4444-444444444444'::uuid, NOW()),
    -- Classic Burger
    ('d8888888-8888-8888-8888-888888888888'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, NOW()),
    ('d8888888-8888-8888-8888-888888888888'::uuid, '92222222-2222-2222-2222-222222222222'::uuid, NOW()),
    -- Mac and Cheese
    ('d9999999-9999-9999-9999-999999999999'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, NOW()),
    ('d9999999-9999-9999-9999-999999999999'::uuid, '92222222-2222-2222-2222-222222222222'::uuid, NOW()),
    ('d9999999-9999-9999-9999-999999999999'::uuid, '93333333-3333-3333-3333-333333333333'::uuid, NOW()),
    -- Coq au Vin
    ('da111111-1111-1111-1111-111111111111'::uuid, 'c7777777-7777-7777-7777-777777777777'::uuid, NOW()),
    ('da111111-1111-1111-1111-111111111111'::uuid, '96666666-6666-6666-6666-666666666666'::uuid, NOW()),
    -- Greek Salad
    ('db111111-1111-1111-1111-111111111111'::uuid, 'c6666666-6666-6666-6666-666666666666'::uuid, NOW()),
    ('db111111-1111-1111-1111-111111111111'::uuid, '93333333-3333-3333-3333-333333333333'::uuid, NOW()),
    ('db111111-1111-1111-1111-111111111111'::uuid, '95555555-5555-5555-5555-555555555555'::uuid, NOW()),
    -- Chicken Curry
    ('dc111111-1111-1111-1111-111111111111'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, NOW()),
    ('dc111111-1111-1111-1111-111111111111'::uuid, '94444444-4444-4444-4444-444444444444'::uuid, NOW());

-- Create meal history (cooking records)
INSERT INTO meal_history (id, dishid, date, notes, user_id) VALUES
    -- Recent meals (last 2 weeks)
    ('81111111-1111-1111-1111-111111111111'::uuid, 'd8888888-8888-8888-8888-888888888888'::uuid, NOW() - INTERVAL '1 days', 'Perfect patty, added extra pickles', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('82222222-2222-2222-2222-222222222222'::uuid, 'dc111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '2 days', 'Spice level was just right', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('83333333-3333-3333-3333-333333333333'::uuid, 'db111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '3 days', 'Fresh vegetables, great for summer', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('84444444-4444-4444-4444-444444444444'::uuid, 'da111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '1 days', 'Classic preparation, wine reduction perfect', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid),
    ('85555555-5555-5555-5555-555555555555'::uuid, 'd6666666-6666-6666-6666-666666666666'::uuid, NOW() - INTERVAL '4 days', 'Quick weeknight dinner', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('86666666-6666-6666-6666-666666666666'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '5 days', 'Family taco night, kids loved it', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    
    -- Older meal history for analytics
    ('87777777-7777-7777-7777-777777777777'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '8 days', 'Classic comfort food', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('88888888-8888-8888-8888-888888888888'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '15 days', 'Made with pancetta instead of guanciale', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('89999999-9999-9999-9999-999999999999'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, NOW() - INTERVAL '22 days', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8a111111-1111-1111-1111-111111111111'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '12 days', 'Homemade dough, crispy crust', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8b111111-1111-1111-1111-111111111111'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, NOW() - INTERVAL '20 days', 'Store-bought dough this time', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8c111111-1111-1111-1111-111111111111'::uuid, 'd9999999-9999-9999-9999-999999999999'::uuid, NOW() - INTERVAL '14 days', 'Added breadcrumb topping', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8d111111-1111-1111-1111-111111111111'::uuid, 'd7777777-7777-7777-7777-777777777777'::uuid, NOW() - INTERVAL '18 days', 'Used fresh tamarind paste', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8e111111-1111-1111-1111-111111111111'::uuid, 'd6666666-6666-6666-6666-666666666666'::uuid, NOW() - INTERVAL '25 days', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('8f111111-1111-1111-1111-111111111111'::uuid, 'd5555555-5555-5555-5555-555555555555'::uuid, NOW() - INTERVAL '16 days', 'Made extra for leftovers', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
    ('80111111-1111-1111-1111-111111111111'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '28 days', 'First time making from scratch', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);

-- Refresh the materialized view to include all the seeded data
-- The materialized view was created WITH NO DATA, so we need to populate it
REFRESH MATERIALIZED VIEW dish_summary;