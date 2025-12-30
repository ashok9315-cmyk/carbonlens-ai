param(
    [string]$DomainName = "solutionsynth.cloud",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "AWS Route 53 Setup for CarbonLens AI" -ForegroundColor Green
Write-Host "Domain: $DomainName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Step 1: Checking existing hosted zones..." -ForegroundColor Blue
    
    $existingZones = aws route53 list-hosted-zones-by-name --dns-name $DomainName --output json | ConvertFrom-Json
    
    $hostedZoneId = $null
    foreach ($zone in $existingZones.HostedZones) {
        if ($zone.Name -eq "$DomainName.") {
            $hostedZoneId = $zone.Id -replace "/hostedzone/", ""
            Write-Host "Found existing hosted zone: $hostedZoneId" -ForegroundColor Green
            break
        }
    }

    if ([string]::IsNullOrEmpty($hostedZoneId)) {
        Write-Host "Step 2: Creating Route 53 hosted zone..." -ForegroundColor Blue
        
        $callerRef = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $zoneResponse = aws route53 create-hosted-zone --name $DomainName --caller-reference $callerRef --hosted-zone-config Comment="CarbonLens AI domain" --output json | ConvertFrom-Json
        
        $hostedZoneId = $zoneResponse.HostedZone.Id -replace "/hostedzone/", ""
        Write-Host "Created hosted zone: $hostedZoneId" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Step 3: Getting name servers..." -ForegroundColor Blue
    
    $zoneDetails = aws route53 get-hosted-zone --id $hostedZoneId --output json | ConvertFrom-Json
    $nameServers = $zoneDetails.DelegationSet.NameServers
    
    Write-Host ""
    Write-Host "Route 53 Name Servers:" -ForegroundColor Cyan
    foreach ($ns in $nameServers) {
        Write-Host "  $ns" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Step 4: SSL Certificate setup..." -ForegroundColor Blue
    
    $subDomain = "CarbonLens-ai.$DomainName"
    Write-Host "Requesting certificate for: $subDomain" -ForegroundColor Yellow
    
    $certResponse = aws acm request-certificate --domain-name $subDomain --validation-method DNS --region $Region --output json | ConvertFrom-Json
    $certArn = $certResponse.CertificateArn
    
    Write-Host "Certificate ARN: $certArn" -ForegroundColor Green
    
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "Step 5: Getting certificate validation records..." -ForegroundColor Blue
    
    $certDetails = aws acm describe-certificate --certificate-arn $certArn --region $Region --output json | ConvertFrom-Json
    $validationOptions = $certDetails.Certificate.DomainValidationOptions
    
    if ($validationOptions.Count -eq 0) {
        Write-Host "Waiting for validation records..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        $certDetails = aws acm describe-certificate --certificate-arn $certArn --region $Region --output json | ConvertFrom-Json
        $validationOptions = $certDetails.Certificate.DomainValidationOptions
    }

    Write-Host ""
    Write-Host "Step 6: Creating DNS validation records..." -ForegroundColor Blue
    
    foreach ($option in $validationOptions) {
        if ($option.ResourceRecord) {
            $recordName = $option.ResourceRecord.Name
            $recordValue = $option.ResourceRecord.Value
            
            Write-Host "Creating validation record: $recordName" -ForegroundColor Yellow
            
            $changeRequest = @{
                Changes = @(
                    @{
                        Action = "CREATE"
                        ResourceRecordSet = @{
                            Name = $recordName
                            Type = "CNAME"
                            TTL = 300
                            ResourceRecords = @(
                                @{ Value = $recordValue }
                            )
                        }
                    }
                )
            } | ConvertTo-Json -Depth 10
            
            $changeRequest | Out-File -FilePath "temp-change-batch.json" -Encoding UTF8
            
            $changeResponse = aws route53 change-resource-record-sets --hosted-zone-id $hostedZoneId --change-batch file://temp-change-batch.json --output json | ConvertFrom-Json
            
            Remove-Item "temp-change-batch.json" -Force
            
            Write-Host "Validation record created successfully" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "Step 7: Monitoring certificate validation..." -ForegroundColor Blue
    
    $maxAttempts = 20
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        $attempt++
        $status = aws acm describe-certificate --certificate-arn $certArn --region $Region --query "Certificate.Status" --output text
        
        Write-Host "[$attempt/$maxAttempts] Certificate status: $status" -ForegroundColor Gray
        
        if ($status -eq "ISSUED") {
            Write-Host ""
            Write-Host "Certificate validated successfully!" -ForegroundColor Green
            break
        } elseif ($status -eq "FAILED") {
            Write-Host ""
            Write-Host "Certificate validation failed!" -ForegroundColor Red
            break
        }
        
        if ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 30
        }
    }

    Write-Host ""
    Write-Host "Setup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Update your domain registrar (GoDaddy) to use these name servers:" -ForegroundColor White
    foreach ($ns in $nameServers) {
        Write-Host "   $ns" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "2. Wait 24-48 hours for DNS propagation" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Deploy with Route 53 integration:" -ForegroundColor White
    Write-Host "   .\scripts\deploy-with-domain.ps1 -CertificateArn '$certArn' -HostedZoneId '$hostedZoneId'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Hosted Zone ID: $hostedZoneId" -ForegroundColor Yellow
    Write-Host "Certificate ARN: $certArn" -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- AWS CLI not configured" -ForegroundColor White
    Write-Host "- Missing Route 53 permissions" -ForegroundColor White
    Write-Host "- Domain already has hosted zone" -ForegroundColor White
    exit 1
}