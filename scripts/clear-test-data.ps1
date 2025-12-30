#!/usr/bin/env pwsh

# Clear Test Data Script
Write-Host "🗑️ Clearing Test Data from CarbonLens AI" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$confirmation = Read-Host "This will remove all seeded test data. Continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Operation cancelled" -ForegroundColor Yellow
    exit 0
}

# Note: This would require a Lambda function to scan and delete test records
# For now, manual deletion via AWS Console is recommended

Write-Host "📋 To manually clear test data:" -ForegroundColor Cyan
Write-Host "1. Go to AWS Console → DynamoDB → carbonlens-ai-dev table" -ForegroundColor White
Write-Host "2. Scan for items where fileName contains 'invoice_00', 'manifest_00', etc." -ForegroundColor White
Write-Host "3. Delete the test records manually" -ForegroundColor White
Write-Host ""
Write-Host "🗑️ Direct link:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=carbonlens-ai-data-dev" -ForegroundColor Blue