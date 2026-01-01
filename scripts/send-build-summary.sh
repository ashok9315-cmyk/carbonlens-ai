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

# Source environment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/environment-config.sh"

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

# Validate environment using shared function
if ! validate_environment "$ENVIRONMENT"; then
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
    
    # Use shared functions to get stack information
    STACK_NAME=$(generate_stack_name "$ENVIRONMENT")
    CLOUDFRONT_DOMAIN=$(get_cloudfront_domain "$ENVIRONMENT")
    API_URL=$(get_api_gateway_url "$ENVIRONMENT")
    FRONTEND_BUCKET=$(get_frontend_bucket_name "$ENVIRONMENT")
    DISTRIBUTION_ID=$(get_cloudfront_distribution_id "$ENVIRONMENT")
    
    if [ -n "$CLOUDFRONT_DOMAIN" ] && [ "$CLOUDFRONT_DOMAIN" != "N/A" ]; then
        echo "☁️  CloudFront: $CLOUDFRONT_DOMAIN"
    else
        echo "☁️  CloudFront: N/A"
    fi
    
    if [ -n "$API_URL" ] && [ "$API_URL" != "N/A" ]; then
        echo "🔌 API Gateway: $API_URL"
    else
        echo "🔌 API Gateway: N/A"
    fi
    
    # If no APP_URL was provided, try to determine it dynamically
    if [ -z "$APP_URL" ]; then
        # Try to get URL using shared function (will try custom domain first, then CloudFront)
        DYNAMIC_URL=$(get_environment_url "$ENVIRONMENT" "true")  # Assume custom domain might be configured
        if [ -n "$DYNAMIC_URL" ]; then
            APP_URL="$DYNAMIC_URL"
            echo "🌐 Application URL: $APP_URL (auto-detected)"
        fi
    fi
    
    # Get detailed artifact information
    write_step "Deployment Artifacts:"
    
    # Lambda functions
    LAMBDA_FUNCTIONS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, '$PROJECT_NAME') && contains(FunctionName, '$ENVIRONMENT')].[FunctionName,Runtime,LastModified,CodeSize]" --output table 2>/dev/null || echo "")
    LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?contains(FunctionName, '$PROJECT_NAME') && contains(FunctionName, '$ENVIRONMENT')] | length(@)" --output text 2>/dev/null || echo "0")
    echo "⚡ Lambda Functions: $LAMBDA_COUNT deployed"
    
    # S3 bucket details
    if [ -n "$FRONTEND_BUCKET" ] && aws s3 ls "s3://$FRONTEND_BUCKET" >/dev/null 2>&1; then
        OBJECT_COUNT=$(aws s3 ls "s3://$FRONTEND_BUCKET" --recursive | wc -l)
        BUCKET_SIZE=$(aws s3 ls "s3://$FRONTEND_BUCKET" --recursive --summarize --human-readable | grep "Total Size" | awk '{print $3 " " $4}' || echo "N/A")
        echo "🪣 S3 Frontend: $OBJECT_COUNT files, $BUCKET_SIZE"
        
        # Get recent uploads
        RECENT_FILES=$(aws s3 ls "s3://$FRONTEND_BUCKET" --recursive | tail -5 | awk '{print $4}' | tr '\n' ', ' | sed 's/,$//')
        if [ -n "$RECENT_FILES" ]; then
            echo "📁 Recent files: $RECENT_FILES"
        fi
    else
        echo "🪣 S3 Frontend: N/A"
    fi
    
    # DynamoDB table
    DYNAMODB_TABLE=$(generate_dynamodb_table_name "$ENVIRONMENT")
    if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" >/dev/null 2>&1; then
        ITEM_COUNT=$(aws dynamodb scan --table-name "$DYNAMODB_TABLE" --select "COUNT" --query "Count" --output text 2>/dev/null || echo "0")
        TABLE_SIZE=$(aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --query "Table.TableSizeBytes" --output text 2>/dev/null || echo "0")
        echo "🗄️  DynamoDB: $ITEM_COUNT items, $(($TABLE_SIZE / 1024)) KB"
    else
        echo "🗄️  DynamoDB: N/A"
    fi
    
    # CloudFront distribution details
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "N/A" ]; then
        DISTRIBUTION_STATUS=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.Status" --output text 2>/dev/null || echo "Unknown")
        echo "🌐 CloudFront Status: $DISTRIBUTION_STATUS"
    fi
    
    # API Gateway endpoints
    if [ -n "$API_URL" ] && [ "$API_URL" != "N/A" ]; then
        API_ID=$(echo "$API_URL" | sed 's/.*\/\/\([^.]*\).*/\1/')
        ENDPOINT_COUNT=$(aws apigateway get-resources --rest-api-id "$API_ID" --query "length(items)" --output text 2>/dev/null || echo "0")
        echo "🔗 API Endpoints: $ENDPOINT_COUNT resources"
    fi
    
    # Cognito User Pool
    USER_POOL_ID=$(get_user_pool_id "$ENVIRONMENT")
    if [ -n "$USER_POOL_ID" ] && [ "$USER_POOL_ID" != "N/A" ]; then
        USER_COUNT=$(aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --query "length(Users)" --output text 2>/dev/null || echo "0")
        echo "👥 Cognito Users: $USER_COUNT registered"
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create comprehensive JSON summary for email/webhook integration
SUMMARY_JSON=$(cat <<EOF
{
  "deployment": {
    "environment": "$ENVIRONMENT",
    "status": "$STATUS",
    "timestamp": "$TIMESTAMP",
    "branch": "$BRANCH",
    "commit": "$COMMIT_SHA",
    "actor": "$ACTOR",
    "duration": "$DURATION",
    "message": "$COMMIT_MESSAGE"
  },
  "application": {
    "name": "$PROJECT_NAME",
    "url": "$APP_URL",
    "domain": "$(generate_domain_name "$ENVIRONMENT")",
    "region": "$AWS_REGION"
  },
  "infrastructure": {
    "stackName": "$(generate_stack_name "$ENVIRONMENT")",
    "cloudfront": {
      "domain": "$CLOUDFRONT_DOMAIN",
      "distributionId": "$DISTRIBUTION_ID",
      "status": "${DISTRIBUTION_STATUS:-N/A}"
    },
    "apiGateway": {
      "url": "$API_URL",
      "endpoints": "${ENDPOINT_COUNT:-0}"
    },
    "lambda": {
      "functionCount": "${LAMBDA_COUNT:-0}"
    },
    "s3": {
      "frontendBucket": "$FRONTEND_BUCKET",
      "objectCount": "${OBJECT_COUNT:-0}",
      "size": "${BUCKET_SIZE:-N/A}"
    },
    "dynamodb": {
      "tableName": "$(generate_dynamodb_table_name "$ENVIRONMENT")",
      "itemCount": "${ITEM_COUNT:-0}",
      "sizeKB": "$((${TABLE_SIZE:-0} / 1024))"
    },
    "cognito": {
      "userPoolId": "$USER_POOL_ID",
      "userCount": "${USER_COUNT:-0}"
    }
  },
  "artifacts": {
    "recentFiles": "${RECENT_FILES:-}",
    "lambdaFunctions": $(echo "${LAMBDA_FUNCTIONS:-[]}" | jq -R -s 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]')
  }
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

# Send email if configured
send_email_summary() {
    local email_recipient="$1"
    local email_subject="$2"
    local email_body="$3"
    
    if [ -n "$email_recipient" ]; then
        write_step "Sending email summary to: $email_recipient"
        
        # Create HTML email body
        HTML_BODY=$(cat <<EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>$email_subject</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .status-success { color: #28a745; font-weight: bold; }
        .status-failure { color: #dc3545; font-weight: bold; }
        .info-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 10px 0; }
        .artifact-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .artifact-table th, .artifact-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .artifact-table th { background-color: #f2f2f2; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .url-button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 CarbonLens AI Deployment Summary</h1>
        <p>Environment: $ENVIRONMENT | Status: <span class="status-$STATUS">$STATUS</span></p>
    </div>
    
    <div class="content">
        <div class="info-box">
            <h3>📋 Deployment Information</h3>
            <p><strong>Environment:</strong> $ENVIRONMENT</p>
            <p><strong>Timestamp:</strong> $TIMESTAMP</p>
            <p><strong>Branch:</strong> $BRANCH</p>
            <p><strong>Commit:</strong> ${COMMIT_SHA:0:8}</p>
            <p><strong>Triggered by:</strong> $ACTOR</p>
            <p><strong>Message:</strong> $COMMIT_MESSAGE</p>
            $([ -n "$DURATION" ] && echo "<p><strong>Duration:</strong> $DURATION</p>")
        </div>
        
        $([ -n "$APP_URL" ] && echo "<div style='text-align: center; margin: 20px 0;'>
            <a href='$APP_URL' class='url-button'>🌐 View Application</a>
        </div>")
        
        <div class="info-box">
            <h3>☁️ Infrastructure Details</h3>
            <table class="artifact-table">
                <tr><th>Service</th><th>Details</th><th>Status</th></tr>
                <tr><td>CloudFront</td><td>$CLOUDFRONT_DOMAIN</td><td>${DISTRIBUTION_STATUS:-N/A}</td></tr>
                <tr><td>API Gateway</td><td>$API_URL</td><td>${ENDPOINT_COUNT:-0} endpoints</td></tr>
                <tr><td>Lambda Functions</td><td>${LAMBDA_COUNT:-0} deployed</td><td>Active</td></tr>
                <tr><td>S3 Frontend</td><td>$FRONTEND_BUCKET</td><td>${OBJECT_COUNT:-0} files, ${BUCKET_SIZE:-N/A}</td></tr>
                <tr><td>DynamoDB</td><td>$(generate_dynamodb_table_name "$ENVIRONMENT")</td><td>${ITEM_COUNT:-0} items</td></tr>
                <tr><td>Cognito</td><td>$USER_POOL_ID</td><td>${USER_COUNT:-0} users</td></tr>
            </table>
        </div>
        
        $([ -n "$RECENT_FILES" ] && echo "<div class='info-box'>
            <h3>📁 Recent Deployments</h3>
            <p>$RECENT_FILES</p>
        </div>")
        
        <div class="info-box">
            <h3>🔗 Quick Links</h3>
            <ul>
                $([ -n "$APP_URL" ] && echo "<li><a href='$APP_URL'>Application URL</a></li>")
                $([ -n "$API_URL" ] && echo "<li><a href='$API_URL'>API Gateway</a></li>")
                <li><a href='https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION#/stacks/stackinfo?stackId=$(generate_stack_name "$ENVIRONMENT")'>CloudFormation Stack</a></li>
                <li><a href='https://console.aws.amazon.com/lambda/home?region=$AWS_REGION'>Lambda Functions</a></li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by CarbonLens AI CI/CD Pipeline | $(date)</p>
        <p>This is an automated message from your deployment system.</p>
    </div>
</body>
</html>
EOF
)
        
        # Send via Gmail SMTP if Gmail credentials are available
        if [ -n "$GMAIL_USER" ] && [ -n "$GMAIL_APP_PASSWORD" ]; then
            write_step "Sending email via Gmail SMTP..."
            
            # Create email with proper headers
            EMAIL_CONTENT=$(cat <<EOF
To: $email_recipient
From: CarbonLens AI <$GMAIL_USER>
Subject: $email_subject
Content-Type: text/html; charset=UTF-8

$HTML_BODY
EOF
)
            
            # Send via Gmail SMTP using curl
            if echo "$EMAIL_CONTENT" | curl -s --url 'smtps://smtp.gmail.com:465' \
                --ssl-reqd \
                --mail-from "$GMAIL_USER" \
                --mail-rcpt "$email_recipient" \
                --user "$GMAIL_USER:$GMAIL_APP_PASSWORD" \
                --upload-file - > /dev/null 2>&1; then
                write_success "Email sent successfully via Gmail SMTP"
                return 0
            else
                write_warning "Failed to send via Gmail SMTP"
            fi
        fi
        
        # Send via AWS SES if available
        if command -v aws >/dev/null 2>&1; then
            write_step "Attempting to send via AWS SES..."
            
            # Create temporary files for email content
            TEMP_HTML="/tmp/email-body-$$.html"
            TEMP_JSON="/tmp/email-message-$$.json"
            
            echo "$HTML_BODY" > "$TEMP_HTML"
            
            # Create SES message JSON
            cat > "$TEMP_JSON" << EOF
{
  "Subject": {
    "Data": "$email_subject",
    "Charset": "UTF-8"
  },
  "Body": {
    "Html": {
      "Data": "$(cat "$TEMP_HTML" | sed 's/"/\\"/g' | tr -d '\n')",
      "Charset": "UTF-8"
    },
    "Text": {
      "Data": "$email_body",
      "Charset": "UTF-8"
    }
  }
}
EOF
            
            # Send email via SES
            if aws ses send-email \
                --source "noreply@solutionsynth.cloud" \
                --destination "ToAddresses=$email_recipient" \
                --message "file://$TEMP_JSON" \
                --region "$AWS_REGION" >/dev/null 2>&1; then
                write_success "Email sent successfully via AWS SES"
            else
                write_warning "Failed to send via AWS SES, trying alternative methods..."
                
                # Fallback: Save email content for manual sending
                EMAIL_FILE="deployment-email-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).html"
                echo "$HTML_BODY" > "$EMAIL_FILE"
                write_warning "Email content saved to: $EMAIL_FILE"
            fi
            
            # Cleanup temporary files
            rm -f "$TEMP_HTML" "$TEMP_JSON"
        else
            write_warning "AWS CLI not available, saving email content to file"
            EMAIL_FILE="deployment-email-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).html"
            echo "$HTML_BODY" > "$EMAIL_FILE"
            write_success "Email content saved to: $EMAIL_FILE"
        fi
    fi
    
    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        write_step "Sending Slack notification..."
        
        SLACK_MESSAGE=$(cat <<EOF
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 CarbonLens AI Deployment $([ "$STATUS" = "success" ] && echo "SUCCESS" || echo "FAILED")"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Environment:* $ENVIRONMENT"
        },
        {
          "type": "mrkdwn",
          "text": "*Status:* $([ "$STATUS" = "success" ] && echo "✅ Success" || echo "❌ Failed")"
        },
        {
          "type": "mrkdwn",
          "text": "*Timestamp:* $TIMESTAMP"
        },
        {
          "type": "mrkdwn",
          "text": "*Actor:* $ACTOR"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Infrastructure Details:*\n☁️ CloudFront: ${CLOUDFRONT_DOMAIN:-N/A}\n🔌 API Gateway: ${API_URL:-N/A}\n⚡ Lambda Functions: ${LAMBDA_COUNT:-0} deployed\n🪣 S3 Objects: ${OBJECT_COUNT:-0} files\n🗄️ DynamoDB: ${ITEM_COUNT:-0} items"
      }
    }$([ -n "$APP_URL" ] && echo ",
    {
      \"type\": \"actions\",
      \"elements\": [
        {
          \"type\": \"button\",
          \"text\": {
            \"type\": \"plain_text\",
            \"text\": \"🌐 View Application\"
          },
          \"url\": \"$APP_URL\",
          \"style\": \"primary\"
        },
        {
          \"type\": \"button\",
          \"text\": {
            \"type\": \"plain_text\",
            \"text\": \"📊 AWS Console\"
          },
          \"url\": \"https://console.aws.amazon.com/cloudformation/home?region=$AWS_REGION\"
        }
      ]
    }")
  ]
}
EOF
)
        
        if curl -X POST -H 'Content-type: application/json' \
            --data "$SLACK_MESSAGE" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1; then
            write_success "Slack notification sent successfully"
        else
            write_warning "Failed to send Slack notification"
        fi
    fi
    
    # Send Discord notification if webhook is configured
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        write_step "Sending Discord notification..."
        
        DISCORD_MESSAGE=$(cat <<EOF
{
  "embeds": [
    {
      "title": "🚀 CarbonLens AI Deployment $([ "$STATUS" = "success" ] && echo "SUCCESS" || echo "FAILED")",
      "color": $([ "$STATUS" = "success" ] && echo "3066993" || echo "15158332"),
      "fields": [
        {
          "name": "Environment",
          "value": "$ENVIRONMENT",
          "inline": true
        },
        {
          "name": "Status", 
          "value": "$([ "$STATUS" = "success" ] && echo "✅ Success" || echo "❌ Failed")",
          "inline": true
        },
        {
          "name": "Actor",
          "value": "$ACTOR",
          "inline": true
        },
        {
          "name": "Infrastructure",
          "value": "☁️ CloudFront: ${CLOUDFRONT_DOMAIN:-N/A}\\n🔌 API: ${API_URL:-N/A}\\n⚡ Lambda: ${LAMBDA_COUNT:-0} functions\\n🪣 S3: ${OBJECT_COUNT:-0} files",
          "inline": false
        }$([ -n "$APP_URL" ] && echo ",
        {
          \"name\": \"Application URL\",
          \"value\": \"[$APP_URL]($APP_URL)\",
          \"inline\": false
        }")
      ],
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
    }
  ]
}
EOF
)
        
        if curl -X POST -H 'Content-type: application/json' \
            --data "$DISCORD_MESSAGE" \
            "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1; then
            write_success "Discord notification sent successfully"
        else
            write_warning "Failed to send Discord notification"
        fi
    fi
}

# Check for email configuration
EMAIL_RECIPIENT="${DEPLOYMENT_EMAIL:-}"
if [ -z "$EMAIL_RECIPIENT" ]; then
    # Try to get from environment variables or GitHub secrets
    EMAIL_RECIPIENT="${GITHUB_EMAIL:-${NOTIFICATION_EMAIL:-}}"
fi

if [ -n "$EMAIL_RECIPIENT" ]; then
    EMAIL_SUBJECT="[$STATUS] CarbonLens AI Deployment - $ENVIRONMENT Environment"
    EMAIL_BODY="CarbonLens AI deployment to $ENVIRONMENT environment completed with status: $STATUS

Environment: $ENVIRONMENT
Timestamp: $TIMESTAMP
Branch: $BRANCH
Commit: ${COMMIT_SHA:0:8}
Triggered by: $ACTOR

$([ -n "$APP_URL" ] && echo "Application URL: $APP_URL")

Infrastructure Summary:
- CloudFront: $CLOUDFRONT_DOMAIN
- API Gateway: $API_URL
- Lambda Functions: ${LAMBDA_COUNT:-0} deployed
- S3 Objects: ${OBJECT_COUNT:-0} files
- DynamoDB Items: ${ITEM_COUNT:-0} records
- Cognito Users: ${USER_COUNT:-0} registered

This is an automated message from your CarbonLens AI deployment system."

    send_email_summary "$EMAIL_RECIPIENT" "$EMAIL_SUBJECT" "$EMAIL_BODY"
else
    write_step "No email recipient configured (set DEPLOYMENT_EMAIL environment variable)"
fi

if [ "$STATUS" = "success" ]; then
    write_success "🎉 Deployment completed successfully!"
    if [ -n "$APP_URL" ]; then
        write_success "🌐 Application is live at: $APP_URL"
    fi
else
    write_error "💥 Deployment failed. Check the logs for details."
fi