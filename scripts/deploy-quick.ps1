#!/usr/bin/env pwsh

# CarbonLens AI Quick Frontend Deployment Script
# This script only builds and deploys the frontend (faster for UI changes)

param(
    [string]$Environment = "dev"
)

Write-Host "🚀 Quick Frontend Deployment for CarbonLens AI" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Configuration
$S3_BUCKET = "carbonlens-ai-web-dev-790756194179"
$CLOUDFRONT_DISTRIBUTION_ID = "E2P398QOXMEM5S"

try {
    # Step 1: Clean previous build
    Write-Host "🧹 Cleaning previous build..." -ForegroundColor Blue
    if (Test-Path "build") {
        Remove-Item -Recurse -Force build
    }

    # Step 2: Build React application
    Write-Host "🔨 Building React application..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }

    # Step 3: Deploy to S3
    Write-Host "📦 Deploying to S3..." -ForegroundColor Blue
    aws s3 sync build/ s3://$S3_BUCKET --delete --cache-control "no-cache"
    if ($LASTEXITCODE -ne 0) {
        throw "S3 deployment failed"
    }

    # Step 4: Invalidate CloudFront cache
    Write-Host "🔄 Invalidating CloudFront cache..." -ForegroundColor Blue
    $callerReference = Get-Date -Format 'yyyyMMddHHmmss'
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --invalidation-batch "Paths={Quantity=1,Items=[`"/*`"]},CallerReference=$callerReference" | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  CloudFront invalidation failed, but deployment continues" -ForegroundColor Yellow
    } else {
        Write-Host "✅ CloudFront cache invalidation initiated" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "🎉 Quick deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Application URL: https://carbonlens-ai.solutionsynth.cloud" -ForegroundColor Cyan
    Write-Host "⏰ Cache invalidation may take 5-15 minutes to complete" -ForegroundColor Yellow
    Write-Host "💡 Tip: Use Ctrl+F5 to force refresh your browser" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Quick deployment failed: $_" -ForegroundColor Red
    exit 1
}