#!/usr/bin/env pwsh

# CarbonLens AI - Seed Test Data Script
# This script populates the database with realistic test data for dashboard demonstration

Write-Host "🌱 CarbonLens AI - Test Data Seeding" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend/serverless.yml")) {
    Write-Host "❌ Error: Please run this script from the carbonlens-ai root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 This will create realistic test data including:" -ForegroundColor Cyan
Write-Host "   • 8 sample shipping documents (invoices, manifests, bills of lading)" -ForegroundColor White
Write-Host "   • Carbon footprint calculations for each document" -ForegroundColor White
Write-Host "   • AI insights and sustainability scores" -ForegroundColor White
Write-Host "   • Sample certificates and optimization recommendations" -ForegroundColor White
Write-Host "   • 6 months of trend data for dashboard charts" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to proceed? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Step 1: Deploying seed function..." -ForegroundColor Yellow

# Deploy the backend with the new seed function
Set-Location backend
try {
    $deployOutput = npx serverless deploy --stage dev 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to deploy backend" -ForegroundColor Red
        Write-Host $deployOutput -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Backend deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "🌱 Step 2: Seeding test data..." -ForegroundColor Yellow

# Call the seed endpoint
try {
    $apiEndpoint = "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/seed-test-data"
    
    Write-Host "📡 Calling seed endpoint: $apiEndpoint" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $apiEndpoint -Method POST -ContentType "application/json" -Body "{}"
    
    if ($response.success) {
        Write-Host "✅ Test data seeded successfully!" -ForegroundColor Green
        Write-Host "📊 Dashboard should now display realistic data" -ForegroundColor Green
    } else {
        Write-Host "❌ Seeding failed: $($response.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error calling seed endpoint: $_" -ForegroundColor Red
    Write-Host "🔍 Response details: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Test Data Seeding Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "📈 Your dashboard now includes:" -ForegroundColor Cyan
Write-Host "   • 8 processed documents" -ForegroundColor White
Write-Host "   • ~1,430 kg CO₂e total emissions" -ForegroundColor White
Write-Host "   • Mixed transport modes (truck, air, rail, ship)" -ForegroundColor White
Write-Host "   • 6-month emissions trend" -ForegroundColor White
Write-Host "   • Recent activity feed" -ForegroundColor White
Write-Host "   • Sample certificates and optimizations" -ForegroundColor White
Write-Host ""
Write-Host "🌐 View your dashboard at:" -ForegroundColor Yellow
Write-Host "   https://carbonlens-ai.solutionsynth.cloud" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Tip: You can run this script multiple times to add more test data" -ForegroundColor Cyan
Write-Host "🗑️  To clear test data, use the AWS Console to scan and delete DynamoDB items" -ForegroundColor Cyan