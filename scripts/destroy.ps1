#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Destroy CarbonLens AI infrastructure
.DESCRIPTION
    This script destroys the CarbonLens AI infrastructure to avoid AWS charges
.PARAMETER Environment
    The environment to destroy (dev, staging, prod)
.PARAMETER Force
    Skip confirmation prompts
.EXAMPLE
    .\scripts\destroy.ps1 -Environment dev
.EXAMPLE
    .\scripts\destroy.ps1 -Environment dev -Force
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🚀 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

Write-Warning "⚠️  DESTRUCTIVE OPERATION ⚠️"
Write-Warning "This will destroy ALL resources in the $Environment environment!"
Write-Warning "This action cannot be undone!"

if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to destroy the $Environment environment? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled."
        exit 0
    }
    
    $doubleConfirmation = Read-Host "Type 'DESTROY' to confirm"
    if ($doubleConfirmation -ne "DESTROY") {
        Write-Host "Operation cancelled."
        exit 0
    }
}

Write-Step "Starting destruction of $Environment environment..."

# Validate AWS CLI
try {
    aws --version | Out-Null
    Write-Success "AWS CLI is available"
} catch {
    Write-Error "AWS CLI is not installed or not in PATH"
    exit 1
}

# Get AWS Account ID
try {
    $AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
    Write-Success "AWS Account ID: $AWS_ACCOUNT_ID"
} catch {
    Write-Error "Failed to get AWS Account ID. Please check your AWS credentials."
    exit 1
}

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID

# Note: Serverless backend is now deployed via CDK, so no separate cleanup needed
Write-Step "Backend Lambda functions will be destroyed with CDK stack..."

# Empty S3 buckets before destroying stack
Write-Step "Emptying S3 buckets..."
try {
    $frontendBucket = "carbonlens-ai-web-$Environment-$AWS_ACCOUNT_ID"
    $documentsBucket = "carbonlens-ai-docs-$Environment-$AWS_ACCOUNT_ID"
    
    Write-Step "Emptying frontend bucket: $frontendBucket"
    aws s3 rm "s3://$frontendBucket" --recursive 2>$null || Write-Warning "Frontend bucket may not exist or already empty"
    
    Write-Step "Emptying documents bucket: $documentsBucket"
    aws s3 rm "s3://$documentsBucket" --recursive 2>$null || Write-Warning "Documents bucket may not exist or already empty"
    
    Write-Success "S3 buckets emptied"
} catch {
    Write-Warning "Failed to empty S3 buckets: $_"
}

# Destroy CDK Stack
Write-Step "Destroying CDK infrastructure..."
try {
    Push-Location "infrastructure/cdk"
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    
    # Build CDK
    npm run build
    
    # Destroy CDK stack
    npx cdk destroy --force --context "environment=$Environment"
    
    Write-Success "CDK infrastructure destroyed"
} catch {
    Write-Warning "Failed to destroy CDK infrastructure: $_"
} finally {
    Pop-Location
}

# Clean up any remaining CloudFormation stacks
Write-Step "Checking for remaining CloudFormation stacks..."
try {
    $stackName = "carbonlens-ai-$Environment"
    $stackExists = aws cloudformation describe-stacks --stack-name $stackName 2>$null
    
    if ($stackExists) {
        Write-Step "Deleting CloudFormation stack: $stackName"
        aws cloudformation delete-stack --stack-name $stackName
        
        Write-Step "Waiting for stack deletion to complete..."
        aws cloudformation wait stack-delete-complete --stack-name $stackName
        Write-Success "CloudFormation stack deleted"
    } else {
        Write-Success "No CloudFormation stack found"
    }
} catch {
    Write-Warning "Failed to delete CloudFormation stack: $_"
}

# Clean up any remaining resources
Write-Step "Checking for remaining resources..."

# Check for S3 buckets
try {
    $buckets = aws s3api list-buckets --query "Buckets[?contains(Name, 'carbonlens-ai') && contains(Name, '$Environment')].Name" --output text
    if ($buckets) {
        Write-Warning "Found remaining S3 buckets: $buckets"
        Write-Warning "You may need to delete these manually if they contain data"
    }
} catch {
    Write-Warning "Failed to check for remaining S3 buckets"
}

# Check for DynamoDB tables
try {
    $tables = aws dynamodb list-tables --query "TableNames[?contains(@, 'carbonlens-ai') && contains(@, '$Environment')]" --output text
    if ($tables) {
        Write-Warning "Found remaining DynamoDB tables: $tables"
        Write-Warning "You may need to delete these manually"
    }
} catch {
    Write-Warning "Failed to check for remaining DynamoDB tables"
}

# Check for Cognito User Pools
try {
    $userPools = aws cognito-idp list-user-pools --max-items 60 --query "UserPools[?contains(Name, 'carbonlens-ai') && contains(Name, '$Environment')].Name" --output text
    if ($userPools) {
        Write-Warning "Found remaining Cognito User Pools: $userPools"
        Write-Warning "You may need to delete these manually"
    }
} catch {
    Write-Warning "Failed to check for remaining Cognito User Pools"
}

Write-Success "🎉 Destruction completed!"
Write-Step "Summary:"
Write-Host "  Environment: $Environment"
Write-Host "  Serverless backend: Removed"
Write-Host "  CDK infrastructure: Destroyed"
Write-Host "  S3 buckets: Emptied"
Write-Host "  CloudFormation stacks: Deleted"

Write-Warning "Please check your AWS console to ensure all resources have been removed."
Write-Warning "Some resources may take time to fully delete."
Write-Host ""
Write-Host "If you see any remaining resources, you can:"
Write-Host "  1. Wait a few minutes and check again"
Write-Host "  2. Delete them manually in the AWS console"
Write-Host "  3. Run this script again"