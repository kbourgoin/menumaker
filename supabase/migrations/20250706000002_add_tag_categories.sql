-- Migration: Add category and color fields to tags table
-- Description: Enables the hybrid cuisine-tag system for better categorization
-- Date: 2025-07-06

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