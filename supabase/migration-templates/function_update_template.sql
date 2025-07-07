-- Migration: Update [function_name] function
-- Description: [What changed and why]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Dependencies: [List any dependent migrations or "None"]
-- Breaking Changes: [List breaking changes or "None"]
-- Performance Impact: [Describe any performance implications]

-- Drop existing function if it exists (handle overloads carefully)
DROP FUNCTION IF EXISTS public.[function_name]([parameter_types]);

-- Create updated function
CREATE OR REPLACE FUNCTION public.[function_name]([parameters])
RETURNS [return_type]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    -- Declare variables here
    [variable_name] [type];
BEGIN
    -- Function implementation
    -- [Add your logic here]
    
    -- Example error handling
    -- IF [condition] THEN
    --     RAISE EXCEPTION 'Error message: %', [variable];
    -- END IF;
    
    -- Example return
    -- RETURN [value];
END;
$$;

-- Add function ownership
ALTER FUNCTION public.[function_name]([parameter_types]) OWNER TO postgres;

-- Add function comment
COMMENT ON FUNCTION public.[function_name]([parameter_types]) IS 
'[Detailed description of function purpose, parameters, and return value]';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.[function_name]([parameter_types]) TO anon;
GRANT EXECUTE ON FUNCTION public.[function_name]([parameter_types]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.[function_name]([parameter_types]) TO service_role;

-- Example usage comments
-- Usage example:
-- SELECT public.[function_name]([example_parameters]);

-- Performance notes:
-- [Add any performance considerations or indexing requirements]