#!/bin/bash

# Migration creation script
# Usage: ./scripts/create-migration.sh <type> <description>
# Types: table, function, index, data, rollback

set -e

# Configuration
MIGRATION_DIR="supabase/migrations"
TEMPLATE_DIR="supabase/migration-templates"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo -e "${BLUE}Migration Creation Script${NC}"
    echo ""
    echo "Usage: $0 <type> <description>"
    echo ""
    echo "Types:"
    echo "  table     - Create a new table with RLS and indexes"
    echo "  function  - Create or update a database function"
    echo "  index     - Add performance indexes"
    echo "  data      - Migrate or transform existing data"
    echo "  rollback  - Create rollback script for a migration"
    echo ""
    echo "Examples:"
    echo "  $0 table \"add user preferences table\""
    echo "  $0 function \"update dish search function\""
    echo "  $0 index \"optimize meal history queries\""
    echo "  $0 data \"migrate legacy cuisine data\""
    echo "  $0 rollback \"20250707_120000_add_user_preferences\""
    echo ""
}

# Validate arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    show_help
    exit 1
fi

TYPE=$1
DESCRIPTION=$2

# Validate migration type
case $TYPE in
    table|function|index|data|rollback)
        ;;
    *)
        echo -e "${RED}Error: Invalid migration type '$TYPE'${NC}"
        echo "Valid types: table, function, index, data, rollback"
        exit 1
        ;;
esac

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Generate filename
FILENAME="${TIMESTAMP}_${DESCRIPTION// /_}.sql"
FILEPATH="${MIGRATION_DIR}/${FILENAME}"

# Select template
case $TYPE in
    table)
        TEMPLATE="${TEMPLATE_DIR}/table_creation_template.sql"
        ;;
    function)
        TEMPLATE="${TEMPLATE_DIR}/function_update_template.sql"
        ;;
    index)
        TEMPLATE="${TEMPLATE_DIR}/index_creation_template.sql"
        ;;
    data)
        TEMPLATE="${TEMPLATE_DIR}/data_migration_template.sql"
        ;;
    rollback)
        TEMPLATE="${TEMPLATE_DIR}/rollback_template.sql"
        ;;
esac

# Check if template exists
if [ ! -f "$TEMPLATE" ]; then
    echo -e "${RED}Error: Template file not found: $TEMPLATE${NC}"
    exit 1
fi

# Create migrations directory if it doesn't exist
mkdir -p "$MIGRATION_DIR"

# Copy template to new migration file
cp "$TEMPLATE" "$FILEPATH"

# Replace placeholders with current info
sed -i '' "s/\[Your name\]/$(git config user.name 2>/dev/null || echo 'Unknown')/g" "$FILEPATH"
sed -i '' "s/\[YYYY-MM-DD\]/$(date +%Y-%m-%d)/g" "$FILEPATH"

# Special handling for rollback migrations
if [ "$TYPE" = "rollback" ]; then
    # Extract original migration name from description
    ORIGINAL_MIGRATION="$DESCRIPTION"
    sed -i '' "s/\[original_migration_name\]/$ORIGINAL_MIGRATION/g" "$FILEPATH"
    sed -i '' "s/\[file_name_of_original_migration\]/$ORIGINAL_MIGRATION.sql/g" "$FILEPATH"
fi

echo -e "${GREEN}✓ Migration created successfully!${NC}"
echo ""
echo -e "${BLUE}File:${NC} $FILEPATH"
echo -e "${BLUE}Type:${NC} $TYPE"
echo -e "${BLUE}Description:${NC} $DESCRIPTION"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit the migration file and replace template placeholders"
echo "2. Test the migration locally: bun run dev:db:test-migration"
echo "3. Validate syntax: bun run db:validate-migration"
echo "4. Commit when ready: git add $FILEPATH && git commit"
echo ""
echo -e "${BLUE}Opening file in editor...${NC}"

# Try to open in common editors
if command -v code >/dev/null 2>&1; then
    code "$FILEPATH"
elif command -v nano >/dev/null 2>&1; then
    nano "$FILEPATH"
elif command -v vim >/dev/null 2>&1; then
    vim "$FILEPATH"
else
    echo "Please edit the file manually: $FILEPATH"
fi