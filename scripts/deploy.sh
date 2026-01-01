#!/bin/bash

# Deploy CarbonLens AI application to AWS
# Usage: ./scripts/deploy.sh [options]
# Options:
#   -e, --environment    Environment to deploy to (dev, staging, prod) [required]
#   -d, --domain         Custom domain name (optional)
#   -c, --certificate    SSL Certificate ARN (optional)
#   -z, --zone           Route 53 Hosted Zone ID (optional)
#   --skip-infrastructure Skip infrastructure deployment
#   --skip-backend       Skip backend deployment
#   --skip-frontend      Skip frontend deployment
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/deploy.sh -e dev
#   ./scripts/deploy.sh -e prod -d "carbonlens-ai.solutionsynth.cloud" -c "arn:aws:acm:..." -z "Z123..."

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
write_step() {
    echo -e "${BLUE}🚀 $1${NC}"
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
    echo "Deploy CarbonLens AI application to AWS"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to deploy to (dev, staging, prod) [required]"
    echo "  -d, --domain         Custom domain name (optional)"
    echo "  -c, --certificate    SSL Certificate ARN (optional)"
    echo "  -z, --zone           Route 53 Hosted Zone ID (optional)"
    echo "  --skip-infrastructure Skip infrastructure deployment"
    echo "  --skip-backend       Skip backend deployment"
    echo "  --skip-frontend      Skip frontend deployment"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev"
    echo "  $0 -e prod -d \"carbonlens-ai.solutionsynth.cloud\" -c \"arn:aws:acm:...\" -z \"Z123...\""
}

# Default values
ENVIRONMENT=""
DOMAIN_NAME=""
CERTIFICATE_ARN=""
HOSTED_ZONE_ID=""
SKIP_INFRASTRUCTURE=false
SKIP_BACKEND=false
SKIP_FRONTEND=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -c|--certificate)
            CERTIFICATE_ARN="$2"
            shift 2
            ;;
        -z|--zone)
            HOSTED_ZONE_ID="$2"
            shift 2
            ;;
        --skip-infrastructure)
            SKIP_INFRASTRUCTURE=true
            shift
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
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

write_step "Starting deployment for environment: $ENVIRONMENT"

# Validate AWS CLI
if ! command -v aws &> /dev/null; then
    write_error "AWS CLI is not installed or not in PATH"
    exit 1
fi
write_success "AWS CLI is available"

# Validate Node.js
if ! command -v node &> /dev/null; then
    write_error "Node.js is not installed or not in PATH"
    exit 1
fi
write_success "Node.js is available"

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
if [ $? -ne 0 ]; then
    write_error "Failed to get AWS Account ID. Please check your AWS credentials."
    exit 1
fi
write_success "AWS Account ID: $AWS_ACCOUNT_ID"

# Set environment variables
export ENVIRONMENT="$ENVIRONMENT"
export AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
if [ -n "$DOMAIN_NAME" ]; then export DOMAIN_NAME="$DOMAIN_NAME"; fi
if [ -n "$CERTIFICATE_ARN" ]; then export CERTIFICATE_ARN="$CERTIFICATE_ARN"; fi
if [ -n "$HOSTED_ZONE_ID" ]; then export HOSTED_ZONE_ID="$HOSTED_ZONE_ID"; fi

# Deploy Infrastructure with CDK
if [ "$SKIP_INFRASTRUCTURE" = false ]; then
    write_step "Deploying infrastructure with AWS CDK..."
    
    cd infrastructure/cdk
    
    # Install CDK dependencies
    write_step "Installing CDK dependencies..."
    npm install
    
    # Bootstrap CDK (if needed)
    write_step "Bootstrapping CDK..."
    npx cdk bootstrap --require-approval never
    
    # Build CDK
    write_step "Building CDK..."
    npm run build
    
    # Deploy CDK stack
    write_step "Deploying CDK stack..."
    CDK_ARGS="deploy --require-approval never --context environment=$ENVIRONMENT"
    
    if [ -n "$DOMAIN_NAME" ]; then
        CDK_ARGS="$CDK_ARGS --context domainName=$DOMAIN_NAME"
    fi
    
    if [ -n "$CERTIFICATE_ARN" ]; then
        CDK_ARGS="$CDK_ARGS --context certificateArn=$CERTIFICATE_ARN"
    fi
    
    if [ -n "$HOSTED_ZONE_ID" ]; then
        CDK_ARGS="$CDK_ARGS --context hostedZoneId=$HOSTED_ZONE_ID"
    fi
    
    if ! npx cdk $CDK_ARGS; then
        write_error "CDK deployment failed"
        exit 1
    fi
    
    write_success "Infrastructure deployed successfully"
    
    # Update frontend configuration with actual deployment values
    write_step "Updating frontend configuration..."
    cd ../..
    if ./scripts/update-frontend-config.sh -e "$ENVIRONMENT"; then
        write_success "Frontend configuration updated"
    else
        write_warning "Could not update frontend configuration"
    fi
    
    # Get stack outputs
    write_step "Getting stack outputs..."
    STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "carbonlens-ai-$ENVIRONMENT" --query 'Stacks[0].Outputs' --output json 2>/dev/null || echo "null")
    
    if [ "$STACK_OUTPUTS" != "null" ] && [ -n "$STACK_OUTPUTS" ]; then
        FRONTEND_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
        DOCUMENTS_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="DocumentsBucketName") | .OutputValue')
        USER_POOL_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
        USER_POOL_CLIENT_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
        CLOUDFRONT_DISTRIBUTION_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
        DYNAMODB_TABLE_NAME=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="DynamoDBTableName") | .OutputValue')
        CLOUDFRONT_DOMAIN=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDomainName") | .OutputValue')
        API_URL=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
        
        write_success "Frontend Bucket: $FRONTEND_BUCKET"
        write_success "Documents Bucket: $DOCUMENTS_BUCKET"
        write_success "User Pool ID: $USER_POOL_ID"
        write_success "CloudFront Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
        write_success "CloudFront Domain: $CLOUDFRONT_DOMAIN"
        write_success "API Gateway URL: $API_URL"
        
        # Update frontend configuration with actual values
        write_step "Updating frontend configuration..."
        if ./scripts/update-frontend-config.sh -e "$ENVIRONMENT"; then
            write_success "Frontend configuration updated with deployment values"
        else
            write_warning "Could not update frontend configuration"
        fi
        
    else
        write_warning "Could not retrieve stack outputs, using fallback values"
        FRONTEND_BUCKET="carbonlens-ai-web-$ENVIRONMENT-$AWS_ACCOUNT_ID"
        DOCUMENTS_BUCKET="carbonlens-ai-docs-$ENVIRONMENT-$AWS_ACCOUNT_ID"
        DYNAMODB_TABLE_NAME="carbonlens-ai-data-$ENVIRONMENT"
        CLOUDFRONT_DISTRIBUTION_ID=""
        CLOUDFRONT_DOMAIN=""
    fi
    
else
    write_warning "Skipping infrastructure deployment"
    
    # Get existing stack outputs
    STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "carbonlens-ai-$ENVIRONMENT" --query 'Stacks[0].Outputs' --output json 2>/dev/null || echo "null")
    
    if [ "$STACK_OUTPUTS" != "null" ] && [ -n "$STACK_OUTPUTS" ]; then
        FRONTEND_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
        CLOUDFRONT_DISTRIBUTION_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
        DYNAMODB_TABLE_NAME=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="DynamoDBTableName") | .OutputValue')
        CLOUDFRONT_DOMAIN=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDomainName") | .OutputValue')
        
        write_success "Using existing stack outputs"
    else
        write_warning "Could not retrieve existing stack outputs, using fallback values"
        FRONTEND_BUCKET="carbonlens-ai-web-$ENVIRONMENT-$AWS_ACCOUNT_ID"
        DYNAMODB_TABLE_NAME="carbonlens-ai-data-$ENVIRONMENT"
        CLOUDFRONT_DISTRIBUTION_ID=""
        CLOUDFRONT_DOMAIN=""
    fi
fi

# Deploy Backend (now handled by CDK)
if [ "$SKIP_BACKEND" = false ]; then
    write_step "Backend deployment is now handled by CDK infrastructure..."
    write_success "Lambda functions deployed with CDK stack"
else
    write_warning "Skipping backend deployment (handled by CDK)"
fi

# Deploy Frontend
if [ "$SKIP_FRONTEND" = false ]; then
    write_step "Deploying frontend..."
    
    # Install frontend dependencies
    write_step "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    # Build frontend
    write_step "Building frontend..."
    export CI=false  # Treat warnings as warnings, not errors
    npm run build
    
    # Deploy to S3
    write_step "Uploading to S3..."
    if [ -n "$FRONTEND_BUCKET" ]; then
        aws s3 sync build/ "s3://$FRONTEND_BUCKET" --delete --cache-control "max-age=86400"
    else
        write_error "Frontend bucket name is empty, cannot deploy"
        exit 1
    fi
    
    # Invalidate CloudFront cache
    write_step "Invalidating CloudFront cache..."
    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
    else
        write_warning "CloudFront distribution ID not found, skipping cache invalidation"
    fi
    
    write_success "Frontend deployed successfully"
    
else
    write_warning "Skipping frontend deployment"
fi

# Final success message
write_success "🎉 Deployment completed successfully!"

if [ -n "$DOMAIN_NAME" ]; then
    write_success "🌐 Application URL: https://$DOMAIN_NAME"
elif [ -n "$CLOUDFRONT_DOMAIN" ]; then
    write_success "🌐 Application URL: https://$CLOUDFRONT_DOMAIN"
else
    write_success "🌐 Application deployed successfully"
fi

write_step "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Frontend Bucket: $FRONTEND_BUCKET"
echo "  CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
if [ -n "$DOMAIN_NAME" ]; then
    echo "  Custom Domain: $DOMAIN_NAME"
fi
echo "  DynamoDB Table: $DYNAMODB_TABLE_NAME"