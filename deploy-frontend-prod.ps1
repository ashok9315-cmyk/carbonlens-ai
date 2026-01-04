# CarbonLens AI - Frontend Production Deployment Script
# Usage: .\deploy-prod.ps1

Write-Host "CarbonLens AI - Frontend Production Deployment" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Blue
Write-Host ""

# Step 1: Build the React app
Write-Host "Building React application..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy to S3
Write-Host "Deploying to S3..." -ForegroundColor Yellow
& aws s3 sync build/ s3://carbonlens-ai-web-prod-790756194179 --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Files deployed to S3 successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
& aws cloudfront create-invalidation --distribution-id EGSWVVVRV0S0Q --paths "/*" --no-cli-pager

if ($LASTEXITCODE -ne 0) {
    Write-Host "CloudFront invalidation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "CloudFront cache invalidation created" -ForegroundColor Green
Write-Host ""

# Success summary
Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Production URLs:" -ForegroundColor Cyan
Write-Host "  CloudFront: https://d2wgh5tbawnajx.cloudfront.net"
Write-Host "  Custom Domain: https://carbonlens-ai.solutionsynth.cloud"
Write-Host ""
Write-Host "Cache invalidation will take 1-2 minutes to propagate." -ForegroundColor Yellow