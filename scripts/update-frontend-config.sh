#!/bin/bash

# Update frontend configuration with deployment values
# Usage: ./scripts/update-frontend-config.sh [options]
# Options:
#   -e, --environment    Environment to update configuration for (dev, staging, prod) [required]
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/update-frontend-config.sh -e dev
#   ./scripts/update-frontend-config.sh -e prod

set -e  # Exit on error

# Source environment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/environment-config.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
write_step() {
    echo -e "${BLUE}🔧 $1${NC}"
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
    echo "Update frontend configuration with deployment values"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to update configuration for (dev, staging, prod) [required]"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev"
    echo "  $0 -e prod"
}

# Default values
ENVIRONMENT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
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

# Validate environment using shared function
if ! validate_environment "$ENVIRONMENT"; then
    exit 1
fi

write_step "Updating frontend configuration for environment: $ENVIRONMENT"

# Get stack outputs using shared functions
STACK_NAME=$(generate_stack_name "$ENVIRONMENT")
write_step "Getting stack outputs from: $STACK_NAME"

USER_POOL_ID=$(get_user_pool_id "$ENVIRONMENT")
USER_POOL_CLIENT_ID=$(get_user_pool_client_id "$ENVIRONMENT")
API_URL=$(get_api_gateway_url "$ENVIRONMENT")
CLOUDFRONT_DOMAIN=$(get_cloudfront_domain "$ENVIRONMENT")
DISTRIBUTION_ID=$(get_cloudfront_distribution_id "$ENVIRONMENT")

if [ -n "$USER_POOL_ID" ] && [ -n "$USER_POOL_CLIENT_ID" ] && [ -n "$API_URL" ]; then
    write_success "Retrieved stack outputs:"
    echo "  User Pool ID: $USER_POOL_ID"
    echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
    echo "  API Gateway URL: $API_URL"
    echo "  CloudFront Domain: $CLOUDFRONT_DOMAIN"
    echo "  Distribution ID: $DISTRIBUTION_ID"
else
    write_error "Could not retrieve required stack outputs for $STACK_NAME"
    exit 1
fi

# Skip updating environment-defaults.js - it should only contain safe placeholders
write_step "Skipping environment-defaults.js update (contains only safe placeholders)"
echo "  Real values will be provided via .env.$ENVIRONMENT file"

# Create environment-specific .env file (this is the main configuration method)
write_step "Creating .env.$ENVIRONMENT file with deployment values"

ENV_FILE=".env.$ENVIRONMENT"

# Get feature flags using shared function
FEATURE_FLAGS=$(get_feature_flags "$ENVIRONMENT")
DEBUG_MODE=$(echo "$FEATURE_FLAGS" | grep "debug_mode:" | cut -d':' -f2)
MOCK_DATA=$(echo "$FEATURE_FLAGS" | grep "mock_data:" | cut -d':' -f2)
ANALYTICS=$(echo "$FEATURE_FLAGS" | grep "analytics:" | cut -d':' -f2)
SHOW_ENV_BANNER=$(echo "$FEATURE_FLAGS" | grep "show_env_banner:" | cut -d':' -f2)

cat > "$ENV_FILE" << EOF
# CarbonLens AI - $ENVIRONMENT Environment Configuration
# Generated on $(date '+%Y-%m-%d %H:%M:%S')
# This file contains real deployment values and should NOT be committed to Git

# Environment
REACT_APP_ENVIRONMENT=$ENVIRONMENT

# AWS Configuration
REACT_APP_AWS_REGION=$AWS_REGION

# Cognito Authentication (from deployment)
REACT_APP_USER_POOL_ID=$USER_POOL_ID
REACT_APP_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID

# API Gateway (from deployment)
REACT_APP_API_URL=$API_URL

# CloudFront (from deployment)
REACT_APP_CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
REACT_APP_DISTRIBUTION_ID=$DISTRIBUTION_ID

# Feature Flags (environment-specific)
REACT_APP_DEBUG_MODE=$DEBUG_MODE
REACT_APP_MOCK_DATA=$MOCK_DATA
REACT_APP_ANALYTICS=$ANALYTICS
REACT_APP_SHOW_ENV_BANNER=$SHOW_ENV_BANNER
EOF

write_success "Created $ENV_FILE with real deployment values"
write_warning "Note: $ENV_FILE contains sensitive data and is excluded from Git"

# Update package.json scripts if needed
write_step "Checking package.json scripts"

PACKAGE_JSON="package.json"
if [ -f "$PACKAGE_JSON" ]; then
    SCRIPTS_UPDATED=false
    
    # Check if environment-specific scripts exist
    if ! jq -e '.scripts["build:dev"]' "$PACKAGE_JSON" > /dev/null 2>&1; then
        jq '.scripts["build:dev"] = "env-cmd -f .env.dev npm run build"' "$PACKAGE_JSON" > tmp.json && mv tmp.json "$PACKAGE_JSON"
        SCRIPTS_UPDATED=true
    fi
    
    if ! jq -e '.scripts["build:staging"]' "$PACKAGE_JSON" > /dev/null 2>&1; then
        jq '.scripts["build:staging"] = "env-cmd -f .env.staging npm run build"' "$PACKAGE_JSON" > tmp.json && mv tmp.json "$PACKAGE_JSON"
        SCRIPTS_UPDATED=true
    fi
    
    if ! jq -e '.scripts["build:prod"]' "$PACKAGE_JSON" > /dev/null 2>&1; then
        jq '.scripts["build:prod"] = "env-cmd -f .env.prod npm run build"' "$PACKAGE_JSON" > tmp.json && mv tmp.json "$PACKAGE_JSON"
        SCRIPTS_UPDATED=true
    fi
    
    if [ "$SCRIPTS_UPDATED" = true ]; then
        write_success "Updated package.json with environment-specific build scripts"
    else
        echo "  Package.json scripts are already up to date"
    fi
else
    write_warning "package.json not found"
fi

# Verify configuration
write_step "Verifying configuration"

# Test API endpoint
TEST_URL="${API_URL%/}/dashboard"
echo "  Testing API endpoint: $TEST_URL"

if curl -s -f -m 10 "$TEST_URL" > /dev/null 2>&1; then
    write_success "  API endpoint is responding"
elif curl -s -m 10 "$TEST_URL" > /dev/null 2>&1; then
    write_success "  API endpoint is responding (may require authentication)"
else
    write_warning "  Could not test API endpoint (this may be normal for auth-protected endpoints)"
fi

# Final success message
write_success "🎉 Frontend configuration updated successfully!"

write_step "Configuration Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  User Pool ID: $USER_POOL_ID"
echo "  API URL: $API_URL"
echo "  CloudFront: $CLOUDFRONT_DOMAIN"
echo "  Config Files: src/config/environments.js, .env.$ENVIRONMENT"

write_step "Next Steps:"
echo "  1. Build frontend: npm run build:$ENVIRONMENT"
echo "  2. Test locally: npm start"
echo "  3. Deploy: Already handled by deployment script"

write_success "✅ Configuration update completed!"