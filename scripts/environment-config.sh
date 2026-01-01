#!/bin/bash

# Environment Configuration for CarbonLens AI
# This file contains reusable functions for environment-specific configurations
# Usage: source scripts/environment-config.sh

# Base configuration
export BASE_DOMAIN="solutionsynth.cloud"
export PROJECT_NAME="carbonlens-ai"
export AWS_REGION="us-east-1"

# Function to generate domain name based on environment
generate_domain_name() {
    local env=$1
    
    case $env in
        "dev")
            echo "dev-${PROJECT_NAME}.${BASE_DOMAIN}"
            ;;
        "staging")
            echo "staging-${PROJECT_NAME}.${BASE_DOMAIN}"
            ;;
        "prod")
            echo "${PROJECT_NAME}.${BASE_DOMAIN}"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Function to generate stack name based on environment
generate_stack_name() {
    local env=$1
    echo "${PROJECT_NAME}-${env}"
}

# Function to generate S3 bucket names based on environment
generate_bucket_names() {
    local env=$1
    local aws_account_id=$2
    
    echo "frontend:${PROJECT_NAME}-web-${env}-${aws_account_id}"
    echo "documents:${PROJECT_NAME}-docs-${env}-${aws_account_id}"
}

# Function to generate DynamoDB table name based on environment
generate_dynamodb_table_name() {
    local env=$1
    echo "${PROJECT_NAME}-data-${env}"
}

# Function to validate environment
validate_environment() {
    local env=$1
    
    case $env in
        "dev"|"staging"|"prod")
            return 0
            ;;
        *)
            echo "❌ Invalid environment: $env. Must be dev, staging, or prod"
            return 1
            ;;
    esac
}

# Function to get environment-specific feature flags
get_feature_flags() {
    local env=$1
    
    case $env in
        "dev")
            echo "debug_mode:true"
            echo "mock_data:true"
            echo "analytics:false"
            echo "show_env_banner:true"
            ;;
        "staging")
            echo "debug_mode:false"
            echo "mock_data:false"
            echo "analytics:true"
            echo "show_env_banner:true"
            ;;
        "prod")
            echo "debug_mode:false"
            echo "mock_data:false"
            echo "analytics:true"
            echo "show_env_banner:false"
            ;;
    esac
}

# Function to get CloudFormation stack outputs
get_stack_outputs() {
    local env=$1
    local stack_name=$(generate_stack_name "$env")
    
    if aws cloudformation describe-stacks --stack-name "$stack_name" >/dev/null 2>&1; then
        aws cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].Outputs' --output json 2>/dev/null
    else
        echo "null"
    fi
}

# Function to get specific stack output value
get_stack_output_value() {
    local env=$1
    local output_key=$2
    local stack_outputs=$(get_stack_outputs "$env")
    
    if [ "$stack_outputs" != "null" ] && [ -n "$stack_outputs" ]; then
        echo "$stack_outputs" | jq -r ".[] | select(.OutputKey==\"$output_key\") | .OutputValue" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Function to get CloudFront domain from stack
get_cloudfront_domain() {
    local env=$1
    get_stack_output_value "$env" "CloudFrontDomainName"
}

# Function to get API Gateway URL from stack
get_api_gateway_url() {
    local env=$1
    get_stack_output_value "$env" "ApiGatewayUrl"
}

# Function to get Cognito User Pool ID from stack
get_user_pool_id() {
    local env=$1
    get_stack_output_value "$env" "UserPoolId"
}

# Function to get Cognito User Pool Client ID from stack
get_user_pool_client_id() {
    local env=$1
    get_stack_output_value "$env" "UserPoolClientId"
}

# Function to get frontend bucket name from stack
get_frontend_bucket_name() {
    local env=$1
    get_stack_output_value "$env" "FrontendBucketName"
}

# Function to get CloudFront distribution ID from stack
get_cloudfront_distribution_id() {
    local env=$1
    get_stack_output_value "$env" "CloudFrontDistributionId"
}

# Function to determine the best URL for an environment
get_environment_url() {
    local env=$1
    local custom_domain_configured=${2:-false}
    
    if [ "$custom_domain_configured" = "true" ]; then
        # Use custom domain
        local domain=$(generate_domain_name "$env")
        if [ -n "$domain" ]; then
            echo "https://$domain"
            return 0
        fi
    fi
    
    # Fallback to CloudFront domain
    local cloudfront_domain=$(get_cloudfront_domain "$env")
    if [ -n "$cloudfront_domain" ] && [ "$cloudfront_domain" != "None" ] && [ "$cloudfront_domain" != "null" ]; then
        echo "https://$cloudfront_domain"
        return 0
    fi
    
    # No URL available
    echo ""
    return 1
}

# Function to print environment summary
print_environment_summary() {
    local env=$1
    local custom_domain_configured=${2:-false}
    
    echo "🌍 Environment: $env"
    echo "📦 Stack Name: $(generate_stack_name "$env")"
    echo "🌐 Domain: $(generate_domain_name "$env")"
    echo "🔗 URL: $(get_environment_url "$env" "$custom_domain_configured")"
    echo "☁️ CloudFront: $(get_cloudfront_domain "$env")"
    echo "🔌 API Gateway: $(get_api_gateway_url "$env")"
    echo "🪣 Frontend Bucket: $(get_frontend_bucket_name "$env")"
}

# Export functions for use in other scripts
export -f generate_domain_name
export -f generate_stack_name
export -f generate_bucket_names
export -f generate_dynamodb_table_name
export -f validate_environment
export -f get_feature_flags
export -f get_stack_outputs
export -f get_stack_output_value
export -f get_cloudfront_domain
export -f get_api_gateway_url
export -f get_user_pool_id
export -f get_user_pool_client_id
export -f get_frontend_bucket_name
export -f get_cloudfront_distribution_id
export -f get_environment_url
export -f print_environment_summary