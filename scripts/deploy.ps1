#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy CarbonLens AI application to AWS
.DESCRIPTION
    This script deploys the CarbonLens AI application including infrastructure, backend, and frontend
.PARAMETER Environment
    The environment to deploy to (dev, staging, prod)
.PARAMETER DomainName
    Custom domain name (optional)
.PARAMETER CertificateArn
    SSL Certificate ARN (optional)
.PARAMETER HostedZoneId
    Route 53 Hosted Zone ID (optional)
.PARAMETER SkipInfrastructure
    Skip infrastructure deployment
.PARAMETER SkipBackend
    Skip backend deployment
.PARAMETER SkipFrontend
    Skip frontend deployment
.EXAMPLE
    .\scripts\deploy.ps1 -Environment dev
.EXAMPLE
    .\scripts\deploy.ps1 -Environment prod -DomainName "carbonlens-ai.solutionsynth.cloud" -CertificateArn "arn:aws:acm:..." -HostedZoneId "Z123..."
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [string]$DomainName = "",
    
    [Parameter(Mandatory = $false)]
    [string]$CertificateArn = "",
    
    [Parameter(Mandatory = $false)]
    [string]$HostedZoneId = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipInfrastructure,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBackend,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipFrontend
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

# Validate AWS CLI
try {
    aws --version | Out-Null
    Write-Success "AWS CLI is available"
} catch {
    Write-Error "AWS CLI is not installed or not in PATH"
    exit 1
}

# Validate Node.js
try {
    node --version | Out-Null
    Write-Success "Node.js is available"
} catch {
    Write-Error "Node.js is not installed or not in PATH"
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

Write-Step "Starting deployment for environment: $Environment"

# Set environment variables
$env:ENVIRONMENT = $Environment
$env:AWS_ACCOUNT_ID = $AWS_ACCOUNT_ID
if ($DomainName) { $env:DOMAIN_NAME = $DomainName }
if ($CertificateArn) { $env:CERTIFICATE_ARN = $CertificateArn }
if ($HostedZoneId) { $env:HOSTED_ZONE_ID = $HostedZoneId }

# Deploy Infrastructure with CDK
if (-not $SkipInfrastructure) {
    Write-Step "Deploying infrastructure with AWS CDK..."
    
    try {
        Push-Location "infrastructure/cdk"
        
        # Install CDK dependencies
        Write-Step "Installing CDK dependencies..."
        npm install
        
        # Bootstrap CDK (if needed)
        Write-Step "Bootstrapping CDK..."
        npx cdk bootstrap --require-approval never
        
        # Build CDK
        Write-Step "Building CDK..."
        npm run build
        
        # Deploy CDK stack
        Write-Step "Deploying CDK stack..."
        $cdkArgs = @(
            "deploy"
            "--require-approval", "never"
            "--context", "environment=$Environment"
        )
        
        if ($DomainName) {
            $cdkArgs += "--context"
            $cdkArgs += "domainName=$DomainName"
        }
        
        if ($CertificateArn) {
            $cdkArgs += "--context"
            $cdkArgs += "certificateArn=$CertificateArn"
        }
        
        if ($HostedZoneId) {
            $cdkArgs += "--context"
            $cdkArgs += "hostedZoneId=$HostedZoneId"
        }
        
        npx cdk @cdkArgs
        
        Write-Success "Infrastructure deployed successfully"
        
        # Get stack outputs
        Write-Step "Getting stack outputs..."
        $stackOutputs = aws cloudformation describe-stacks --stack-name "carbonlens-ai-$Environment" --query 'Stacks[0].Outputs' --output json 2>$null
        
        if ($stackOutputs) {
            $stackOutputsObj = $stackOutputs | ConvertFrom-Json
            
            # Extract important values
            $frontendBucket = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
            $documentsBucket = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "DocumentsBucketName" }).OutputValue
            $userPoolId = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
            $userPoolClientId = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
            $cloudFrontDistributionId = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
            $dynamoDBTableName = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "DynamoDBTableName" }).OutputValue
            $cloudFrontDomain = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue
            
            Write-Success "Frontend Bucket: $frontendBucket"
            Write-Success "Documents Bucket: $documentsBucket"
            Write-Success "User Pool ID: $userPoolId"
            Write-Success "CloudFront Distribution ID: $cloudFrontDistributionId"
            Write-Success "CloudFront Domain: $cloudFrontDomain"
        } else {
            Write-Warning "Could not retrieve stack outputs, using fallback values"
            $frontendBucket = "carbonlens-ai-web-$Environment-$AWS_ACCOUNT_ID"
            $documentsBucket = "carbonlens-ai-docs-$Environment-$AWS_ACCOUNT_ID"
            $dynamoDBTableName = "carbonlens-ai-data-$Environment"
            $cloudFrontDistributionId = ""
            $cloudFrontDomain = ""
        }
        
    } catch {
        Write-Error "Infrastructure deployment failed: $_"
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Skipping infrastructure deployment"
    
    # Get existing stack outputs
    try {
        $stackOutputs = aws cloudformation describe-stacks --stack-name "carbonlens-ai-$Environment" --query 'Stacks[0].Outputs' --output json 2>$null
        
        if ($stackOutputs) {
            $stackOutputsObj = $stackOutputs | ConvertFrom-Json
            $frontendBucket = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
            $cloudFrontDistributionId = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
            $dynamoDBTableName = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "DynamoDBTableName" }).OutputValue
            $cloudFrontDomain = ($stackOutputsObj | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue
        } else {
            Write-Warning "Could not retrieve stack outputs, using fallback values"
            $frontendBucket = "carbonlens-ai-web-$Environment-$AWS_ACCOUNT_ID"
            $dynamoDBTableName = "carbonlens-ai-data-$Environment"
            $cloudFrontDistributionId = ""
            $cloudFrontDomain = ""
        }
    } catch {
        Write-Error "Failed to get existing stack outputs: $_"
        exit 1
    }
}

# Deploy Backend (now handled by CDK)
if (-not $SkipBackend) {
    Write-Step "Backend deployment is now handled by CDK infrastructure..."
    Write-Success "Lambda functions deployed with CDK stack"
} else {
    Write-Warning "Skipping backend deployment (handled by CDK)"
}

# Deploy Frontend
if (-not $SkipFrontend) {
    Write-Step "Deploying frontend..."
    
    try {
        # Install frontend dependencies
        Write-Step "Installing frontend dependencies..."
        npm install --legacy-peer-deps
        
        # Build frontend
        Write-Step "Building frontend..."
        $env:CI = "false"  # Treat warnings as warnings, not errors
        npm run build
        
        # Deploy to S3
        Write-Step "Uploading to S3..."
        if ($frontendBucket) {
            aws s3 sync build/ "s3://$frontendBucket" --delete --cache-control "max-age=86400"
        } else {
            Write-Error "Frontend bucket name is empty, cannot deploy"
            exit 1
        }
        
        # Invalidate CloudFront cache
        Write-Step "Invalidating CloudFront cache..."
        if ($cloudFrontDistributionId) {
            aws cloudfront create-invalidation --distribution-id $cloudFrontDistributionId --paths "/*"
        } else {
            Write-Warning "CloudFront distribution ID not found, skipping cache invalidation"
        }
        
        Write-Success "Frontend deployed successfully"
        
    } catch {
        Write-Error "Frontend deployment failed: $_"
        exit 1
    }
} else {
    Write-Warning "Skipping frontend deployment"
}

# Final success message
Write-Success "🎉 Deployment completed successfully!"

if ($DomainName) {
    Write-Success "🌐 Application URL: https://$DomainName"
} elseif ($cloudFrontDomain) {
    Write-Success "🌐 Application URL: https://$cloudFrontDomain"
} else {
    Write-Success "🌐 Application deployed successfully"
}

Write-Step "Deployment Summary:"
Write-Host "  Environment: $Environment"
Write-Host "  Frontend Bucket: $frontendBucket"
Write-Host "  CloudFront Distribution: $cloudFrontDistributionId"
if ($DomainName) {
    Write-Host "  Custom Domain: $DomainName"
}
Write-Host "  DynamoDB Table: $dynamoDBTableName"