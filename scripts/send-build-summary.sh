#!/bin/bash

# Send Build Summary Email
# Usage: ./scripts/send-build-summary.sh [options]
# Options:
#   -e, --environment    Environment deployed (dev, staging, prod) [required]
#   -s, --status         Build status (success, failure) [required]
#   -u, --url            Application URL [optional]
#   -d, --duration       Build duration [optional]
#   -h, --help           Show this help message

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
write_step() {
    echo -e "${BLUE}📧 $1${NC}"
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
    echo "Send Build Summary Email"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment deployed (dev, staging, prod) [required]"
    echo "  -s, --status         Build status (success, failure) [required]"
    echo "  -u, --url            Application URL [optional]"
    echo "  -d, --duration       Build duration [optional]"
    echo "  -h, --help           Show this help message"
}

# Default values
ENVIRONMENT=""
STATUS=""
APP_URL=""
DURATION=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--status)
            STATUS="$2"
            shift 2
            ;;
        -u|--url)
            APP_URL="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION="$2"
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
    exit 1
fi

if [ -z "$STATUS" ]; then
    write_error "Status is required. Use -s or --status"
    exit 1
fi

write_step "Generating build summary for $ENVIRONMENT environment..."

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')
COMMIT_SHA=${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo "unknown")}
COMMIT_MESSAGE=${GITHUB_EVENT_HEAD_COMMIT_MESSAGE:-$(git log -1 --pretty=%B 2>/dev/null || echo "No commit message")}
BRANCH=${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || echo "unknown")}
ACTOR=${GITHUB_ACTOR:-$(whoami)}

# Set status emoji and color
if [ "$STATUS" = "success" ]; then
    STATUS_EMOJI="✅"
    STATUS_COLOR="green"
else
    STATUS_EMOJI="❌"
    STATUS_COLOR="red"
fi

# Generate summary
write_step "Build Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$STATUS_EMOJI CarbonLens AI - Build $STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 Environment: $ENVIRONMENT"
echo "📅 Timestamp: $TIMESTAMP"
echo "🔗 Branch: $BRANCH"
echo "👤 Triggered by: $ACTOR"
echo "📝 Commit: ${COMMIT_SHA:0:8}"
echo "💬 Message: $COMMIT_MESSAGE"
if [ -n "$DURATION" ]; then
    echo "⏱️  Duration: $DURATION"
fi
if [ -n "$APP_URL" ]; then
    echo "🌐 Application URL: $APP_URL"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get infrastructure details
if [ "$STATUS" = "success" ]; then
    write_step "Infrastructure Details:"
    
    # Get CloudFormation stack info
    STACK_NAME="carbonlens-ai-$ENVIRONMENT"
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
        CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' --output text 2>/dev/null || echo "N/A")
        API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text 2>/dev/null || echo "N/A")
        
        echo "☁️  CloudFront: $CLOUDFRONT_DOMAIN"
        echo "🔌 API Gateway: $API_URL"
    fi
    
    # Get Lambda function count
    LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'carbonlens-ai') && contains(FunctionName, '$ENVIRONMENT')] | length(@)" --output text 2>/dev/null || echo "0")
    echo "⚡ Lambda Functions: $LAMBDA_COUNT deployed"
    
    # Get S3 bucket info
    FRONTEND_BUCKET="carbonlens-ai-web-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text 2>/dev/null)"
    if aws s3 ls "s3://$FRONTEND_BUCKET" >/dev/null 2>&1; then
        OBJECT_COUNT=$(aws s3 ls "s3://$FRONTEND_BUCKET" --recursive | wc -l)
        echo "🪣 S3 Objects: $OBJECT_COUNT files deployed"
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create JSON summary for potential webhook/email integration
SUMMARY_JSON=$(cat <<EOF
{
  "environment": "$ENVIRONMENT",
  "status": "$STATUS",
  "timestamp": "$TIMESTAMP",
  "branch": "$BRANCH",
  "commit": "$COMMIT_SHA",
  "actor": "$ACTOR",
  "duration": "$DURATION",
  "appUrl": "$APP_URL",
  "message": "$COMMIT_MESSAGE"
}
EOF
)

# Save summary to file
SUMMARY_FILE="build-summary-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
echo "$SUMMARY_JSON" > "$SUMMARY_FILE"

write_success "Build summary saved to: $SUMMARY_FILE"

# In a real implementation, you could send this via:
# - AWS SES (Simple Email Service)
# - Slack webhook
# - Microsoft Teams webhook
# - Discord webhook
# - Custom email service

write_step "Build summary generated successfully!"

if [ "$STATUS" = "success" ]; then
    write_success "🎉 Deployment completed successfully!"
    if [ -n "$APP_URL" ]; then
        write_success "🌐 Application is live at: $APP_URL"
    fi
else
    write_error "💥 Deployment failed. Check the logs for details."
fi