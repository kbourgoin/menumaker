-- Migration: Add [table_name] table
-- Description: [Purpose and business logic]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Dependencies: [List any dependent migrations or "None"]
-- Breaking Changes: [List breaking changes or "None"]

-- Create table with standard columns
CREATE TABLE IF NOT EXISTS public.[table_name] (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    
    -- Add your custom columns here
    -- name TEXT NOT NULL,
    -- description TEXT,
    -- status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Add table ownership
ALTER TABLE public.[table_name] OWNER TO postgres;

-- Enable Row Level Security
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "[table_name]_user_select" ON public.[table_name]
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_user_insert" ON public.[table_name]
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "[table_name]_user_update" ON public.[table_name]
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_user_delete" ON public.[table_name]
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_[table_name]_user_id ON public.[table_name](user_id);
CREATE INDEX idx_[table_name]_created_at ON public.[table_name](created_at DESC);

-- Add any additional indexes
-- CREATE INDEX idx_[table_name]_status ON public.[table_name](status) WHERE status = 'active';

-- Add table and column comments
COMMENT ON TABLE public.[table_name] IS '[Business purpose and usage description]';
COMMENT ON COLUMN public.[table_name].user_id IS 'References the user who owns this record';

-- Grant permissions
GRANT ALL ON TABLE public.[table_name] TO anon;
GRANT ALL ON TABLE public.[table_name] TO authenticated;
GRANT ALL ON TABLE public.[table_name] TO service_role;

-- Add trigger for updated_at timestamp (optional)
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = timezone('utc'::text, now());
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_[table_name]_updated_at 
--     BEFORE UPDATE ON public.[table_name]
--     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();