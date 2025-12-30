# CarbonLens AI Deployment Script for Windows
# This script deploys the entire CarbonLens AI application to AWS
# 
# Features:
# - Infrastructure deployment via CloudFormation
# - Backend deployment via Serverless Framework
# - Frontend build and deployment to S3
# - Automatic CloudFront cache invalidation
# - Comprehensive error handling and status reporting
#
# Updated: 2025-12-30 - Added enhanced CloudFront cache invalidation

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

$ProjectName = "carbonlens-ai"
$StackName = "$ProjectName-$Environment"

Write-Host "Deploying CarbonLens AI to AWS" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Stack: $StackName" -ForegroundColor Yellow

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Blue

try {
    $null = aws --version
    Write-Host "AWS CLI found" -ForegroundColor Green
}
catch {
    Write-Host "AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

try {
    $null = node --version
    Write-Host "Node.js found" -ForegroundColor Green
}
catch {
    Write-Host "Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

try {
    $null = serverless --version
    Write-Host "Serverless Framework found" -ForegroundColor Green
}
catch {
    Write-Host "Installing Serverless Framework..." -ForegroundColor Yellow
    npm install -g serverless
}

# Step 1: Deploy Infrastructure
Write-Host "Deploying infrastructure..." -ForegroundColor Blue

$deployResult = aws cloudformation deploy `
    --template-file infrastructure/cloudformation.yml `
    --stack-name $StackName `
    --parameter-overrides Environment=$Environment ProjectName=$ProjectName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Infrastructure deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "Infrastructure deployed successfully" -ForegroundColor Green

# Get stack outputs
Write-Host "Getting stack outputs..." -ForegroundColor Blue

$FrontendBucket = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
    --output text

$DocumentsBucket = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='DocumentsBucketName'].OutputValue" `
    --output text

$UserPoolId = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" `
    --output text

$UserPoolClientId = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" `
    --output text

$CloudFrontDomain = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" `
    --output text

Write-Host "Frontend Bucket: $FrontendBucket" -ForegroundColor Cyan
Write-Host "Documents Bucket: $DocumentsBucket" -ForegroundColor Cyan
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Cyan
Write-Host "User Pool Client ID: $UserPoolClientId" -ForegroundColor Cyan
Write-Host "CloudFront Domain: $CloudFrontDomain" -ForegroundColor Cyan

# Step 2: Deploy Backend Services
Write-Host "Deploying backend services..." -ForegroundColor Blue

Push-Location backend

# Install dependencies
npm install

# Deploy with Serverless
$serverlessResult = serverless deploy --stage $Environment --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Get API Gateway URL
$ApiInfo = serverless info --stage $Environment --region $Region
$ApiUrl = ""
foreach ($line in $ApiInfo) {
    if ($line -match "https://.*\.execute-api\..*\.amazonaws\.com/.*") {
        $ApiUrl = $matches[0]
        break
    }
}

Write-Host "API Gateway URL: $ApiUrl" -ForegroundColor Cyan

Pop-Location

# Step 3: Build and Deploy Frontend
Write-Host "Building and deploying frontend..." -ForegroundColor Blue

# Install frontend dependencies
npm install

# Create environment configuration
$awsConfigContent = @"
export const awsConfig = {
  Auth: {
    region: '$Region',
    userPoolId: '$UserPoolId',
    userPoolWebClientId: '$UserPoolClientId',
  },
  API: {
    endpoints: [
      {
        name: 'carbonlens-api',
        endpoint: '$ApiUrl',
        region: '$Region'
      }
    ]
  }
};
"@

$awsConfigContent | Out-File -FilePath "src\aws-config.js" -Encoding UTF8

# Update App.js to use the config
$appJsPath = "src\App.js"
$appJsContent = Get-Content $appJsPath -Raw

# Replace the amplify config
$newImport = "import { awsConfig } from './aws-config';`n`nconst amplifyConfig = awsConfig;"
$appJsContent = $appJsContent -replace "const amplifyConfig = \{[^}]+\};", $newImport

$appJsContent | Out-File -FilePath $appJsPath -Encoding UTF8

# Build the application
Write-Host "Building React application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

# Deploy to S3
Write-Host "Uploading to S3..." -ForegroundColor Blue
aws s3 sync build/ s3://$FrontendBucket --delete --cache-control "no-cache" --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Blue

# Try to get distribution ID from CloudFormation stack first
$DistributionId = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" `
    --output text

# If not found in stack, try to find it by domain name
if (-not $DistributionId -or $DistributionId -eq "None") {
    $DistributionId = aws cloudfront list-distributions `
        --query "DistributionList.Items[?Origins.Items[0].DomainName=='$FrontendBucket.s3.$Region.amazonaws.com'].Id" `
        --output text
}

# If still not found, try alternative domain format
if (-not $DistributionId -or $DistributionId -eq "None") {
    $DistributionId = aws cloudfront list-distributions `
        --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$FrontendBucket')].Id" `
        --output text
}

# Known distribution ID as fallback (update this if needed)
if (-not $DistributionId -or $DistributionId -eq "None") {
    $DistributionId = "E2P398QOXMEM5S"
    Write-Host "Using known distribution ID: $DistributionId" -ForegroundColor Yellow
}

if ($DistributionId -and $DistributionId -ne "None") {
    Write-Host "Creating CloudFront invalidation for distribution: $DistributionId" -ForegroundColor Yellow
    $callerReference = Get-Date -Format 'yyyyMMddHHmmss'
    $invalidationResult = aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --invalidation-batch "Paths={Quantity=1,Items=[`"/*`"]},CallerReference=$callerReference"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CloudFront cache invalidation initiated successfully" -ForegroundColor Green
        Write-Host "Cache invalidation may take 5-15 minutes to complete" -ForegroundColor Yellow
    } else {
        Write-Host "CloudFront cache invalidation failed, but deployment continues" -ForegroundColor Yellow
    }
} else {
    Write-Host "Could not find CloudFront distribution ID, skipping cache invalidation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Application URLs:" -ForegroundColor Blue
Write-Host "   Frontend: https://$CloudFrontDomain" -ForegroundColor White
Write-Host "   API: $ApiUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Authentication:" -ForegroundColor Blue
Write-Host "   User Pool ID: $UserPoolId" -ForegroundColor White
Write-Host "   Client ID: $UserPoolClientId" -ForegroundColor White
Write-Host ""
Write-Host "💾 Storage:" -ForegroundColor Blue
Write-Host "   Frontend Bucket: $FrontendBucket" -ForegroundColor White
Write-Host "   Documents Bucket: $DocumentsBucket" -ForegroundColor White
Write-Host ""
Write-Host "⚡ CloudFront Distribution: $DistributionId" -ForegroundColor Blue
Write-Host ""
Write-Host "🚀 Your CarbonLens AI application is now live!" -ForegroundColor Green
Write-Host "🌐 Visit https://$CloudFrontDomain to start tracking carbon footprints!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Note: If you see caching issues, wait 5-15 minutes for CloudFront invalidation to complete" -ForegroundColor Cyan