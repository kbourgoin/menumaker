#!/bin/bash

# TypeScript Type Generation from Database Schema
# Usage: ./scripts/generate-types.sh [options]

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TYPES_DIR="src/types"
GENERATED_TYPES_FILE="$TYPES_DIR/database-generated.ts"
BACKUP_DIR="tmp/type-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Options
VALIDATE_ONLY=false
FORCE_OVERWRITE=false
BACKUP_EXISTING=true
CHECK_DRIFT=false

show_help() {
    echo -e "${BLUE}TypeScript Type Generation Tool${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --validate-only       Only validate existing types, don't generate"
    echo "  --force               Force overwrite without backup"
    echo "  --no-backup           Don't create backup of existing types"
    echo "  --check-drift         Check for drift between generated and existing types"
    echo "  --help                Show this help"
    echo ""
    echo "Files:"
    echo "  Input:  Database schema (via Supabase CLI)"
    echo "  Output: $GENERATED_TYPES_FILE"
    echo "  Backup: $BACKUP_DIR/"
    echo ""
    echo "Examples:"
    echo "  $0                    # Generate types with backup"
    echo "  $0 --validate-only    # Only validate existing types"
    echo "  $0 --check-drift      # Check for schema drift"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --validate-only)
            VALIDATE_ONLY=true
            ;;
        --force)
            FORCE_OVERWRITE=true
            ;;
        --no-backup)
            BACKUP_EXISTING=false
            ;;
        --check-drift)
            CHECK_DRIFT=true
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

# Check if Supabase CLI is available
if ! command -v supabase >/dev/null 2>&1; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Please install Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if local Supabase is running
if ! supabase status >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Local Supabase is not running${NC}"
    echo "Starting local Supabase..."
    supabase start
fi

# Create directories
mkdir -p "$TYPES_DIR" "$BACKUP_DIR"

# Function to validate TypeScript types
validate_types() {
    local file=$1
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ Type file not found: $file${NC}"
        return 1
    fi
    
    echo -e "${CYAN}Validating TypeScript types...${NC}"
    
    # Check TypeScript compilation
    if bunx tsc --noEmit "$file" 2>/dev/null; then
        echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
        return 0
    else
        echo -e "${RED}✗ TypeScript compilation failed${NC}"
        bunx tsc --noEmit "$file" 2>&1 | head -20
        return 1
    fi
}

# Function to check for schema drift
check_schema_drift() {
    if [ ! -f "$GENERATED_TYPES_FILE" ]; then
        echo -e "${YELLOW}No existing types found - generating fresh types${NC}"
        return 0
    fi
    
    echo -e "${CYAN}Checking for schema drift...${NC}"
    
    # Generate temp types for comparison
    local temp_types="$BACKUP_DIR/temp_types_$TIMESTAMP.ts"
    if supabase gen types typescript --local > "$temp_types" 2>/dev/null; then
        if diff -q "$GENERATED_TYPES_FILE" "$temp_types" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ No schema drift detected${NC}"
            rm -f "$temp_types"
            return 0
        else
            echo -e "${YELLOW}⚠ Schema drift detected${NC}"
            echo "Differences found between current types and schema:"
            diff -u "$GENERATED_TYPES_FILE" "$temp_types" | head -20
            rm -f "$temp_types"
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to generate types for drift comparison${NC}"
        return 1
    fi
}

# Function to backup existing types
backup_types() {
    if [ -f "$GENERATED_TYPES_FILE" ] && [ "$BACKUP_EXISTING" = true ]; then
        local backup_file="$BACKUP_DIR/database-generated-$TIMESTAMP.ts"
        echo -e "${CYAN}Backing up existing types to $backup_file${NC}"
        cp "$GENERATED_TYPES_FILE" "$backup_file"
        echo -e "${GREEN}✓ Backup created${NC}"
    fi
}

# Function to generate types
generate_types() {
    echo -e "${CYAN}Generating TypeScript types from database schema...${NC}"
    
    # Create temporary file for generation
    local temp_file="$BACKUP_DIR/temp_generated_$TIMESTAMP.ts"
    
    # Generate types with header
    cat > "$temp_file" << 'EOF'
// Database Types - Generated from Supabase Schema
// DO NOT EDIT MANUALLY - Run 'bun run db:generate-types' to update
// Generated at: TIMESTAMP_PLACEHOLDER

EOF
    
    # Add timestamp
    sed -i "s/TIMESTAMP_PLACEHOLDER/$(date -u +"%Y-%m-%d %H:%M:%S UTC")/" "$temp_file"
    
    # Generate types from Supabase
    if supabase gen types typescript --local >> "$temp_file" 2>/dev/null; then
        echo -e "${GREEN}✓ Types generated successfully${NC}"
        
        # Validate generated types
        if validate_types "$temp_file"; then
            # Move to final location
            mv "$temp_file" "$GENERATED_TYPES_FILE"
            echo -e "${GREEN}✓ Types saved to $GENERATED_TYPES_FILE${NC}"
        else
            echo -e "${RED}✗ Generated types failed validation${NC}"
            rm -f "$temp_file"
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to generate types from database${NC}"
        rm -f "$temp_file"
        return 1
    fi
}

# Function to show type statistics
show_type_stats() {
    if [ -f "$GENERATED_TYPES_FILE" ]; then
        echo -e "${CYAN}Type Statistics:${NC}"
        echo "File size: $(du -h "$GENERATED_TYPES_FILE" | cut -f1)"
        echo "Lines: $(wc -l < "$GENERATED_TYPES_FILE")"
        echo "Tables: $(grep -c "Tables:" "$GENERATED_TYPES_FILE" || echo "0")"
        echo "Functions: $(grep -c "Functions:" "$GENERATED_TYPES_FILE" || echo "0")"
        echo "Last generated: $(stat -f "%Sm" "$GENERATED_TYPES_FILE" 2>/dev/null || stat -c "%y" "$GENERATED_TYPES_FILE" 2>/dev/null || echo "Unknown")"
    fi
}

# Main execution
echo -e "${BLUE}Database Type Generation${NC}"
echo ""

# Check for drift if requested
if [ "$CHECK_DRIFT" = true ]; then
    if check_schema_drift; then
        echo -e "${GREEN}Schema is up to date${NC}"
        exit 0
    else
        echo -e "${YELLOW}Schema drift detected - consider regenerating types${NC}"
        exit 1
    fi
fi

# Validate only mode
if [ "$VALIDATE_ONLY" = true ]; then
    if validate_types "$GENERATED_TYPES_FILE"; then
        show_type_stats
        echo -e "${GREEN}✓ Type validation successful${NC}"
        exit 0
    else
        echo -e "${RED}✗ Type validation failed${NC}"
        exit 1
    fi
fi

# Check if types already exist and handle accordingly
if [ -f "$GENERATED_TYPES_FILE" ] && [ "$FORCE_OVERWRITE" = false ]; then
    echo -e "${YELLOW}Existing types found at $GENERATED_TYPES_FILE${NC}"
    
    # Check for drift first
    if check_schema_drift; then
        echo -e "${GREEN}Types are up to date - no generation needed${NC}"
        show_type_stats
        exit 0
    fi
    
    echo -e "${YELLOW}Schema changes detected - regenerating types${NC}"
fi

# Backup existing types
backup_types

# Generate new types
if generate_types; then
    show_type_stats
    echo ""
    echo -e "${GREEN}✓ Type generation completed successfully${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Review generated types in $GENERATED_TYPES_FILE"
    echo "2. Update imports in your code if needed"
    echo "3. Run 'bun run type-check' to validate integration"
    echo "4. Consider running 'bun run test' to ensure compatibility"
else
    echo -e "${RED}✗ Type generation failed${NC}"
    exit 1
fi