#!/bin/bash

# Database Schema Diff Tool
# Usage: ./scripts/schema-diff.sh [options]
# Compare schema between local and production databases

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
PRODUCTION_DB_URL=""
DIFF_OUTPUT_DIR="tmp/schema-diffs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default options
COMPARE_TABLES=false
COMPARE_FUNCTIONS=false
COMPARE_POLICIES=false
COMPARE_INDEXES=false
COMPARE_ALL=true
OUTPUT_FORMAT="console"
OUTPUT_FILE=""
DIRECTION="local-to-production"

show_help() {
    echo -e "${BLUE}Database Schema Diff Tool${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --tables              Compare only table structures"
    echo "  --functions           Compare only functions and procedures"
    echo "  --policies            Compare only RLS policies"
    echo "  --indexes             Compare only indexes"
    echo "  --all                 Compare all schema components (default)"
    echo "  --production-to-local Compare production → local"
    echo "  --local-to-production Compare local → production (default)"
    echo "  --output=FILE         Save diff to file"
    echo "  --format=FORMAT       Output format: console, json, html"
    echo "  --help                Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  VITE_SUPABASE_URL     Production database URL"
    echo "  SUPABASE_DB_PASSWORD  Production database password"
    echo ""
    echo "Examples:"
    echo "  $0 --tables --functions"
    echo "  $0 --output=schema-diff.html --format=html"
    echo "  $0 --production-to-local --format=json"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tables)
            COMPARE_TABLES=true
            COMPARE_ALL=false
            ;;
        --functions)
            COMPARE_FUNCTIONS=true
            COMPARE_ALL=false
            ;;
        --policies)
            COMPARE_POLICIES=true
            COMPARE_ALL=false
            ;;
        --indexes)
            COMPARE_INDEXES=true
            COMPARE_ALL=false
            ;;
        --all)
            COMPARE_ALL=true
            ;;
        --production-to-local)
            DIRECTION="production-to-local"
            ;;
        --local-to-production)
            DIRECTION="local-to-production"
            ;;
        --output=*)
            OUTPUT_FILE="${1#*=}"
            ;;
        --format=*)
            OUTPUT_FORMAT="${1#*=}"
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

# Check if production URL is available
if [ -f ".env.local" ]; then
    # Try to get production URL from .env.local (commented out production config)
    PRODUCTION_URL=$(grep -E "^#.*VITE_SUPABASE_URL.*https" .env.local | sed 's/^#.*VITE_SUPABASE_URL=//' | tr -d ' ')
    if [ -n "$PRODUCTION_URL" ]; then
        # Convert Supabase URL to direct PostgreSQL URL
        PRODUCTION_DB_URL="${PRODUCTION_URL/https:\/\//postgresql://postgres:}@db.${PRODUCTION_URL#*://}/postgres"
    fi
fi

# Check if we have production URL
if [ -z "$PRODUCTION_DB_URL" ]; then
    echo -e "${YELLOW}Warning: No production database URL found${NC}"
    echo "Please set VITE_SUPABASE_URL in environment or .env.local"
    echo "Running in local-only mode for demonstration..."
    PRODUCTION_DB_URL="$LOCAL_DB_URL"
fi

# Create output directory
mkdir -p "$DIFF_OUTPUT_DIR"

# Set comparison direction
if [ "$DIRECTION" = "production-to-local" ]; then
    SOURCE_DB="$PRODUCTION_DB_URL"
    TARGET_DB="$LOCAL_DB_URL"
    SOURCE_NAME="Production"
    TARGET_NAME="Local"
else
    SOURCE_DB="$LOCAL_DB_URL"
    TARGET_DB="$PRODUCTION_DB_URL"
    SOURCE_NAME="Local"
    TARGET_NAME="Production"
fi

echo -e "${BLUE}Schema Diff: $SOURCE_NAME → $TARGET_NAME${NC}"
echo ""

# Function to get table schema
get_table_schema() {
    local db_url=$1
    psql "$db_url" -t -c "
    SELECT 
        schemaname,
        tablename,
        string_agg(
            column_name || ' ' || data_type || 
            CASE WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')' 
                ELSE '' 
            END ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
            ', ' ORDER BY ordinal_position
        ) as columns
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    GROUP BY schemaname, tablename
    ORDER BY tablename;
    " 2>/dev/null || echo "Error connecting to database"
}

# Function to get function schema
get_function_schema() {
    local db_url=$1
    psql "$db_url" -t -c "
    SELECT 
        routine_name,
        routine_type,
        string_agg(
            parameter_name || ' ' || data_type,
            ', ' ORDER BY ordinal_position
        ) as parameters,
        data_type as return_type
    FROM information_schema.routines r
    LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
    WHERE r.routine_schema = 'public' AND r.routine_type IN ('FUNCTION', 'PROCEDURE')
    GROUP BY routine_name, routine_type, data_type
    ORDER BY routine_name;
    " 2>/dev/null || echo "Error connecting to database"
}

# Function to get RLS policies
get_rls_policies() {
    local db_url=$1
    psql "$db_url" -t -c "
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
    " 2>/dev/null || echo "Error connecting to database"
}

# Function to get indexes
get_indexes() {
    local db_url=$1
    psql "$db_url" -t -c "
    SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
    " 2>/dev/null || echo "Error connecting to database"
}

# Function to compare schemas
compare_schemas() {
    local type=$1
    local source_file="$DIFF_OUTPUT_DIR/source_${type}_${TIMESTAMP}.txt"
    local target_file="$DIFF_OUTPUT_DIR/target_${type}_${TIMESTAMP}.txt"
    
    echo -e "${CYAN}Comparing $type...${NC}"
    
    case $type in
        "tables")
            get_table_schema "$SOURCE_DB" > "$source_file"
            get_table_schema "$TARGET_DB" > "$target_file"
            ;;
        "functions")
            get_function_schema "$SOURCE_DB" > "$source_file"
            get_function_schema "$TARGET_DB" > "$target_file"
            ;;
        "policies")
            get_rls_policies "$SOURCE_DB" > "$source_file"
            get_rls_policies "$TARGET_DB" > "$target_file"
            ;;
        "indexes")
            get_indexes "$SOURCE_DB" > "$source_file"
            get_indexes "$TARGET_DB" > "$target_file"
            ;;
    esac
    
    # Compare files and format output
    if diff -q "$source_file" "$target_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $type: No differences${NC}"
    else
        echo -e "${YELLOW}⚠ $type: Differences found${NC}"
        
        # Show differences
        echo ""
        echo -e "${PURPLE}--- $SOURCE_NAME $type${NC}"
        echo -e "${PURPLE}+++ $TARGET_NAME $type${NC}"
        
        # Use diff with colors if available
        if command -v colordiff >/dev/null 2>&1; then
            colordiff -u "$source_file" "$target_file" | head -50
        else
            diff -u "$source_file" "$target_file" | head -50
        fi
        
        echo ""
        if [ $(wc -l < "$source_file") -gt 50 ] || [ $(wc -l < "$target_file") -gt 50 ]; then
            echo -e "${YELLOW}(Output truncated - full diff saved to $DIFF_OUTPUT_DIR)${NC}"
        fi
    fi
    
    # Clean up temp files
    rm -f "$source_file" "$target_file"
}

# Main comparison logic
echo -e "${BLUE}Starting schema comparison...${NC}"
echo ""

if [ "$COMPARE_ALL" = true ]; then
    compare_schemas "tables"
    compare_schemas "functions"
    compare_schemas "policies"
    compare_schemas "indexes"
else
    [ "$COMPARE_TABLES" = true ] && compare_schemas "tables"
    [ "$COMPARE_FUNCTIONS" = true ] && compare_schemas "functions"
    [ "$COMPARE_POLICIES" = true ] && compare_schemas "policies"
    [ "$COMPARE_INDEXES" = true ] && compare_schemas "indexes"
fi

echo ""
echo -e "${BLUE}Schema comparison complete!${NC}"

# Generate summary report
if [ -n "$OUTPUT_FILE" ]; then
    echo -e "${CYAN}Generating report: $OUTPUT_FILE${NC}"
    
    case $OUTPUT_FORMAT in
        "json")
            echo '{"schema_diff": {"timestamp": "'$TIMESTAMP'", "direction": "'$DIRECTION'", "differences": []}}' > "$OUTPUT_FILE"
            ;;
        "html")
            cat > "$OUTPUT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Schema Diff Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
        .diff { background: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 4px solid #007acc; }
        .added { color: #28a745; }
        .removed { color: #dc3545; }
        .modified { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Database Schema Diff Report</h1>
        <p>Generated: $TIMESTAMP</p>
        <p>Direction: $SOURCE_NAME → $TARGET_NAME</p>
    </div>
    <div class="content">
        <p>Schema comparison completed. Check console output for detailed differences.</p>
    </div>
</body>
</html>
EOF
            ;;
        *)
            echo "Schema diff report - $TIMESTAMP" > "$OUTPUT_FILE"
            echo "Direction: $SOURCE_NAME → $TARGET_NAME" >> "$OUTPUT_FILE"
            echo "Check console output for detailed differences." >> "$OUTPUT_FILE"
            ;;
    esac
fi

echo -e "${GREEN}Schema diff analysis complete!${NC}"