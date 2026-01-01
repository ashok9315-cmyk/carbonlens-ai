#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Setup development environment for CarbonLens AI
.DESCRIPTION
    This script sets up the development environment including dependencies and AWS configuration
.PARAMETER Environment
    The environment to setup (dev, staging, prod)
.EXAMPLE
    .\scripts\setup-environment.ps1 -Environment dev
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev"
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

Write-Step "Setting up CarbonLens AI development environment..."

# Check Node.js
Write-Step "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18 or later."
    Write-Host "Download from: https://nodejs.org/"
    exit 1
}

# Check npm
Write-Step "Checking npm installation..."
try {
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"
} catch {
    Write-Error "npm is not available"
    exit 1
}

# Check AWS CLI
Write-Step "Checking AWS CLI installation..."
try {
    $awsVersion = aws --version
    Write-Success "AWS CLI: $awsVersion"
} catch {
    Write-Error "AWS CLI is not installed. Please install AWS CLI v2."
    Write-Host "Download from: https://aws.amazon.com/cli/"
    exit 1
}

# Check AWS credentials
Write-Step "Checking AWS credentials..."
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "AWS Account: $($awsIdentity.Account)"
    Write-Success "AWS User: $($awsIdentity.Arn)"
} catch {
    Write-Error "AWS credentials not configured. Please run 'aws configure'"
    exit 1
}

# Install root dependencies
Write-Step "Installing root dependencies..."
try {
    npm install --legacy-peer-deps
    Write-Success "Root dependencies installed"
} catch {
    Write-Error "Failed to install root dependencies"
    exit 1
}

# Install backend dependencies
Write-Step "Installing backend dependencies..."
try {
    Push-Location "backend"
    npm install --legacy-peer-deps
    Write-Success "Backend dependencies installed"
} catch {
    Write-Error "Failed to install backend dependencies"
    exit 1
} finally {
    Pop-Location
}

# Install CDK dependencies
Write-Step "Installing CDK dependencies..."
try {
    Push-Location "infrastructure/cdk"
    npm install
    Write-Success "CDK dependencies installed"
} catch {
    Write-Error "Failed to install CDK dependencies"
    exit 1
} finally {
    Pop-Location
}

# Install AWS CDK globally if not present
Write-Step "Checking AWS CDK installation..."
try {
    $cdkVersion = npx cdk --version
    Write-Success "AWS CDK: $cdkVersion"
} catch {
    Write-Step "Installing AWS CDK globally..."
    npm install -g aws-cdk
    Write-Success "AWS CDK installed globally"
}

# Create .env file template
Write-Step "Creating environment configuration..."
$envFile = ".env.$Environment"
if (-not (Test-Path $envFile)) {
    $envContent = @"
# CarbonLens AI Environment Configuration - $Environment
ENVIRONMENT=$Environment
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
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "Environment file created: $envFile"
    Write-Warning "Please update the environment variables in $envFile"
} else {
    Write-Success "Environment file already exists: $envFile"
}

# Run tests to verify setup
Write-Step "Running tests to verify setup..."
try {
    npm test -- --watchAll=false --passWithNoTests
    Write-Success "Frontend tests passed"
} catch {
    Write-Warning "Frontend tests failed, but continuing setup"
}

try {
    Push-Location "backend"
    npm test -- --watchAll=false --passWithNoTests
    Write-Success "Backend tests passed"
} catch {
    Write-Warning "Backend tests failed, but continuing setup"
} finally {
    Pop-Location
}

# Build CDK to verify setup
Write-Step "Building CDK to verify setup..."
try {
    Push-Location "infrastructure/cdk"
    npm run build
    Write-Success "CDK build successful"
} catch {
    Write-Warning "CDK build failed, but continuing setup"
} finally {
    Pop-Location
}

Write-Success "🎉 Environment setup completed!"
Write-Step "Next steps:"
Write-Host "  1. Update environment variables in .env.$Environment"
Write-Host "  2. Run: .\scripts\deploy.ps1 -Environment $Environment"
Write-Host "  3. Visit your deployed application"

Write-Step "Useful commands:"
Write-Host "  Deploy: .\scripts\deploy.ps1 -Environment $Environment"
Write-Host "  Test: npm test"
Write-Host "  Build: npm run build"
Write-Host "  CDK Diff: cd infrastructure/cdk && npx cdk diff"
Write-Host "  CDK Synth: cd infrastructure/cdk && npx cdk synth"