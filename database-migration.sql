-- Migration: Add category and color fields to tags table
-- This enables the hybrid cuisine-tag system

-- Add category column to tags table
ALTER TABLE tags 
ADD COLUMN category TEXT NOT NULL DEFAULT 'general' 
CHECK (category IN ('cuisine', 'general'));

-- Add color column to tags table (for cuisine tags)
ALTER TABLE tags 
ADD COLUMN color TEXT;

-- Create index on category for better query performance
CREATE INDEX idx_tags_category ON tags(category);

-- Create composite index for user_id + category lookups
CREATE INDEX idx_tags_user_category ON tags(user_id, category);

-- Add comment for documentation
COMMENT ON COLUMN tags.category IS 'Type of tag: cuisine for cooking styles, general for other categorization';
COMMENT ON COLUMN tags.color IS 'CSS color classes for visual styling (primarily used for cuisine tags)';

-- Update any existing tags to have explicit category
-- (This should be safe since new installs won't have existing tags)
UPDATE tags SET category = 'general' WHERE category IS NULL;

-- Example of how to manually create some default cuisine tags (optional)
-- You can run this separately if you want to seed some cuisine tags:
/*
INSERT INTO tags (name, category, color, user_id) VALUES 
  ('Italian', 'cuisine', 'bg-red-50 text-red-700 border-red-200', 'your-user-id'),
  ('Mexican', 'cuisine', 'bg-green-50 text-green-700 border-green-200', 'your-user-id'),
  ('American', 'cuisine', 'bg-blue-50 text-blue-700 border-blue-200', 'your-user-id'),
  ('Asian', 'cuisine', 'bg-purple-50 text-purple-700 border-purple-200', 'your-user-id'),
  ('Other', 'cuisine', 'bg-stone-50 text-stone-700 border-stone-200', 'your-user-id');
*/