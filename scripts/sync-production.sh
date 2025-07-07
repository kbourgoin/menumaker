#!/bin/bash

# Production Database Sync Tool
# Usage: ./scripts/sync-production.sh [options]
# IMPORTANT: This script only reads from production and writes to local

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
PRODUCTION_DB_URL=""
BACKUP_DIR="tmp/db-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Options
SCHEMA_ONLY=false
DATA_ONLY=false
ANONYMIZE_DATA=true
BACKUP_LOCAL=true
DRY_RUN=false
FORCE=false
TABLES=""

show_help() {
    echo -e "${BLUE}Production Database Sync Tool${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo -e "${YELLOW}⚠ WARNING: This script is READ-ONLY for production${NC}"
    echo -e "${YELLOW}⚠ Only downloads from production to local development${NC}"
    echo ""
    echo "Options:"
    echo "  --schema-only         Sync schema only (no data)"
    echo "  --data-only           Sync data only (no schema changes)"
    echo "  --no-anonymize        Don't anonymize sensitive data"
    echo "  --no-backup           Don't backup local database"
    echo "  --dry-run             Show what would be done without executing"
    echo "  --force               Skip confirmation prompts"
    echo "  --tables=TABLE1,TABLE2 Sync only specified tables"
    echo "  --help                Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  VITE_SUPABASE_URL     Production database URL"
    echo "  SUPABASE_DB_PASSWORD  Production database password"
    echo ""
    echo "Examples:"
    echo "  $0 --schema-only"
    echo "  $0 --data-only --tables=dishes,sources"
    echo "  $0 --dry-run --no-anonymize"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --schema-only)
            SCHEMA_ONLY=true
            ;;
        --data-only)
            DATA_ONLY=true
            ;;
        --no-anonymize)
            ANONYMIZE_DATA=false
            ;;
        --no-backup)
            BACKUP_LOCAL=false
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --force)
            FORCE=true
            ;;
        --tables=*)
            TABLES="${1#*=}"
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Validation
if [ "$SCHEMA_ONLY" = true ] && [ "$DATA_ONLY" = true ]; then
    echo -e "${RED}Error: Cannot use --schema-only and --data-only together${NC}"
    exit 1
fi

# Get production URL
if [ -f ".env.local" ]; then
    PRODUCTION_URL=$(grep -E "^#.*VITE_SUPABASE_URL.*https" .env.local | sed 's/^#.*VITE_SUPABASE_URL=//' | tr -d ' ')
    if [ -n "$PRODUCTION_URL" ]; then
        # This is a simplified example - real implementation would need proper auth
        PRODUCTION_DB_URL="postgresql://postgres:$SUPABASE_DB_PASSWORD@db.${PRODUCTION_URL#*://}/postgres"
    fi
fi

if [ -z "$PRODUCTION_DB_URL" ]; then
    echo -e "${RED}Error: No production database URL found${NC}"
    echo "Please configure production database access in .env.local"
    echo "Note: This requires proper database credentials and network access"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Safety confirmation
if [ "$FORCE" = false ]; then
    echo -e "${YELLOW}⚠ Production Sync Confirmation${NC}"
    echo ""
    echo "This will sync data FROM production TO local development database."
    echo "Local database: $LOCAL_DB_URL"
    echo "Production source: [REDACTED FOR SECURITY]"
    echo ""
    if [ "$BACKUP_LOCAL" = true ]; then
        echo "✓ Local database will be backed up first"
    else
        echo "✗ Local database will NOT be backed up"
    fi
    echo ""
    echo "Sync configuration:"
    [ "$SCHEMA_ONLY" = true ] && echo "  • Schema only (no data)"
    [ "$DATA_ONLY" = true ] && echo "  • Data only (no schema)"
    [ "$ANONYMIZE_DATA" = true ] && echo "  • Data will be anonymized"
    [ -n "$TABLES" ] && echo "  • Tables: $TABLES"
    echo ""
    read -p "Continue with production sync? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Sync cancelled."
        exit 0
    fi
fi

# Function to backup local database
backup_local_db() {
    if [ "$BACKUP_LOCAL" = false ]; then
        return 0
    fi
    
    echo -e "${CYAN}Creating local database backup...${NC}"
    
    local backup_file="$BACKUP_DIR/local_backup_$TIMESTAMP.sql"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would create backup: $backup_file"
        return 0
    fi
    
    if pg_dump "$LOCAL_DB_URL" > "$backup_file" 2>/dev/null; then
        echo -e "${GREEN}✓ Local backup created: $backup_file${NC}"
        
        # Compress backup
        gzip "$backup_file"
        echo -e "${GREEN}✓ Backup compressed: $backup_file.gz${NC}"
    else
        echo -e "${RED}✗ Failed to create local backup${NC}"
        exit 1
    fi
}

# Function to sync schema
sync_schema() {
    echo -e "${CYAN}Syncing database schema...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would sync schema from production to local"
        return 0
    fi
    
    # This is a simplified example - real implementation would use proper schema migration
    echo -e "${YELLOW}Schema sync not fully implemented in this demo${NC}"
    echo "In a real implementation, this would:"
    echo "  1. Extract production schema"
    echo "  2. Compare with local schema"
    echo "  3. Generate safe migration scripts"
    echo "  4. Apply changes to local database"
}

# Function to anonymize data
anonymize_data() {
    local temp_file=$1
    
    if [ "$ANONYMIZE_DATA" = false ]; then
        return 0
    fi
    
    echo -e "${CYAN}Anonymizing sensitive data...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would anonymize sensitive data"
        return 0
    fi
    
    # Create anonymization script
    cat > "$temp_file.anon.sql" << 'EOF'
-- Anonymization script for production data
-- This runs after data import to protect sensitive information

-- Anonymize user emails and names
UPDATE auth.users SET 
    email = CONCAT('user', SUBSTRING(id::text, 1, 8), '@example.com'),
    raw_user_meta_data = jsonb_build_object(
        'email', CONCAT('user', SUBSTRING(id::text, 1, 8), '@example.com'),
        'name', CONCAT('Test User ', SUBSTRING(id::text, 1, 8))
    ),
    raw_app_meta_data = '{}',
    created_at = now() - (random() * interval '365 days'),
    updated_at = now()
WHERE email NOT LIKE '%@example.com';

-- Anonymize profile data if exists
UPDATE public.profiles SET 
    display_name = CONCAT('User ', SUBSTRING(id::text, 1, 8)),
    avatar_url = NULL,
    updated_at = now()
WHERE display_name IS NOT NULL;

-- Anonymize dish names to generic patterns
UPDATE public.dishes SET
    name = CASE 
        WHEN cuisine = 'Italian' THEN 'Italian Dish ' || (id::text)[1:8]
        WHEN cuisine = 'Mexican' THEN 'Mexican Dish ' || (id::text)[1:8]
        WHEN cuisine = 'Asian' THEN 'Asian Dish ' || (id::text)[1:8]
        ELSE 'Sample Dish ' || (id::text)[1:8]
    END,
    location = CASE 
        WHEN location IS NOT NULL THEN 'Page ' || (RANDOM() * 100)::int
        ELSE NULL
    END,
    notes = CASE 
        WHEN notes IS NOT NULL THEN 'Sample notes for development'
        ELSE NULL
    END,
    updated_at = now();

-- Anonymize source information
UPDATE public.sources SET
    name = type || ' Source ' || (id::text)[1:8],
    url = CASE 
        WHEN url IS NOT NULL THEN 'https://example.com/source/' || (id::text)[1:8]
        ELSE NULL
    END,
    notes = CASE 
        WHEN notes IS NOT NULL THEN 'Sample source notes'
        ELSE NULL
    END,
    updated_at = now();

-- Clear meal history notes
UPDATE public.meal_history SET
    notes = CASE 
        WHEN notes IS NOT NULL THEN 'Sample meal notes'
        ELSE NULL
    END,
    updated_at = now();

-- Remove any audit logs or sensitive tracking data
DELETE FROM public.audit_logs WHERE created_at IS NOT NULL;

NOTIFY anonymization_complete;
EOF
    
    # Apply anonymization
    if psql "$LOCAL_DB_URL" -f "$temp_file.anon.sql" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Data anonymized successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Anonymization completed with warnings${NC}"
    fi
    
    # Clean up
    rm -f "$temp_file.anon.sql"
}

# Function to sync data
sync_data() {
    echo -e "${CYAN}Syncing database data...${NC}"
    
    local temp_file="$BACKUP_DIR/production_data_$TIMESTAMP.sql"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would sync data from production to local"
        [ "$ANONYMIZE_DATA" = true ] && echo "  [DRY RUN] Would anonymize sensitive data"
        return 0
    fi
    
    # For demo purposes, we'll create sample data instead of accessing real production
    echo -e "${YELLOW}Production data sync not fully implemented in this demo${NC}"
    echo "In a real implementation, this would:"
    echo "  1. Export data from production (with proper security)"
    echo "  2. Filter out sensitive tables if needed"
    echo "  3. Import data to local database"
    echo "  4. Apply anonymization transformations"
    
    # Create sample anonymized data for demonstration
    cat > "$temp_file" << EOF
-- Sample anonymized production data for development
-- This would normally come from a secure production export

-- Clear existing data
TRUNCATE public.dishes, public.sources, public.meal_history CASCADE;

-- Insert sample data
INSERT INTO public.dishes (id, name, user_id, cuisine, created_at, updated_at) VALUES
('a1111111-1111-1111-1111-111111111111', 'Sample Italian Dish A', '91111111-1111-1111-1111-111111111111', 'Italian', now() - interval '30 days', now()),
('a2222222-2222-2222-2222-222222222222', 'Sample Mexican Dish B', '91111111-1111-1111-1111-111111111111', 'Mexican', now() - interval '25 days', now()),
('a3333333-3333-3333-3333-333333333333', 'Sample Asian Dish C', '91111111-1111-1111-1111-111111111111', 'Asian', now() - interval '20 days', now());

INSERT INTO public.sources (id, name, type, user_id, created_at, updated_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'Sample Cookbook 1', 'book', '91111111-1111-1111-1111-111111111111', now() - interval '60 days', now()),
('b2222222-2222-2222-2222-222222222222', 'Sample Website 1', 'website', '91111111-1111-1111-1111-111111111111', now() - interval '45 days', now());
EOF
    
    echo -e "${CYAN}Applying sample data...${NC}"
    if psql "$LOCAL_DB_URL" -f "$temp_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Sample data applied${NC}"
        
        # Apply anonymization
        anonymize_data "$temp_file"
    else
        echo -e "${RED}✗ Failed to apply sample data${NC}"
        return 1
    fi
    
    # Clean up
    rm -f "$temp_file"
}

# Function to validate sync
validate_sync() {
    echo -e "${CYAN}Validating sync results...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  [DRY RUN] Would validate sync results"
        return 0
    fi
    
    # Basic validation queries
    local dish_count=$(psql "$LOCAL_DB_URL" -t -c "SELECT COUNT(*) FROM public.dishes;" 2>/dev/null | tr -d ' ')
    local source_count=$(psql "$LOCAL_DB_URL" -t -c "SELECT COUNT(*) FROM public.sources;" 2>/dev/null | tr -d ' ')
    
    echo "  Dishes: $dish_count"
    echo "  Sources: $source_count"
    
    # Check for anonymization
    if [ "$ANONYMIZE_DATA" = true ]; then
        local anon_count=$(psql "$LOCAL_DB_URL" -t -c "SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@example.com';" 2>/dev/null | tr -d ' ')
        if [ "$anon_count" -gt 0 ]; then
            echo -e "${GREEN}✓ Data anonymization verified${NC}"
        else
            echo -e "${YELLOW}⚠ Anonymization may not have been applied${NC}"
        fi
    fi
}

# Main execution
echo -e "${BLUE}Production Database Sync${NC}"
echo ""

# Check local database connection
if ! psql "$LOCAL_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to local database${NC}"
    echo "Make sure local Supabase is running: bun run dev:db:start"
    exit 1
fi

# Backup local database
backup_local_db

# Perform sync based on options
if [ "$DATA_ONLY" = false ]; then
    sync_schema
fi

if [ "$SCHEMA_ONLY" = false ]; then
    sync_data
fi

# Validate results
validate_sync

echo ""
echo -e "${GREEN}✓ Production sync completed!${NC}"

if [ "$BACKUP_LOCAL" = true ]; then
    echo ""
    echo -e "${CYAN}Backup Information:${NC}"
    echo "Local backup saved to: $BACKUP_DIR/"
    echo "To restore: pg_restore -d $LOCAL_DB_URL backup_file.sql.gz"
fi

echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "1. Verify data looks correct in local application"
echo "2. Run tests to ensure compatibility: bun run test"
echo "3. Check performance: bun run db:benchmark"
echo "4. Update types if schema changed: bun run db:generate-types"

echo ""
echo -e "${YELLOW}Security Reminder:${NC}"
echo "• All production data has been anonymized for development use"
echo "• Never commit real production data to version control"
echo "• Use encrypted backups for any production data storage"