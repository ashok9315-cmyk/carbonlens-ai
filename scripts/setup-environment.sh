#!/bin/bash

# Setup development environment for CarbonLens AI
# Usage: ./scripts/setup-environment.sh [options]
# Options:
#   -e, --environment    Environment to setup (dev, staging, prod) [default: dev]
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/setup-environment.sh
#   ./scripts/setup-environment.sh -e dev

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
    echo "Setup development environment for CarbonLens AI"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to setup (dev, staging, prod) [default: dev]"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 -e dev"
}

# Default values
ENVIRONMENT="dev"

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

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    write_error "Invalid environment. Must be dev, staging, or prod"
    exit 1
fi

write_step "Setting up CarbonLens AI development environment..."

# Check Node.js
write_step "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    write_success "Node.js version: $NODE_VERSION"
else
    write_error "Node.js is not installed. Please install Node.js 18 or later."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check npm
write_step "Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    write_success "npm version: $NPM_VERSION"
else
    write_error "npm is not available"
    exit 1
fi

# Check AWS CLI
write_step "Checking AWS CLI installation..."
if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    write_success "AWS CLI: $AWS_VERSION"
else
    write_error "AWS CLI is not installed. Please install AWS CLI v2."
    echo "Download from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
write_step "Checking AWS credentials..."
if AWS_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null); then
    AWS_ACCOUNT=$(echo "$AWS_IDENTITY" | jq -r '.Account')
    AWS_USER=$(echo "$AWS_IDENTITY" | jq -r '.Arn')
    write_success "AWS Account: $AWS_ACCOUNT"
    write_success "AWS User: $AWS_USER"
else
    write_error "AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

# Install root dependencies
write_step "Installing root dependencies..."
if npm install --legacy-peer-deps; then
    write_success "Root dependencies installed"
else
    write_error "Failed to install root dependencies"
    exit 1
fi

# Install backend dependencies
write_step "Installing backend dependencies..."
cd backend
if npm install --legacy-peer-deps; then
    write_success "Backend dependencies installed"
else
    write_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install CDK dependencies
write_step "Installing CDK dependencies..."
cd infrastructure/cdk
if npm install; then
    write_success "CDK dependencies installed"
else
    write_error "Failed to install CDK dependencies"
    exit 1
fi
cd ../..

# Install AWS CDK globally if not present
write_step "Checking AWS CDK installation..."
if npx cdk --version &> /dev/null; then
    CDK_VERSION=$(npx cdk --version)
    write_success "AWS CDK: $CDK_VERSION"
else
    write_step "Installing AWS CDK globally..."
    npm install -g aws-cdk
    write_success "AWS CDK installed globally"
fi

# Create .env file template
write_step "Creating environment configuration..."
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << EOF
# CarbonLens AI Environment Configuration - $ENVIRONMENT
ENVIRONMENT=$ENVIRONMENT
AWS_REGION=us-east-1

# Domain Configuration (optional)
DOMAIN_NAME=
CERTIFICATE_ARN=
HOSTED_ZONE_ID=

# API Configuration
API_BASE_URL=

# Cognito Configuration
COGNITO_USER_POOL_ID=
COGNITO_USER_POOL_CLIENT_ID=

# S3 Configuration
FRONTEND_BUCKET=
DOCUMENTS_BUCKET=

# DynamoDB Configuration
DYNAMODB_TABLE=

# CloudFront Configuration
CLOUDFRONT_DISTRIBUTION_ID=
EOF
    
    write_success "Environment file created: $ENV_FILE"
    write_warning "Please update the environment variables in $ENV_FILE"
else
    write_success "Environment file already exists: $ENV_FILE"
fi

# Run tests to verify setup
write_step "Running tests to verify setup..."
if npm test -- --watchAll=false --passWithNoTests &> /dev/null; then
    write_success "Frontend tests passed"
else
    write_warning "Frontend tests failed, but continuing setup"
fi

cd backend
if npm test -- --watchAll=false --passWithNoTests &> /dev/null; then
    write_success "Backend tests passed"
else
    write_warning "Backend tests failed, but continuing setup"
fi
cd ..

# Build CDK to verify setup
write_step "Building CDK to verify setup..."
cd infrastructure/cdk
if npm run build; then
    write_success "CDK build successful"
else
    write_warning "CDK build failed, but continuing setup"
fi
cd ../..

write_success "🎉 Environment setup completed!"
write_step "Next steps:"
echo "  1. Update environment variables in .env.$ENVIRONMENT"
echo "  2. Run: ./scripts/deploy.sh -e $ENVIRONMENT"
echo "  3. Visit your deployed application"

write_step "Useful commands:"
echo "  Deploy: ./scripts/deploy.sh -e $ENVIRONMENT"
echo "  Test: npm test"
echo "  Build: npm run build"
echo "  CDK Diff: cd infrastructure/cdk && npx cdk diff"
echo "  CDK Synth: cd infrastructure/cdk && npx cdk synth"