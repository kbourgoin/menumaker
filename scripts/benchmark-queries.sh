#!/bin/bash

# Database Performance Benchmarking Tool
# Usage: ./scripts/benchmark-queries.sh [options]

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
BENCHMARK_DIR="tmp/benchmarks"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$BENCHMARK_DIR/benchmark_report_$TIMESTAMP.txt"

# Test parameters
TEST_USER_ID="91111111-1111-1111-1111-111111111111"
ITERATIONS=5
TIMEOUT=30

# Options
RUN_ALL=true
TEST_SEARCH=false
TEST_STATS=false
TEST_CRUD=false
TEST_COMPLEX=false
VERBOSE=false
SAVE_REPORT=true

show_help() {
    echo -e "${BLUE}Database Performance Benchmarking Tool${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --search              Test search performance only"
    echo "  --stats               Test statistics calculation only"
    echo "  --crud                Test CRUD operations only"
    echo "  --complex             Test complex queries only"
    echo "  --all                 Run all benchmarks (default)"
    echo "  --iterations=N        Number of iterations per test (default: 5)"
    echo "  --timeout=N           Timeout in seconds (default: 30)"
    echo "  --verbose             Show detailed output"
    echo "  --no-report           Don't save benchmark report"
    echo "  --help                Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --search --verbose"
    echo "  $0 --iterations=10 --timeout=60"
    echo "  $0 --all --no-report"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --search)
            TEST_SEARCH=true
            RUN_ALL=false
            ;;
        --stats)
            TEST_STATS=true
            RUN_ALL=false
            ;;
        --crud)
            TEST_CRUD=true
            RUN_ALL=false
            ;;
        --complex)
            TEST_COMPLEX=true
            RUN_ALL=false
            ;;
        --all)
            RUN_ALL=true
            ;;
        --iterations=*)
            ITERATIONS="${1#*=}"
            ;;
        --timeout=*)
            TIMEOUT="${1#*=}"
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --no-report)
            SAVE_REPORT=false
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

# Create benchmark directory
mkdir -p "$BENCHMARK_DIR"

# Initialize report
if [ "$SAVE_REPORT" = true ]; then
    cat > "$REPORT_FILE" << EOF
Database Performance Benchmark Report
Generated: $(date)
Database: Local Development ($LOCAL_DB_URL)
Iterations: $ITERATIONS
Timeout: $TIMEOUT seconds

EOF
fi

# Function to log results
log_result() {
    local message=$1
    echo -e "$message"
    if [ "$SAVE_REPORT" = true ]; then
        echo -e "$message" | sed 's/\x1b\[[0-9;]*m//g' >> "$REPORT_FILE"
    fi
}

# Function to run SQL benchmark
run_sql_benchmark() {
    local test_name=$1
    local sql_query=$2
    local threshold_ms=${3:-1000}
    
    log_result "${CYAN}Testing: $test_name${NC}"
    
    local total_time=0
    local min_time=999999
    local max_time=0
    local failed=0
    
    for i in $(seq 1 $ITERATIONS); do
        if [ "$VERBOSE" = true ]; then
            echo -n "  Iteration $i: "
        fi
        
        local start_time=$(date +%s%3N)
        
        # Run the query with timeout
        if timeout $TIMEOUT psql "$LOCAL_DB_URL" -c "$sql_query" > /dev/null 2>&1; then
            local end_time=$(date +%s%3N)
            local duration=$((end_time - start_time))
            
            total_time=$((total_time + duration))
            
            if [ $duration -lt $min_time ]; then
                min_time=$duration
            fi
            
            if [ $duration -gt $max_time ]; then
                max_time=$duration
            fi
            
            if [ "$VERBOSE" = true ]; then
                echo "${duration}ms"
            fi
        else
            failed=$((failed + 1))
            if [ "$VERBOSE" = true ]; then
                echo "FAILED"
            fi
        fi
    done
    
    if [ $failed -eq $ITERATIONS ]; then
        log_result "  ${RED}✗ All iterations failed${NC}"
        return 1
    fi
    
    local successful=$((ITERATIONS - failed))
    local avg_time=$((total_time / successful))
    
    # Determine status based on threshold
    local status_color="$GREEN"
    local status="✓"
    if [ $avg_time -gt $threshold_ms ]; then
        status_color="$YELLOW"
        status="⚠"
    fi
    
    log_result "  ${status_color}$status Average: ${avg_time}ms | Min: ${min_time}ms | Max: ${max_time}ms | Success: ${successful}/${ITERATIONS}${NC}"
    
    if [ $avg_time -gt $threshold_ms ]; then
        log_result "    ${YELLOW}Performance warning: Exceeded ${threshold_ms}ms threshold${NC}"
    fi
    
    log_result ""
}

# Function to setup test data
setup_test_data() {
    log_result "${CYAN}Setting up test data...${NC}"
    
    psql "$LOCAL_DB_URL" -c "
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES ('$TEST_USER_ID', 'benchmark@test.com', now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.dishes (name, user_id, cuisine, created_at, updated_at)
    SELECT 
        'Benchmark Dish ' || generate_series,
        '$TEST_USER_ID'::uuid,
        CASE (generate_series % 5)
            WHEN 0 THEN 'Italian'
            WHEN 1 THEN 'Mexican'
            WHEN 2 THEN 'Asian'
            WHEN 3 THEN 'American'
            ELSE 'French'
        END,
        now() - (generate_series || ' minutes')::interval,
        now()
    FROM generate_series(1, 100)
    ON CONFLICT DO NOTHING;
    " > /dev/null 2>&1
    
    log_result "${GREEN}✓ Test data ready${NC}"
    log_result ""
}

# Function to cleanup test data
cleanup_test_data() {
    log_result "${CYAN}Cleaning up test data...${NC}"
    
    psql "$LOCAL_DB_URL" -c "
    DELETE FROM public.dishes WHERE user_id = '$TEST_USER_ID';
    DELETE FROM auth.users WHERE id = '$TEST_USER_ID';
    " > /dev/null 2>&1
    
    log_result "${GREEN}✓ Test data cleaned up${NC}"
}

# Search performance tests
test_search_performance() {
    log_result "${BLUE}=== Search Performance Tests ===${NC}"
    log_result ""
    
    run_sql_benchmark \
        "Basic dish search" \
        "SELECT * FROM dishes WHERE user_id = '$TEST_USER_ID' AND name ILIKE '%dish%' LIMIT 20;" \
        100
    
    run_sql_benchmark \
        "Search with ordering" \
        "SELECT * FROM dishes WHERE user_id = '$TEST_USER_ID' AND name ILIKE '%benchmark%' ORDER BY created_at DESC LIMIT 20;" \
        150
    
    run_sql_benchmark \
        "Complex search query" \
        "SELECT d.*, COUNT(mh.id) as meal_count FROM dishes d LEFT JOIN meal_history mh ON d.id = mh.dish_id WHERE d.user_id = '$TEST_USER_ID' AND d.name ILIKE '%dish%' GROUP BY d.id ORDER BY meal_count DESC LIMIT 10;" \
        300
    
    # Test search function if it exists
    run_sql_benchmark \
        "Search RPC function" \
        "SELECT * FROM search_dishes('dish', '$TEST_USER_ID');" \
        100
}

# Statistics performance tests
test_stats_performance() {
    log_result "${BLUE}=== Statistics Performance Tests ===${NC}"
    log_result ""
    
    run_sql_benchmark \
        "Count total dishes" \
        "SELECT COUNT(*) FROM dishes WHERE user_id = '$TEST_USER_ID';" \
        50
    
    run_sql_benchmark \
        "Cuisine distribution" \
        "SELECT cuisine, COUNT(*) as count FROM dishes WHERE user_id = '$TEST_USER_ID' GROUP BY cuisine ORDER BY count DESC;" \
        100
    
    run_sql_benchmark \
        "Recent activity stats" \
        "SELECT DATE(created_at) as date, COUNT(*) FROM dishes WHERE user_id = '$TEST_USER_ID' AND created_at > now() - interval '30 days' GROUP BY DATE(created_at) ORDER BY date;" \
        200
    
    run_sql_benchmark \
        "Dish summary view" \
        "SELECT * FROM dish_summary WHERE user_id = '$TEST_USER_ID' LIMIT 50;" \
        300
}

# CRUD performance tests
test_crud_performance() {
    log_result "${BLUE}=== CRUD Performance Tests ===${NC}"
    log_result ""
    
    run_sql_benchmark \
        "Insert single dish" \
        "INSERT INTO dishes (name, user_id, cuisine) VALUES ('Performance Test $(date +%s)', '$TEST_USER_ID', 'Test') RETURNING id;" \
        50
    
    run_sql_benchmark \
        "Update single dish" \
        "UPDATE dishes SET updated_at = now() WHERE user_id = '$TEST_USER_ID' AND name LIKE 'Benchmark Dish 1%' LIMIT 1;" \
        50
    
    run_sql_benchmark \
        "Select with joins" \
        "SELECT d.*, s.name as source_name FROM dishes d LEFT JOIN sources s ON d.source_id = s.id WHERE d.user_id = '$TEST_USER_ID' LIMIT 20;" \
        100
    
    run_sql_benchmark \
        "Bulk select" \
        "SELECT * FROM dishes WHERE user_id = '$TEST_USER_ID' ORDER BY created_at DESC LIMIT 100;" \
        200
}

# Complex query performance tests
test_complex_performance() {
    log_result "${BLUE}=== Complex Query Performance Tests ===${NC}"
    log_result ""
    
    run_sql_benchmark \
        "Multi-table join with aggregation" \
        "SELECT d.cuisine, COUNT(d.id) as dish_count, COUNT(mh.id) as meal_count FROM dishes d LEFT JOIN meal_history mh ON d.id = mh.dish_id WHERE d.user_id = '$TEST_USER_ID' GROUP BY d.cuisine ORDER BY dish_count DESC;" \
        500
    
    run_sql_benchmark \
        "Subquery with window function" \
        "SELECT *, ROW_NUMBER() OVER (PARTITION BY cuisine ORDER BY created_at DESC) as rank FROM dishes WHERE user_id = '$TEST_USER_ID';" \
        400
    
    run_sql_benchmark \
        "Full text search simulation" \
        "SELECT * FROM dishes WHERE user_id = '$TEST_USER_ID' AND (name ILIKE '%italian%' OR cuisine ILIKE '%italian%' OR location ILIKE '%italian%') ORDER BY created_at DESC;" \
        300
}

# Main execution
echo -e "${BLUE}Database Performance Benchmarking${NC}"
echo ""

# Check if database is accessible
if ! psql "$LOCAL_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Make sure local Supabase is running: bun run dev:db:start"
    exit 1
fi

# Setup test data
setup_test_data

# Run benchmarks based on options
if [ "$RUN_ALL" = true ] || [ "$TEST_SEARCH" = true ]; then
    test_search_performance
fi

if [ "$RUN_ALL" = true ] || [ "$TEST_STATS" = true ]; then
    test_stats_performance
fi

if [ "$RUN_ALL" = true ] || [ "$TEST_CRUD" = true ]; then
    test_crud_performance
fi

if [ "$RUN_ALL" = true ] || [ "$TEST_COMPLEX" = true ]; then
    test_complex_performance
fi

# Generate summary
log_result "${BLUE}=== Benchmark Summary ===${NC}"
log_result ""
log_result "Benchmark completed: $(date)"
log_result "Total tests run with $ITERATIONS iterations each"

if [ "$SAVE_REPORT" = true ]; then
    log_result "Detailed report saved to: $REPORT_FILE"
fi

# Cleanup
cleanup_test_data

log_result ""
log_result "${GREEN}✓ Database benchmarking complete!${NC}"

# Performance recommendations
log_result ""
log_result "${CYAN}Performance Recommendations:${NC}"
log_result "• Monitor queries taking >100ms regularly"
log_result "• Consider adding indexes for frequently searched columns"
log_result "• Use pagination for large result sets"
log_result "• Cache expensive aggregation queries"
log_result "• Profile and optimize slow RPC functions"