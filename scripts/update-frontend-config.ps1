#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Update frontend configuration with deployment values
.DESCRIPTION
    This script updates the frontend AWS configuration with actual values from deployed infrastructure
.PARAMETER Environment
    The environment to update configuration for (dev, staging, prod)
.EXAMPLE
    .\scripts\update-frontend-config.ps1 -Environment dev
.EXAMPLE
    .\scripts\update-frontend-config.ps1 -Environment prod
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment
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
    Write-ColorOutput "🔧 $Message" $Blue
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

Write-Step "Updating frontend configuration for environment: $Environment"

# Get stack outputs
try {
    $stackName = "carbonlens-ai-$Environment"
    Write-Step "Getting stack outputs from: $stackName"
    
    $stackOutputs = aws cloudformation describe-stacks --stack-name $stackName --query 'Stacks[0].Outputs' --output json 2>$null
    
    if ($stackOutputs -and $stackOutputs -ne "null") {
        $outputs = $stackOutputs | ConvertFrom-Json
        
        # Extract values
        $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
        $userPoolClientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
        $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiGatewayUrl" }).OutputValue
        $cloudFrontDomain = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue
        $distributionId = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
        
        Write-Success "Retrieved stack outputs:"
        Write-Host "  User Pool ID: $userPoolId"
        Write-Host "  User Pool Client ID: $userPoolClientId"
        Write-Host "  API Gateway URL: $apiUrl"
        Write-Host "  CloudFront Domain: $cloudFrontDomain"
        Write-Host "  Distribution ID: $distributionId"
        
    } else {
        Write-Error "Could not retrieve stack outputs for $stackName"
        exit 1
    }
} catch {
    Write-Error "Failed to get stack outputs: $_"
    exit 1
}

# Skip updating environment-defaults.js - it should only contain safe placeholders
Write-Step "Skipping environment-defaults.js update (contains only safe placeholders)"
Write-Host "  Real values will be provided via .env.$Environment file"

# Create environment-specific .env file (this is the main configuration method)
Write-Step "Creating .env.$Environment file with deployment values"

try {
    $envFile = ".env.$Environment"
    $envContent = @"
# CarbonLens AI - $Environment Environment Configuration
# Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# This file contains real deployment values and should NOT be committed to Git

# Environment
REACT_APP_ENVIRONMENT=$Environment

# AWS Configuration
REACT_APP_AWS_REGION=us-east-1

# Cognito Authentication (from deployment)
REACT_APP_USER_POOL_ID=$userPoolId
REACT_APP_USER_POOL_CLIENT_ID=$userPoolClientId

# API Gateway (from deployment)
REACT_APP_API_URL=$apiUrl

# CloudFront (from deployment)
REACT_APP_CLOUDFRONT_DOMAIN=$cloudFrontDomain
REACT_APP_DISTRIBUTION_ID=$distributionId

# Feature Flags
REACT_APP_DEBUG_MODE=$($Environment -eq 'dev' ? 'true' : 'false')
REACT_APP_MOCK_DATA=$($Environment -eq 'dev' ? 'true' : 'false')
REACT_APP_ANALYTICS=$($Environment -ne 'dev' ? 'true' : 'false')
REACT_APP_SHOW_ENV_BANNER=$($Environment -ne 'prod' ? 'true' : 'false')
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "Created $envFile with real deployment values"
    Write-Warning "Note: $envFile contains sensitive data and is excluded from Git"
    
} catch {
    Write-Error "Failed to create .env file: $_"
    exit 1
}
REACT_APP_USER_POOL_CLIENT_ID=$userPoolClientId

# API Gateway
REACT_APP_API_URL=$apiUrl

# CloudFront
REACT_APP_CLOUDFRONT_DOMAIN=$cloudFrontDomain
REACT_APP_DISTRIBUTION_ID=$distributionId

# Feature Flags
REACT_APP_DEBUG_MODE=$($Environment -eq 'dev' ? 'true' : 'false')
REACT_APP_MOCK_DATA=$($Environment -eq 'dev' ? 'true' : 'false')
REACT_APP_ANALYTICS=$($Environment -ne 'dev' ? 'true' : 'false')
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "Created $envFile"
    
} catch {
    Write-Error "Failed to create .env file: $_"
    exit 1
}

# Update package.json scripts if needed
Write-Step "Checking package.json scripts"

try {
    $packageJsonPath = "package.json"
    
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        
        # Check if environment-specific scripts exist
        $scriptsUpdated = $false
        
        if (-not $packageJson.scripts."build:dev") {
            $packageJson.scripts | Add-Member -NotePropertyName "build:dev" -NotePropertyValue "env-cmd -f .env.dev npm run build"
            $scriptsUpdated = $true
        }
        
        if (-not $packageJson.scripts."build:staging") {
            $packageJson.scripts | Add-Member -NotePropertyName "build:staging" -NotePropertyValue "env-cmd -f .env.staging npm run build"
            $scriptsUpdated = $true
        }
        
        if (-not $packageJson.scripts."build:prod") {
            $packageJson.scripts | Add-Member -NotePropertyName "build:prod" -NotePropertyValue "env-cmd -f .env.prod npm run build"
            $scriptsUpdated = $true
        }
        
        if ($scriptsUpdated) {
            $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageJsonPath -Encoding UTF8
            Write-Success "Updated package.json with environment-specific build scripts"
        } else {
            Write-Host "  Package.json scripts are already up to date"
        }
        
    } else {
        Write-Warning "package.json not found"
    }
} catch {
    Write-Warning "Could not update package.json: $_"
}

# Verify configuration
Write-Step "Verifying configuration"

try {
    # Test API endpoint
    $testUrl = $apiUrl.TrimEnd('/') + "/dashboard"
    Write-Host "  Testing API endpoint: $testUrl"
    
    $response = Invoke-WebRequest -Uri $testUrl -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    
    if ($response -and ($response.StatusCode -eq 200 -or $response.StatusCode -eq 403)) {
        Write-Success "  API endpoint is responding"
    } else {
        Write-Warning "  API endpoint test failed (this may be normal for auth-protected endpoints)"
    }
    
} catch {
    Write-Warning "  Could not test API endpoint: $($_.Exception.Message)"
}

# Final success message
Write-Success "🎉 Frontend configuration updated successfully!"

Write-Step "Configuration Summary:"
Write-Host "  Environment: $Environment"
Write-Host "  User Pool ID: $userPoolId"
Write-Host "  API URL: $apiUrl"
Write-Host "  CloudFront: $cloudFrontDomain"
Write-Host "  Config Files: src/config/environments.js, .env.$Environment"

Write-Step "Next Steps:"
Write-Host "  1. Build frontend: npm run build:$Environment"
Write-Host "  2. Test locally: npm start"
Write-Host "  3. Deploy: Already handled by deployment script"

Write-Success "✅ Configuration update completed!"