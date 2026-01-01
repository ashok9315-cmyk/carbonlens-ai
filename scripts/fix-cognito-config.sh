#!/bin/bash

# Fix Cognito Configuration for Deployed Environment
# This script updates the frontend configuration with real Cognito values and redeploys

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

write_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

ENVIRONMENT="dev"

write_step "Fixing Cognito configuration for $ENVIRONMENT environment"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    write_error "AWS CLI is not installed or not in PATH"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    write_error "jq is not installed or not in PATH"
    exit 1
fi

# Update frontend configuration with real values
write_step "Updating frontend configuration..."
if ./scripts/update-frontend-config.sh -e "$ENVIRONMENT"; then
    write_success "Frontend configuration updated"
else
    write_error "Failed to update frontend configuration"
    exit 1
fi

# Install dependencies if needed
write_step "Installing dependencies..."
npm install --legacy-peer-deps

# Rebuild frontend with updated configuration
write_step "Rebuilding frontend with real Cognito values..."
if [ -f ".env.$ENVIRONMENT" ]; then
    if npm run "build:$ENVIRONMENT"; then
        write_success "Frontend rebuilt with environment-specific configuration"
    else
        write_error "Failed to rebuild frontend"
        exit 1
    fi
else
    write_error "Environment file .env.$ENVIRONMENT not found"
    exit 1
fi

# Get stack outputs for S3 bucket
write_step "Getting deployment information..."
STACK_NAME="carbonlens-ai-$ENVIRONMENT"
STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output json 2>/dev/null)

if [ "$STACK_OUTPUTS" != "null" ] && [ -n "$STACK_OUTPUTS" ]; then
    FRONTEND_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
    CLOUDFRONT_DISTRIBUTION_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
    
    write_success "Frontend Bucket: $FRONTEND_BUCKET"
    write_success "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
else
    write_error "Could not retrieve stack outputs"
    exit 1
fi

# Deploy updated frontend to S3
write_step "Deploying updated frontend to S3..."
if aws s3 sync build/ "s3://$FRONTEND_BUCKET" --delete; then
    write_success "Frontend deployed to S3"
else
    write_error "Failed to deploy frontend to S3"
    exit 1
fi

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ] && [ "$CLOUDFRONT_DISTRIBUTION_ID" != "null" ]; then
    write_step "Invalidating CloudFront cache..."
    if aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" > /dev/null; then
        write_success "CloudFront cache invalidated"
    else
        write_error "Failed to invalidate CloudFront cache"
    fi
else
    write_error "CloudFront Distribution ID not found"
fi

write_success "🎉 Cognito configuration fix completed!"

write_step "Summary:"
echo "  ✅ Frontend configuration updated with real Cognito values"
echo "  ✅ Frontend rebuilt with updated configuration"
echo "  ✅ Updated frontend deployed to S3"
echo "  ✅ CloudFront cache invalidated"

write_step "The application should now work properly at:"
echo "  🌐 https://dev-carbonlens-ai.solutionsynth.cloud/"

write_step "You can verify the fix by:"
echo "  1. Opening the application in a browser"
echo "  2. Checking the browser console for Cognito errors"
echo "  3. Trying to register/login"