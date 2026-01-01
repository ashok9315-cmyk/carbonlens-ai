#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy CarbonLens AI with Route 53 automated DNS management
.DESCRIPTION
    This script deploys the CarbonLens AI application with automated SSL certificate creation and Route 53 DNS configuration
.PARAMETER Environment
    The environment to deploy to (dev, staging, prod)
.PARAMETER DomainName
    Custom domain name (e.g., dev-carbonlens-ai.solutionsynth.cloud)
.PARAMETER CreateCertificate
    Create a new SSL certificate (default: true)
.EXAMPLE
    .\scripts\deploy-with-route53.ps1 -Environment dev -DomainName "dev-carbonlens-ai.solutionsynth.cloud"
.EXAMPLE
    .\scripts\deploy-with-route53.ps1 -Environment staging -DomainName "staging-carbonlens-ai.solutionsynth.cloud"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $true)]
    [string]$DomainName,
    
    [Parameter(Mandatory = $false)]
    [switch]$CreateCertificate = $true
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

# Constants
$HOSTED_ZONE_ID = "Z02373041SS8TKQHXZLAR"
$ROOT_DOMAIN = "solutionsynth.cloud"

Write-Step "Starting Route 53 automated deployment for environment: $Environment"
Write-Host "Domain: $DomainName"
Write-Host "Hosted Zone ID: $HOSTED_ZONE_ID"

# Validate domain
if (-not $DomainName.EndsWith($ROOT_DOMAIN)) {
    Write-Error "Domain must end with $ROOT_DOMAIN"
    exit 1
}

# Get AWS Account ID
try {
    $AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
    Write-Success "AWS Account ID: $AWS_ACCOUNT_ID"
} catch {
    Write-Error "Failed to get AWS Account ID. Please check your AWS credentials."
    exit 1
}

# Check if certificate already exists
$certificateArn = ""
if ($CreateCertificate) {
    Write-Step "Checking for existing SSL certificate..."
    
    $existingCerts = aws acm list-certificates --query "CertificateSummaryList[?DomainName=='$DomainName'].CertificateArn" --output text --region us-east-1
    
    if ($existingCerts -and $existingCerts -ne "None") {
        $certificateArn = $existingCerts
        Write-Success "Found existing certificate: $certificateArn"
    } else {
        Write-Step "Creating new SSL certificate..."
        
        # Request certificate with DNS validation
        $certRequest = aws acm request-certificate `
            --domain-name $DomainName `
            --validation-method DNS `
            --region us-east-1 `
            --query 'CertificateArn' --output text
        
        if ($certRequest) {
            $certificateArn = $certRequest
            Write-Success "Certificate requested: $certificateArn"
            
            # Wait for certificate validation records
            Write-Step "Waiting for certificate validation records..."
            Start-Sleep -Seconds 10
            
            # Get validation records
            $validationRecords = aws acm describe-certificate `
                --certificate-arn $certificateArn `
                --region us-east-1 `
                --query 'Certificate.DomainValidationOptions[0].ResourceRecord' --output json
            
            if ($validationRecords) {
                $validation = $validationRecords | ConvertFrom-Json
                Write-Step "Adding DNS validation record to Route 53..."
                
                # Create validation record in Route 53
                $changeSet = @{
                    Changes = @(
                        @{
                            Action = "CREATE"
                            ResourceRecordSet = @{
                                Name = $validation.Name
                                Type = $validation.Type
                                TTL = 300
                                ResourceRecords = @(
                                    @{
                                        Value = $validation.Value
                                    }
                                )
                            }
                        }
                    )
                } | ConvertTo-Json -Depth 5
                
                $changeResult = aws route53 change-resource-record-sets `
                    --hosted-zone-id $HOSTED_ZONE_ID `
                    --change-batch $changeSet
                
                if ($changeResult) {
                    Write-Success "DNS validation record added"
                    Write-Step "Waiting for certificate validation (this may take 5-10 minutes)..."
                    
                    # Wait for certificate to be validated
                    $timeout = 600 # 10 minutes
                    $elapsed = 0
                    $interval = 30
                    
                    do {
                        Start-Sleep -Seconds $interval
                        $elapsed += $interval
                        
                        $certStatus = aws acm describe-certificate `
                            --certificate-arn $certificateArn `
                            --region us-east-1 `
                            --query 'Certificate.Status' --output text
                        
                        Write-Host "Certificate status: $certStatus (${elapsed}s elapsed)"
                        
                        if ($certStatus -eq "ISSUED") {
                            Write-Success "Certificate validated and issued!"
                            break
                        }
                        
                        if ($elapsed -ge $timeout) {
                            Write-Warning "Certificate validation timeout. Continuing with deployment..."
                            break
                        }
                    } while ($certStatus -eq "PENDING_VALIDATION")
                } else {
                    Write-Warning "Failed to add DNS validation record. Certificate may need manual validation."
                }
            } else {
                Write-Warning "Could not retrieve certificate validation records"
            }
        } else {
            Write-Error "Failed to request SSL certificate"
            exit 1
        }
    }
}

# Deploy with CDK
Write-Step "Deploying infrastructure with CDK..."

try {
    Push-Location "infrastructure/cdk"
    
    # Install CDK dependencies
    Write-Step "Installing CDK dependencies..."
    npm install
    
    # Bootstrap CDK (if needed)
    Write-Step "Bootstrapping CDK..."
    npx cdk bootstrap --require-approval never
    
    # Build CDK
    Write-Step "Building CDK..."
    npm run build
    
    # Deploy CDK stack
    Write-Step "Deploying CDK stack..."
    $cdkArgs = @(
        "deploy"
        "--require-approval", "never"
        "--context", "environment=$Environment"
        "--context", "domainName=$DomainName"
        "--context", "hostedZoneId=$HOSTED_ZONE_ID"
    )
    
    if ($certificateArn) {
        $cdkArgs += "--context"
        $cdkArgs += "certificateArn=$certificateArn"
    }
    
    $cdkDeployResult = npx cdk @cdkArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "CDK deployment failed: $cdkDeployResult"
        throw "CDK deployment failed"
    }
    
    Write-Success "Infrastructure deployed successfully"
    
} catch {
    Write-Error "Infrastructure deployment failed: $_"
    exit 1
} finally {
    Pop-Location
}

# Deploy Frontend
Write-Step "Deploying frontend..."

try {
    # Install frontend dependencies
    Write-Step "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    
    # Build frontend
    Write-Step "Building frontend..."
    $env:CI = "false"
    npm run build
    
    # Get frontend bucket name from stack outputs
    $frontendBucket = aws cloudformation describe-stacks `
        --stack-name "carbonlens-ai-$Environment" `
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text
    
    if ($frontendBucket) {
        Write-Step "Uploading to S3 bucket: $frontendBucket"
        aws s3 sync build/ "s3://$frontendBucket" --delete --cache-control "max-age=86400"
        
        # Get CloudFront distribution ID
        $distributionId = aws cloudformation describe-stacks `
            --stack-name "carbonlens-ai-$Environment" `
            --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text
        
        if ($distributionId) {
            Write-Step "Invalidating CloudFront cache..."
            aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
        }
        
        Write-Success "Frontend deployed successfully"
    } else {
        Write-Error "Could not find frontend bucket name"
        exit 1
    }
    
} catch {
    Write-Error "Frontend deployment failed: $_"
    exit 1
}

# Verify deployment
Write-Step "Verifying deployment..."

Start-Sleep -Seconds 30

try {
    Write-Step "Testing custom domain: https://$DomainName"
    $response = Invoke-WebRequest -Uri "https://$DomainName" -Method Head -UseBasicParsing -TimeoutSec 30
    
    if ($response.StatusCode -eq 200) {
        Write-Success "✅ Custom domain is working!"
    } else {
        Write-Warning "Custom domain returned status: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Custom domain test failed: $($_.Exception.Message)"
    Write-Warning "DNS propagation may still be in progress"
}

# Final success message
Write-Success "🎉 Route 53 automated deployment completed!"
Write-Success "🌐 Application URL: https://$DomainName"

Write-Step "Deployment Summary:"
Write-Host "  Environment: $Environment"
Write-Host "  Domain: $DomainName"
Write-Host "  Hosted Zone: $HOSTED_ZONE_ID"
if ($certificateArn) {
    Write-Host "  Certificate: $certificateArn"
}
Write-Host "  DNS Management: Automated via Route 53"
Write-Host "  SSL Certificate: Automated via ACM"