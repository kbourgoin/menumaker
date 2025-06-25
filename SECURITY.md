# Security Documentation

This document outlines security considerations and accepted exceptions in the MenuMaker application.

## Accepted Security Warnings

### 1. Security Definer View Warning (dish_summary_secure)

**Warning**: `security_definer_view` - View `public.dish_summary_secure` is defined with the SECURITY DEFINER property

**Status**: ✅ ACCEPTED - This is the correct implementation

**Rationale**:
The `dish_summary_secure` view uses SECURITY DEFINER to provide secure access to the `dish_summary` materialized view. This approach is acceptable and secure because:

1. **Proper Access Control**: The view filters results with `WHERE user_id = auth.uid()`, ensuring users can only access their own data
2. **Read-Only Access**: The view provides only SELECT access with no data modification capabilities
3. **Performance Benefits**: The underlying materialized view provides significant performance improvements over calculating aggregates on every query
4. **Restricted Direct Access**: Direct access to the materialized view is properly restricted to service_role only
5. **Standard Pattern**: This is the established PostgreSQL pattern for providing secure access to materialized views

**Alternative Approaches Evaluated**:
- Security Invoker Views: Resulted in 403 permission errors due to RLS complexity
- Function-based access: Incompatible with Supabase JavaScript client
- Direct view without materialized view: Significant performance degradation
- Separate materialized view: Would recreate the same security warning

**Implementation Details**:
```sql
-- The secure view filters by authenticated user
CREATE VIEW public.dish_summary_secure AS
SELECT * FROM public.dish_summary
WHERE user_id = auth.uid();

-- Direct access to materialized view is restricted
REVOKE SELECT ON public.dish_summary FROM anon, authenticated;
GRANT SELECT ON public.dish_summary_secure TO anon, authenticated;
```

**Monitoring**: This exception should be reviewed if:
- The view logic changes to include data modification
- Additional filtering or access patterns are added
- The underlying materialized view structure changes significantly

---

## Security Best Practices Implemented

### Row Level Security (RLS)
- Enabled on all core tables: `dishes`, `sources`, `meal_history`, `profiles`
- Policies ensure users can only access their own data
- Comprehensive CRUD policies for authenticated operations

### Function Security
- All database functions use `SET search_path = 'public'` to prevent search path injection
- Functions validate user ownership before data modification
- SECURITY DEFINER functions include proper access validation

### Authentication
- All routes except `/auth` require authentication
- Session management handled through Supabase Auth
- Automatic redirect for unauthenticated users

### Data Access Patterns
- Materialized views for performance with secure access wrappers
- Batch queries to avoid N+1 problems
- Proper fallback mechanisms for view access failures

---

*Last Updated: 2025-06-25*
*Next Review: When security warnings change or new database access patterns are added*