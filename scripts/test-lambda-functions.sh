#!/bin/bash

# Test all Lambda functions health and performance
# Usage: ./scripts/test-lambda-functions.sh [options]
# Options:
#   -e, --environment    Environment to test (dev, staging, prod) [required]
#   -d, --detailed       Run detailed performance tests
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/test-lambda-functions.sh -e prod
#   ./scripts/test-lambda-functions.sh -e dev -d

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
write_step() {
    echo -e "${BLUE}🔍 $1${NC}"
}

write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

write_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "Test all Lambda functions health and performance"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to test (dev, staging, prod) [required]"
    echo "  -d, --detailed       Run detailed performance tests"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e prod"
    echo "  $0 -e dev -d"
}

# Default values
ENVIRONMENT=""
DETAILED=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--detailed)
            DETAILED=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            write_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$ENVIRONMENT" ]; then
    write_error "Environment is required. Use -e or --environment"
    show_help
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    write_error "Invalid environment. Must be dev, staging, or prod"
    exit 1
fi

write_step "Testing Lambda functions in environment: $ENVIRONMENT"

# Define all Lambda functions
declare -a FUNCTIONS=(
    "carbonlens-ai-processDocument-$ENVIRONMENT:Process documents and extract carbon footprint data"
    "carbonlens-ai-calculateCarbon-$ENVIRONMENT:Calculate carbon footprint from logistics data"
    "carbonlens-ai-getOptimizations-$ENVIRONMENT:Generate AI-powered optimization recommendations"
    "carbonlens-ai-generateCertificate-$ENVIRONMENT:Generate carbon certificates with QR codes"
    "carbonlens-ai-getDashboardData-$ENVIRONMENT:Retrieve dashboard analytics data"
    "carbonlens-ai-seedTestData-$ENVIRONMENT:Seed database with test data"
    "carbonlens-ai-migrateUserData-$ENVIRONMENT:Migrate user data between versions"
)

TOTAL_FUNCTIONS=${#FUNCTIONS[@]}
HEALTHY_FUNCTIONS=0
FAILED_FUNCTIONS=0
RESULTS_FILE="lambda-health-report-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"

# Initialize results JSON
echo "[" > "$RESULTS_FILE"

for i in "${!FUNCTIONS[@]}"; do
    IFS=':' read -r FUNCTION_NAME DESCRIPTION <<< "${FUNCTIONS[$i]}"
    
    write_step "Testing function: $FUNCTION_NAME"
    
    # Initialize result object
    RESULT_JSON="{"
    RESULT_JSON="$RESULT_JSON\"name\":\"$FUNCTION_NAME\","
    RESULT_JSON="$RESULT_JSON\"description\":\"$DESCRIPTION\","
    RESULT_JSON="$RESULT_JSON\"status\":\"Unknown\","
    RESULT_JSON="$RESULT_JSON\"state\":\"Unknown\","
    RESULT_JSON="$RESULT_JSON\"lastModified\":\"Unknown\","
    RESULT_JSON="$RESULT_JSON\"runtime\":\"Unknown\","
    RESULT_JSON="$RESULT_JSON\"memorySize\":0,"
    RESULT_JSON="$RESULT_JSON\"timeout\":0,"
    RESULT_JSON="$RESULT_JSON\"invocationResult\":\"Not Tested\","
    RESULT_JSON="$RESULT_JSON\"duration\":0,"
    RESULT_JSON="$RESULT_JSON\"errorMessage\":\"\","
    RESULT_JSON="$RESULT_JSON\"metrics\":{}"
    
    # Check if function exists and get configuration
    echo "  Checking function configuration..."
    if FUNCTION_CONFIG=$(aws lambda get-function --function-name "$FUNCTION_NAME" --query 'Configuration' --output json 2>/dev/null); then
        STATE=$(echo "$FUNCTION_CONFIG" | jq -r '.State')
        LAST_MODIFIED=$(echo "$FUNCTION_CONFIG" | jq -r '.LastModified')
        RUNTIME=$(echo "$FUNCTION_CONFIG" | jq -r '.Runtime')
        MEMORY_SIZE=$(echo "$FUNCTION_CONFIG" | jq -r '.MemorySize')
        TIMEOUT=$(echo "$FUNCTION_CONFIG" | jq -r '.Timeout')
        
        # Update result JSON
        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"state\":\"Unknown\"/\"state\":\"$STATE\"/")
        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"lastModified\":\"Unknown\"/\"lastModified\":\"$LAST_MODIFIED\"/")
        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"runtime\":\"Unknown\"/\"runtime\":\"$RUNTIME\"/")
        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"memorySize\":0/\"memorySize\":$MEMORY_SIZE/")
        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"timeout\":0/\"timeout\":$TIMEOUT/")
        
        if [ "$STATE" = "Active" ]; then
            write_success "  Function is active"
            RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"status":"Unknown"/"status":"Active"/')
            
            # Get function metrics if detailed testing is enabled
            if [ "$DETAILED" = true ]; then
                echo "  Getting function metrics..."
                
                END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S")
                START_TIME=$(date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%S")
                
                # Get invocation count
                INVOCATIONS=$(aws cloudwatch get-metric-statistics \
                    --namespace "AWS/Lambda" \
                    --metric-name "Invocations" \
                    --dimensions "Name=FunctionName,Value=$FUNCTION_NAME" \
                    --statistics "Sum" \
                    --start-time "$START_TIME" \
                    --end-time "$END_TIME" \
                    --period 3600 \
                    --query 'Datapoints[0].Sum' --output text 2>/dev/null || echo "0")
                
                # Get error count
                ERRORS=$(aws cloudwatch get-metric-statistics \
                    --namespace "AWS/Lambda" \
                    --metric-name "Errors" \
                    --dimensions "Name=FunctionName,Value=$FUNCTION_NAME" \
                    --statistics "Sum" \
                    --start-time "$START_TIME" \
                    --end-time "$END_TIME" \
                    --period 3600 \
                    --query 'Datapoints[0].Sum' --output text 2>/dev/null || echo "0")
                
                # Get average duration
                AVG_DURATION=$(aws cloudwatch get-metric-statistics \
                    --namespace "AWS/Lambda" \
                    --metric-name "Duration" \
                    --dimensions "Name=FunctionName,Value=$FUNCTION_NAME" \
                    --statistics "Average" \
                    --start-time "$START_TIME" \
                    --end-time "$END_TIME" \
                    --period 3600 \
                    --query 'Datapoints[0].Average' --output text 2>/dev/null || echo "0")
                
                # Handle "None" values
                [ "$INVOCATIONS" = "None" ] && INVOCATIONS="0"
                [ "$ERRORS" = "None" ] && ERRORS="0"
                [ "$AVG_DURATION" = "None" ] && AVG_DURATION="0"
                
                # Update metrics in result JSON
                METRICS_JSON="{\"invocations\":$INVOCATIONS,\"errors\":$ERRORS,\"avgDuration\":$AVG_DURATION}"
                RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"metrics\":{}$/\"metrics\":$METRICS_JSON/")
                
                echo "    📊 Invocations (1h): $INVOCATIONS"
                echo "    📊 Errors (1h): $ERRORS"
                echo "    📊 Avg Duration (1h): ${AVG_DURATION}ms"
                
                # Calculate error rate
                if [ "$INVOCATIONS" -gt 0 ] && [ "$ERRORS" -gt 0 ]; then
                    ERROR_RATE=$(echo "scale=2; $ERRORS * 100 / $INVOCATIONS" | bc)
                    if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
                        write_warning "    High error rate: ${ERROR_RATE}%"
                    fi
                fi
            fi
            
            # Test function invocation (only for safe functions)
            if [[ "$FUNCTION_NAME" == *"getDashboardData"* ]] || [[ "$FUNCTION_NAME" == *"seedTestData"* ]]; then
                echo "  Testing function invocation..."
                
                # Create test payload
                TEST_PAYLOAD='{"testData":true}'
                
                START_TIME=$(date +%s%3N)
                if aws lambda invoke \
                    --function-name "$FUNCTION_NAME" \
                    --payload "$TEST_PAYLOAD" \
                    --cli-binary-format raw-in-base64-out \
                    response.json >/dev/null 2>&1; then
                    
                    END_TIME=$(date +%s%3N)
                    DURATION=$((END_TIME - START_TIME))
                    
                    if [ -f "response.json" ] && jq empty response.json 2>/dev/null; then
                        write_success "  Function invocation successful (${DURATION}ms)"
                        RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"invocationResult":"Not Tested"/"invocationResult":"Success"/')
                        RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"duration\":0/\"duration\":$DURATION/")
                    else
                        write_warning "  Function returned invalid JSON"
                        RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"invocationResult":"Not Tested"/"invocationResult":"Invalid Response"/')
                    fi
                    
                    rm -f response.json
                else
                    write_warning "  Function invocation failed"
                    RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"invocationResult":"Not Tested"/"invocationResult":"Failed"/')
                fi
            else
                echo "  Skipping invocation test for this function type"
                RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"invocationResult":"Not Tested"/"invocationResult":"Skipped"/')
            fi
            
            ((HEALTHY_FUNCTIONS++))
        else
            write_error "  Function state: $STATE"
            RESULT_JSON=$(echo "$RESULT_JSON" | sed "s/\"status\":\"Unknown\"/\"status\":\"$STATE\"/")
            RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"errorMessage":""/\"errorMessage":"Function is not in Active state"/')
            ((FAILED_FUNCTIONS++))
        fi
    else
        write_error "  Function not found or not accessible"
        RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"status":"Unknown"/"status":"NotFound"/')
        RESULT_JSON=$(echo "$RESULT_JSON" | sed 's/"errorMessage":""/\"errorMessage":"Function not found or not accessible"/')
        ((FAILED_FUNCTIONS++))
    fi
    
    # Close result JSON and add to file
    RESULT_JSON="$RESULT_JSON}"
    
    # Add comma if not last item
    if [ $i -lt $((TOTAL_FUNCTIONS - 1)) ]; then
        RESULT_JSON="$RESULT_JSON,"
    fi
    
    echo "$RESULT_JSON" >> "$RESULTS_FILE"
    echo ""
done

# Close JSON array
echo "]" >> "$RESULTS_FILE"

# Generate summary report
write_step "Lambda Functions Health Summary"
echo "Environment: $ENVIRONMENT"
echo "Total Functions: $TOTAL_FUNCTIONS"
write_success "Healthy Functions: $HEALTHY_FUNCTIONS"
if [ $FAILED_FUNCTIONS -gt 0 ]; then
    write_error "Failed Functions: $FAILED_FUNCTIONS"
else
    write_success "Failed Functions: $FAILED_FUNCTIONS"
fi
echo ""

write_success "Health report saved to: $RESULTS_FILE"

# Exit with appropriate code
if [ $FAILED_FUNCTIONS -gt 0 ]; then
    write_error "❌ Lambda functions health check failed"
    exit 1
else
    write_success "✅ All Lambda functions are healthy"
    exit 0
fi