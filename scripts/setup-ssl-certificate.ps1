#!/usr/bin/env pwsh

# CarbonLens AI - SSL Certificate Setup Script
# This script requests and validates SSL certificates for custom domains

param(
    [string]$DomainName = "carbonlens-ai.solutionsynth.cloud",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🔐 SSL Certificate Setup for CarbonLens AI" -ForegroundColor Green
Write-Host "Domain: $DomainName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

try {
    # Check if AWS CLI is configured
    Write-Host "Step 1: Checking AWS CLI configuration..." -ForegroundColor Blue
    
    try {
        $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
        Write-Host "✅ AWS CLI configured for account: $($identity.Account)" -ForegroundColor Green
    } catch {
        Write-Host "❌ AWS CLI not configured. Run 'aws configure'" -ForegroundColor Red
        exit 1
    }

    # Request SSL certificate
    Write-Host ""
    Write-Host "Step 2: Requesting SSL certificate..." -ForegroundColor Blue
    
    $certResponse = aws acm request-certificate `
        --domain-name $DomainName `
        --validation-method DNS `
        --region $Region `
        --output json | ConvertFrom-Json
    
    $certArn = $certResponse.CertificateArn
    Write-Host "✅ Certificate requested: $certArn" -ForegroundColor Green
    
    # Wait for validation records
    Write-Host ""
    Write-Host "Step 3: Waiting for validation records..." -ForegroundColor Blue
    
    $maxAttempts = 10
    $attempt = 0
    $validationOptions = $null
    
    while ($attempt -lt $maxAttempts -and !$validationOptions) {
        $attempt++
        Start-Sleep -Seconds 5
        
        $certDetails = aws acm describe-certificate `
            --certificate-arn $certArn `
            --region $Region `
            --output json | ConvertFrom-Json
        
        $validationOptions = $certDetails.Certificate.DomainValidationOptions
        
        if ($validationOptions -and $validationOptions[0].ResourceRecord) {
            break
        }
        
        Write-Host "[$attempt/$maxAttempts] Waiting for validation records..." -ForegroundColor Gray
    }
    
    if (!$validationOptions -or !$validationOptions[0].ResourceRecord) {
        Write-Host "❌ Failed to get validation records" -ForegroundColor Red
        exit 1
    }
    
    # Display validation information
    Write-Host ""
    Write-Host "Step 4: Certificate validation required" -ForegroundColor Blue
    Write-Host ""
    Write-Host "To validate your certificate, create the following DNS record:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Record Type: CNAME" -ForegroundColor Cyan
    Write-Host "Name: $($validationOptions[0].ResourceRecord.Name)" -ForegroundColor Cyan
    Write-Host "Value: $($validationOptions[0].ResourceRecord.Value)" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if Route 53 hosted zone exists
    Write-Host "Step 5: Checking for Route 53 hosted zone..." -ForegroundColor Blue
    
    $baseDomain = $DomainName -replace '^[^.]+\.', ''
    $hostedZones = aws route53 list-hosted-zones-by-name `
        --dns-name $baseDomain `
        --output json | ConvertFrom-Json
    
    $hostedZoneId = $null
    foreach ($zone in $hostedZones.HostedZones) {
        if ($zone.Name -eq "$baseDomain.") {
            $hostedZoneId = $zone.Id -replace "/hostedzone/", ""
            Write-Host "✅ Found Route 53 hosted zone: $hostedZoneId" -ForegroundColor Green
            break
        }
    }
    
    if ($hostedZoneId) {
        Write-Host ""
        Write-Host "Step 6: Creating DNS validation record in Route 53..." -ForegroundColor Blue
        
        $changeRequest = @{
            Changes = @(
                @{
                    Action = "CREATE"
                    ResourceRecordSet = @{
                        Name = $validationOptions[0].ResourceRecord.Name
                        Type = "CNAME"
                        TTL = 300
                        ResourceRecords = @(
                            @{ Value = $validationOptions[0].ResourceRecord.Value }
                        )
                    }
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $changeRequest | Out-File -FilePath "temp-validation-record.json" -Encoding UTF8
        
        try {
            $changeResponse = aws route53 change-resource-record-sets `
                --hosted-zone-id $hostedZoneId `
                --change-batch file://temp-validation-record.json `
                --output json | ConvertFrom-Json
            
            Write-Host "✅ DNS validation record created" -ForegroundColor Green
            
            # Monitor certificate validation
            Write-Host ""
            Write-Host "Step 7: Monitoring certificate validation..." -ForegroundColor Blue
            
            $maxValidationAttempts = 20
            $validationAttempt = 0
            
            while ($validationAttempt -lt $maxValidationAttempts) {
                $validationAttempt++
                $status = aws acm describe-certificate `
                    --certificate-arn $certArn `
                    --region $Region `
                    --query "Certificate.Status" `
                    --output text
                
                Write-Host "[$validationAttempt/$maxValidationAttempts] Certificate status: $status" -ForegroundColor Gray
                
                if ($status -eq "ISSUED") {
                    Write-Host ""
                    Write-Host "🎉 Certificate validated and issued successfully!" -ForegroundColor Green
                    break
                } elseif ($status -eq "FAILED") {
                    Write-Host ""
                    Write-Host "❌ Certificate validation failed!" -ForegroundColor Red
                    break
                }
                
                if ($validationAttempt -lt $maxValidationAttempts) {
                    Start-Sleep -Seconds 30
                }
            }
            
        } catch {
            Write-Host "⚠️ Failed to create DNS record automatically: $_" -ForegroundColor Yellow
            Write-Host "Please create the DNS record manually" -ForegroundColor Yellow
        } finally {
            if (Test-Path "temp-validation-record.json") {
                Remove-Item "temp-validation-record.json" -Force
            }
        }
        
    } else {
        Write-Host "⚠️ No Route 53 hosted zone found for $baseDomain" -ForegroundColor Yellow
        Write-Host "Please create the DNS validation record manually in your DNS provider" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📋 Certificate Setup Summary:" -ForegroundColor Blue
    Write-Host "Certificate ARN: $certArn" -ForegroundColor Cyan
    if ($hostedZoneId) {
        Write-Host "Hosted Zone ID: $hostedZoneId" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Wait for certificate validation to complete" -ForegroundColor White
    Write-Host "2. Deploy with custom domain:" -ForegroundColor White
    Write-Host "   .\scripts\deploy-with-domain.ps1 -CertificateArn '$certArn'" -ForegroundColor Cyan
    if ($hostedZoneId) {
        Write-Host "   -HostedZoneId '$hostedZoneId'" -ForegroundColor Cyan
    }

} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- AWS CLI not configured: Run 'aws configure'" -ForegroundColor White
    Write-Host "- Insufficient permissions: Ensure ACM and Route 53 access" -ForegroundColor White
    Write-Host "- Domain validation pending: Check DNS records" -ForegroundColor White
    exit 1
}