#!/bin/bash

# Destroy CarbonLens AI infrastructure
# Usage: ./scripts/destroy.sh [options]
# Options:
#   -e, --environment    Environment to destroy (dev, staging, prod) [required]
#   -f, --force          Skip confirmation prompts
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/destroy.sh -e dev
#   ./scripts/destroy.sh -e dev -f

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
    echo "Destroy CarbonLens AI infrastructure"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to destroy (dev, staging, prod) [required]"
    echo "  -f, --force          Skip confirmation prompts"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e dev"
    echo "  $0 -e dev -f"
}

# Default values
ENVIRONMENT=""
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
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

write_warning "⚠️  DESTRUCTIVE OPERATION ⚠️"
write_warning "This will destroy ALL resources in the $ENVIRONMENT environment!"
write_warning "This action cannot be undone!"

if [ "$FORCE" = false ]; then
    echo -n "Are you sure you want to destroy the $ENVIRONMENT environment? (yes/no): "
    read -r confirmation
    if [ "$confirmation" != "yes" ]; then
        echo "Operation cancelled."
        exit 0
    fi
    
    echo -n "Type 'DESTROY' to confirm: "
    read -r double_confirmation
    if [ "$double_confirmation" != "DESTROY" ]; then
        echo "Operation cancelled."
        exit 0
    fi
fi

write_step "Starting destruction of $ENVIRONMENT environment..."

# Validate AWS CLI
if ! command -v aws &> /dev/null; then
    write_error "AWS CLI is not installed or not in PATH"
    exit 1
fi
write_success "AWS CLI is available"

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

# Note: Serverless backend is now deployed via CDK, so no separate cleanup needed
write_step "Backend Lambda functions will be destroyed with CDK stack..."

# Empty S3 buckets before destroying stack
write_step "Emptying S3 buckets..."
FRONTEND_BUCKET="carbonlens-ai-web-$ENVIRONMENT-$AWS_ACCOUNT_ID"
DOCUMENTS_BUCKET="carbonlens-ai-docs-$ENVIRONMENT-$AWS_ACCOUNT_ID"

write_step "Emptying frontend bucket: $FRONTEND_BUCKET"
aws s3 rm "s3://$FRONTEND_BUCKET" --recursive 2>/dev/null || write_warning "Frontend bucket may not exist or already empty"

write_step "Emptying documents bucket: $DOCUMENTS_BUCKET"
aws s3 rm "s3://$DOCUMENTS_BUCKET" --recursive 2>/dev/null || write_warning "Documents bucket may not exist or already empty"

write_success "S3 buckets emptied"

# Destroy CDK Stack
write_step "Destroying CDK infrastructure..."
cd infrastructure/cdk

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build CDK
npm run build

# Destroy CDK stack
if npx cdk destroy --force --context "environment=$ENVIRONMENT"; then
    write_success "CDK infrastructure destroyed"
else
    write_warning "Failed to destroy CDK infrastructure"
fi

cd ../..

# Clean up any remaining CloudFormation stacks
write_step "Checking for remaining CloudFormation stacks..."
STACK_NAME="carbonlens-ai-$ENVIRONMENT"
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
    write_step "Deleting CloudFormation stack: $STACK_NAME"
    aws cloudformation delete-stack --stack-name "$STACK_NAME"
    
    write_step "Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
    write_success "CloudFormation stack deleted"
else
    write_success "No CloudFormation stack found"
fi

# Clean up any remaining resources
write_step "Checking for remaining resources..."

# Check for S3 buckets
BUCKETS=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'carbonlens-ai') && contains(Name, '$ENVIRONMENT')].Name" --output text 2>/dev/null || echo "")
if [ -n "$BUCKETS" ]; then
    write_warning "Found remaining S3 buckets: $BUCKETS"
    write_warning "You may need to delete these manually if they contain data"
fi

# Check for DynamoDB tables
TABLES=$(aws dynamodb list-tables --query "TableNames[?contains(@, 'carbonlens-ai') && contains(@, '$ENVIRONMENT')]" --output text 2>/dev/null || echo "")
if [ -n "$TABLES" ]; then
    write_warning "Found remaining DynamoDB tables: $TABLES"
    write_warning "You may need to delete these manually"
fi

# Check for Cognito User Pools
USER_POOLS=$(aws cognito-idp list-user-pools --max-items 60 --query "UserPools[?contains(Name, 'carbonlens-ai') && contains(Name, '$ENVIRONMENT')].Name" --output text 2>/dev/null || echo "")
if [ -n "$USER_POOLS" ]; then
    write_warning "Found remaining Cognito User Pools: $USER_POOLS"
    write_warning "You may need to delete these manually"
fi

write_success "🎉 Destruction completed!"
write_step "Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Serverless backend: Removed"
echo "  CDK infrastructure: Destroyed"
echo "  S3 buckets: Emptied"
echo "  CloudFormation stacks: Deleted"

write_warning "Please check your AWS console to ensure all resources have been removed."
write_warning "Some resources may take time to fully delete."
echo ""
echo "If you see any remaining resources, you can:"
echo "  1. Wait a few minutes and check again"
echo "  2. Delete them manually in the AWS console"
echo "  3. Run this script again"