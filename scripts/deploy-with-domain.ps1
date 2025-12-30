#!/usr/bin/env pwsh

# CarbonLens AI - Custom Domain Deployment Script
# This script deploys the application with custom domain support

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1",
    [string]$DomainName = "carbonlens-ai.solutionsynth.cloud",
    [string]$CertificateArn = "",
    [string]$HostedZoneId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "CarbonLens AI - Custom Domain Deployment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Domain: $DomainName" -ForegroundColor Yellow

# Check if certificate ARN is provided
if ([string]::IsNullOrEmpty($CertificateArn)) {
    Write-Host "Certificate ARN is required for custom domain deployment" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide the certificate ARN:" -ForegroundColor Yellow
    Write-Host ".\scripts\deploy-with-domain.ps1 -CertificateArn 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'" -ForegroundColor Cyan
    exit 1
}

try {
    Write-Host "Step 1: Installing dependencies..." -ForegroundColor Blue
    npm install
    
    Write-Host "Step 2: Deploying infrastructure with custom domain..." -ForegroundColor Blue
    
    $infraParams = @(
        "Environment=$Environment"
        "ProjectName=carbonlens-ai"
        "DomainName=$DomainName"
        "CertificateArn=$CertificateArn"
    )
    
    if (![string]::IsNullOrEmpty($HostedZoneId)) {
        $infraParams += "HostedZoneId=$HostedZoneId"
    }
    
    aws cloudformation deploy `
        --template-file infrastructure/cloudformation-simple.yml `
        --stack-name "carbonlens-ai-production" `
        --parameter-overrides $infraParams `
        --capabilities CAPABILITY_IAM `
        --region $Region

    if ($LASTEXITCODE -ne 0) {
        throw "Infrastructure deployment failed"
    }

    Write-Host "Step 3: Deploying backend services..." -ForegroundColor Blue
    Set-Location backend
    npm install
    npx serverless deploy --stage $Environment --region $Region
    
    if ($LASTEXITCODE -ne 0) {
        throw "Backend deployment failed"
    }
    
    Set-Location ..

    Write-Host "Step 4: Building and deploying frontend..." -ForegroundColor Blue
    npm run build
    
    # Get S3 bucket name from CloudFormation outputs
    $bucketName = aws cloudformation describe-stacks `
        --stack-name "carbonlens-ai-production" `
        --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
        --output text `
        --region $Region

    if ([string]::IsNullOrEmpty($bucketName)) {
        throw "Could not retrieve S3 bucket name"
    }

    # Deploy to S3
    aws s3 sync build/ "s3://$bucketName" --delete --region $Region

    # Get CloudFront distribution ID
    $distributionId = aws cloudformation describe-stacks `
        --stack-name "carbonlens-ai-production" `
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" `
        --output text `
        --region $Region

    if (![string]::IsNullOrEmpty($distributionId)) {
        Write-Host "Step 5: Invalidating CloudFront cache..." -ForegroundColor Blue
        aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --region $Region
    }

    Write-Host ""
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application URLs:" -ForegroundColor Cyan
    Write-Host "Custom Domain: https://$DomainName" -ForegroundColor White
    
    # Get CloudFront domain as backup
    $cloudFrontDomain = aws cloudformation describe-stacks `
        --stack-name "carbonlens-ai-production" `
        --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" `
        --output text `
        --region $Region
    
    if (![string]::IsNullOrEmpty($cloudFrontDomain)) {
        Write-Host "CloudFront Domain: https://$cloudFrontDomain" -ForegroundColor White
    }

    Write-Host ""
    if (![string]::IsNullOrEmpty($HostedZoneId)) {
        Write-Host "Route 53 DNS record will be created automatically after deployment!" -ForegroundColor Green
        Write-Host "Your domain should be ready in a few minutes." -ForegroundColor White
    } else {
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "1. In GoDaddy DNS management, create a CNAME record:" -ForegroundColor White
        Write-Host "   Name: CarbonLens-ai" -ForegroundColor Cyan
        Write-Host "   Value: $cloudFrontDomain" -ForegroundColor Cyan
        Write-Host "2. Wait for DNS propagation (5-30 minutes)" -ForegroundColor White
        Write-Host "3. Test your custom domain: https://$DomainName" -ForegroundColor White
    } else {
        Write-Host "Route 53 DNS record created automatically!" -ForegroundColor Green
        Write-Host "Your domain should be ready in a few minutes." -ForegroundColor White
    }

} catch {
    Write-Host ""
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
}