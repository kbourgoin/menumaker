#!/bin/bash

# Migration validation script
# Usage: ./scripts/validate-migration.sh [migration-file]

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MIGRATION_DIR="supabase/migrations"

show_help() {
    echo -e "${BLUE}Migration Validation Script${NC}"
    echo ""
    echo "Usage: $0 [migration-file]"
    echo ""
    echo "If no file specified, validates all migrations in $MIGRATION_DIR"
    echo ""
    echo "Validation checks:"
    echo "  - SQL syntax validation"
    echo "  - Migration naming convention"
    echo "  - Required metadata presence"
    echo "  - Common anti-patterns"
    echo "  - RLS policy requirements"
    echo ""
}

# Validate single migration file
validate_migration() {
    local file=$1
    local filename=$(basename "$file")
    local errors=0
    local warnings=0
    
    echo -e "${BLUE}Validating: $filename${NC}"
    
    # Check naming convention
    if [[ ! $filename =~ ^[0-9]{8}_[0-9]{6}_[a-z0-9_]+\.sql$ ]]; then
        echo -e "${RED}✗ Naming convention error${NC}: Should match YYYYMMDD_HHMMSS_description.sql"
        ((errors++))
    else
        echo -e "${GREEN}✓ Naming convention${NC}"
    fi
    
    # Check file exists and is readable
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ File not found: $file${NC}"
        ((errors++))
        return $errors
    fi
    
    # Check SQL syntax (basic)
    if ! psql -d "postgresql://postgres:postgres@localhost:54322/postgres" -f "$file" --single-transaction --set ON_ERROR_STOP=1 -o /dev/null 2>/dev/null; then
        echo -e "${YELLOW}⚠ SQL syntax check failed${NC}: Run against local database to verify"
        ((warnings++))
    else
        echo -e "${GREEN}✓ SQL syntax valid${NC}"
    fi
    
    # Check required metadata
    local content=$(cat "$file")
    
    if [[ $content != *"-- Migration:"* ]]; then
        echo -e "${RED}✗ Missing migration header${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ Migration header present${NC}"
    fi
    
    if [[ $content != *"-- Description:"* ]]; then
        echo -e "${RED}✗ Missing description${NC}"
        ((errors++))
    else
        echo -e "${GREEN}✓ Description present${NC}"
    fi
    
    if [[ $content != *"-- Author:"* ]]; then
        echo -e "${YELLOW}⚠ Missing author${NC}"
        ((warnings++))
    else
        echo -e "${GREEN}✓ Author present${NC}"
    fi
    
    # Check for common anti-patterns
    if [[ $content == *"DROP TABLE"* ]] && [[ $content != *"IF EXISTS"* ]]; then
        echo -e "${RED}✗ Unsafe DROP TABLE${NC}: Use 'DROP TABLE IF EXISTS'"
        ((errors++))
    fi
    
    if [[ $content == *"ALTER TABLE"* ]] && [[ $content == *"DROP COLUMN"* ]] && [[ $content != *"IF EXISTS"* ]]; then
        echo -e "${YELLOW}⚠ Potentially unsafe column drop${NC}: Consider using IF EXISTS"
        ((warnings++))
    fi
    
    # Check RLS for new tables
    if [[ $content == *"CREATE TABLE"* ]]; then
        if [[ $content != *"ENABLE ROW LEVEL SECURITY"* ]]; then
            echo -e "${YELLOW}⚠ New table without RLS${NC}: Consider enabling row level security"
            ((warnings++))
        else
            echo -e "${GREEN}✓ RLS enabled for new table${NC}"
        fi
        
        if [[ $content != *"CREATE POLICY"* ]]; then
            echo -e "${YELLOW}⚠ New table without policies${NC}: Consider adding RLS policies"
            ((warnings++))
        else
            echo -e "${GREEN}✓ RLS policies present${NC}"
        fi
    fi
    
    # Check for user_id foreign key in new tables
    if [[ $content == *"CREATE TABLE"* ]] && [[ $content != *"user_id"* ]]; then
        echo -e "${YELLOW}⚠ New table without user_id${NC}: Consider adding user association"
        ((warnings++))
    fi
    
    # Check for indexes on foreign keys
    if [[ $content == *"REFERENCES"* ]] && [[ $content != *"CREATE INDEX"* ]]; then
        echo -e "${YELLOW}⚠ Foreign key without index${NC}: Consider adding index for performance"
        ((warnings++))
    fi
    
    # Summary
    echo ""
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✓ Validation passed${NC} ($warnings warnings)"
    else
        echo -e "${RED}✗ Validation failed${NC} ($errors errors, $warnings warnings)"
    fi
    
    echo ""
    return $errors
}

# Main script
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

total_errors=0

if [ $# -eq 0 ]; then
    # Validate all migrations
    echo -e "${BLUE}Validating all migrations in $MIGRATION_DIR${NC}"
    echo ""
    
    if [ ! -d "$MIGRATION_DIR" ]; then
        echo -e "${RED}Error: Migration directory not found: $MIGRATION_DIR${NC}"
        exit 1
    fi
    
    for file in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$file" ]; then
            validate_migration "$file"
            total_errors=$((total_errors + $?))
        fi
    done
    
    echo -e "${BLUE}Overall validation summary:${NC}"
    if [ $total_errors -eq 0 ]; then
        echo -e "${GREEN}✓ All migrations passed validation${NC}"
    else
        echo -e "${RED}✗ $total_errors migration(s) failed validation${NC}"
    fi
    
else
    # Validate specific file
    if [[ "$1" != /* ]] && [[ "$1" != ./* ]]; then
        # Relative path, assume it's in migrations directory
        MIGRATION_FILE="$MIGRATION_DIR/$1"
    else
        MIGRATION_FILE="$1"
    fi
    
    validate_migration "$MIGRATION_FILE"
    total_errors=$?
fi

exit $total_errors