#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Test all Lambda functions health and performance
.DESCRIPTION
    This script tests all 7 Lambda functions for health, performance, and functionality
.PARAMETER Environment
    The environment to test (dev, staging, prod)
.PARAMETER Detailed
    Run detailed performance tests
.EXAMPLE
    .\scripts\test-lambda-functions.ps1 -Environment prod
.EXAMPLE
    .\scripts\test-lambda-functions.ps1 -Environment dev -Detailed
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [Parameter(Mandatory = $false)]
    [switch]$Detailed
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
    Write-ColorOutput "🔍 $Message" $Blue
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

Write-Step "Testing Lambda functions in environment: $Environment"

# Define all Lambda functions
$functions = @(
    @{
        Name = "carbonlens-ai-processDocument-$Environment"
        Description = "Process documents and extract carbon footprint data"
        TestPayload = @{
            documentType = "invoice"
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-calculateCarbon-$Environment"
        Description = "Calculate carbon footprint from logistics data"
        TestPayload = @{
            transportMode = "truck"
            distance = 100
            weight = 1000
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-getOptimizations-$Environment"
        Description = "Generate AI-powered optimization recommendations"
        TestPayload = @{
            calculationId = "test-calculation-id"
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-generateCertificate-$Environment"
        Description = "Generate carbon certificates with QR codes"
        TestPayload = @{
            calculationId = "test-calculation-id"
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-getDashboardData-$Environment"
        Description = "Retrieve dashboard analytics data"
        TestPayload = @{
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-seedTestData-$Environment"
        Description = "Seed database with test data"
        TestPayload = @{
            testData = $true
        }
    },
    @{
        Name = "carbonlens-ai-migrateUserData-$Environment"
        Description = "Migrate user data between versions"
        TestPayload = @{
            testData = $true
        }
    }
)

$totalFunctions = $functions.Count
$healthyFunctions = 0
$failedFunctions = 0
$results = @()

foreach ($function in $functions) {
    Write-Step "Testing function: $($function.Name)"
    
    $result = @{
        Name = $function.Name
        Description = $function.Description
        Status = "Unknown"
        State = "Unknown"
        LastModified = "Unknown"
        Runtime = "Unknown"
        MemorySize = 0
        Timeout = 0
        InvocationResult = "Not Tested"
        Duration = 0
        ErrorMessage = ""
        Metrics = @{}
    }
    
    try {
        # Check if function exists and get configuration
        Write-Host "  Checking function configuration..."
        $functionConfig = aws lambda get-function --function-name $function.Name --query 'Configuration' --output json 2>$null
        
        if ($functionConfig) {
            $config = $functionConfig | ConvertFrom-Json
            $result.State = $config.State
            $result.LastModified = $config.LastModified
            $result.Runtime = $config.Runtime
            $result.MemorySize = $config.MemorySize
            $result.Timeout = $config.Timeout
            
            if ($config.State -eq "Active") {
                Write-Success "  Function is active"
                $result.Status = "Active"
                
                # Get function metrics if detailed testing is enabled
                if ($Detailed) {
                    Write-Host "  Getting function metrics..."
                    
                    $endTime = Get-Date
                    $startTime = $endTime.AddHours(-1)
                    
                    # Get invocation count
                    $invocations = aws cloudwatch get-metric-statistics `
                        --namespace "AWS/Lambda" `
                        --metric-name "Invocations" `
                        --dimensions "Name=FunctionName,Value=$($function.Name)" `
                        --statistics "Sum" `
                        --start-time $startTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --end-time $endTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --period 3600 `
                        --query 'Datapoints[0].Sum' --output text 2>$null
                    
                    # Get error count
                    $errors = aws cloudwatch get-metric-statistics `
                        --namespace "AWS/Lambda" `
                        --metric-name "Errors" `
                        --dimensions "Name=FunctionName,Value=$($function.Name)" `
                        --statistics "Sum" `
                        --start-time $startTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --end-time $endTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --period 3600 `
                        --query 'Datapoints[0].Sum' --output text 2>$null
                    
                    # Get average duration
                    $avgDuration = aws cloudwatch get-metric-statistics `
                        --namespace "AWS/Lambda" `
                        --metric-name "Duration" `
                        --dimensions "Name=FunctionName,Value=$($function.Name)" `
                        --statistics "Average" `
                        --start-time $startTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --end-time $endTime.ToString("yyyy-MM-ddTHH:mm:ss") `
                        --period 3600 `
                        --query 'Datapoints[0].Average' --output text 2>$null
                    
                    $result.Metrics = @{
                        Invocations = if ($invocations -and $invocations -ne "None") { [int]$invocations } else { 0 }
                        Errors = if ($errors -and $errors -ne "None") { [int]$errors } else { 0 }
                        AvgDuration = if ($avgDuration -and $avgDuration -ne "None") { [math]::Round([double]$avgDuration, 2) } else { 0 }
                    }
                    
                    Write-Host "    📊 Invocations (1h): $($result.Metrics.Invocations)"
                    Write-Host "    📊 Errors (1h): $($result.Metrics.Errors)"
                    Write-Host "    📊 Avg Duration (1h): $($result.Metrics.AvgDuration)ms"
                    
                    # Calculate error rate
                    if ($result.Metrics.Invocations -gt 0) {
                        $errorRate = ($result.Metrics.Errors / $result.Metrics.Invocations) * 100
                        if ($errorRate -gt 5) {
                            Write-Warning "    High error rate: $([math]::Round($errorRate, 2))%"
                        }
                    }
                }
                
                # Test function invocation (only for safe functions)
                if ($function.Name -like "*getDashboardData*" -or $function.Name -like "*seedTestData*") {
                    Write-Host "  Testing function invocation..."
                    
                    $payload = $function.TestPayload | ConvertTo-Json -Compress
                    $invokeStart = Get-Date
                    
                    $invokeResult = aws lambda invoke `
                        --function-name $function.Name `
                        --payload $payload `
                        --cli-binary-format raw-in-base64-out `
                        response.json 2>&1
                    
                    $invokeDuration = (Get-Date) - $invokeStart
                    $result.Duration = [math]::Round($invokeDuration.TotalMilliseconds, 2)
                    
                    if ($LASTEXITCODE -eq 0 -and (Test-Path "response.json")) {
                        $response = Get-Content "response.json" -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
                        
                        if ($response) {
                            Write-Success "  Function invocation successful ($($result.Duration)ms)"
                            $result.InvocationResult = "Success"
                        } else {
                            Write-Warning "  Function returned invalid JSON"
                            $result.InvocationResult = "Invalid Response"
                        }
                        
                        Remove-Item "response.json" -ErrorAction SilentlyContinue
                    } else {
                        Write-Warning "  Function invocation failed: $invokeResult"
                        $result.InvocationResult = "Failed"
                        $result.ErrorMessage = $invokeResult
                    }
                } else {
                    Write-Host "  Skipping invocation test for this function type"
                    $result.InvocationResult = "Skipped"
                }
                
                $healthyFunctions++
            } else {
                Write-Error "  Function state: $($config.State)"
                $result.Status = $config.State
                $result.ErrorMessage = "Function is not in Active state"
                $failedFunctions++
            }
        } else {
            Write-Error "  Function not found or not accessible"
            $result.Status = "NotFound"
            $result.ErrorMessage = "Function not found or not accessible"
            $failedFunctions++
        }
    } catch {
        Write-Error "  Error checking function: $($_.Exception.Message)"
        $result.Status = "Error"
        $result.ErrorMessage = $_.Exception.Message
        $failedFunctions++
    }
    
    $results += $result
    Write-Host ""
}

# Generate summary report
Write-Step "Lambda Functions Health Summary"
Write-Host "Environment: $Environment"
Write-Host "Total Functions: $totalFunctions"
Write-Success "Healthy Functions: $healthyFunctions"
if ($failedFunctions -gt 0) {
    Write-Error "Failed Functions: $failedFunctions"
} else {
    Write-Success "Failed Functions: $failedFunctions"
}
Write-Host ""

# Detailed results
Write-Step "Detailed Results"
foreach ($result in $results) {
    $statusColor = switch ($result.Status) {
        "Active" { $Green }
        "NotFound" { $Red }
        "Error" { $Red }
        default { $Yellow }
    }
    
    Write-ColorOutput "📋 $($result.Name)" $Blue
    Write-ColorOutput "   Status: $($result.Status)" $statusColor
    Write-Host "   Description: $($result.Description)"
    Write-Host "   Runtime: $($result.Runtime)"
    Write-Host "   Memory: $($result.MemorySize)MB"
    Write-Host "   Timeout: $($result.Timeout)s"
    Write-Host "   Invocation: $($result.InvocationResult)"
    
    if ($result.Duration -gt 0) {
        Write-Host "   Duration: $($result.Duration)ms"
    }
    
    if ($result.Metrics.Count -gt 0) {
        Write-Host "   Metrics (1h): Invocations=$($result.Metrics.Invocations), Errors=$($result.Metrics.Errors), AvgDuration=$($result.Metrics.AvgDuration)ms"
    }
    
    if ($result.ErrorMessage) {
        Write-ColorOutput "   Error: $($result.ErrorMessage)" $Red
    }
    
    Write-Host ""
}

# Export results to JSON
$reportPath = "lambda-health-report-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Success "Health report saved to: $reportPath"

# Exit with appropriate code
if ($failedFunctions -gt 0) {
    Write-Error "❌ Lambda functions health check failed"
    exit 1
} else {
    Write-Success "✅ All Lambda functions are healthy"
    exit 0
}