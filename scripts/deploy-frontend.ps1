#!/usr/bin/env pwsh

# CarbonLens AI Frontend Deployment Script
# This script builds and deploys the React frontend to S3 and invalidates CloudFront cache

Write-Host "🚀 Starting CarbonLens AI Frontend Deployment..." -ForegroundColor Green

# Configuration
$S3_BUCKET = "carbonlens-ai-web-dev-790756194179"
$CLOUDFRONT_DISTRIBUTION_ID = "E2P398QOXMEM5S"

try {
    # Step 1: Clean previous build
    Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path "build") {
        Remove-Item -Recurse -Force build
    }

    # Step 2: Build React application
    Write-Host "🔨 Building React application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    # Step 3: Deploy to S3
    Write-Host "📦 Deploying to S3..." -ForegroundColor Yellow
    aws s3 sync build/ s3://$S3_BUCKET --delete --cache-control "no-cache"
    if ($LASTEXITCODE -ne 0) {
        throw "S3 deployment failed"
    }

    # Step 4: Invalidate CloudFront cache
    Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Yellow
    $callerReference = Get-Date -Format 'yyyyMMddHHmmss'
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --invalidation-batch "Paths={Quantity=1,Items=[`"/*`"]},CallerReference=$callerReference"
    if ($LASTEXITCODE -ne 0) {
        throw "CloudFront invalidation failed"
    }

    Write-Host "✅ Frontend deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Application URL: https://carbonlens-ai.solutionsynth.cloud" -ForegroundColor Cyan
    Write-Host "⏰ CloudFront cache invalidation may take 5-15 minutes to complete" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}