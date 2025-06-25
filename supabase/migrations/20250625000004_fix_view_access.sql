-- Fix access to dish_summary_secure view with security_invoker = true
-- The issue is that security_invoker views require the user to have direct access to underlying tables

-- Grant SELECT permission on dish_summary to authenticated users
-- This is needed because security_invoker views check the caller's permissions
GRANT SELECT ON public.dish_summary TO authenticated;

-- Ensure the secure view still has proper permissions
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;