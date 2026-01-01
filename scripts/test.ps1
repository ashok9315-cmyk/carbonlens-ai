#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Run tests for CarbonLens AI
.DESCRIPTION
    This script runs all tests for the CarbonLens AI application
.PARAMETER Component
    Which component to test (frontend, backend, all)
.PARAMETER Coverage
    Generate coverage reports
.PARAMETER Watch
    Run tests in watch mode
.EXAMPLE
    .\scripts\test.ps1
.EXAMPLE
    .\scripts\test.ps1 -Component frontend -Coverage
.EXAMPLE
    .\scripts\test.ps1 -Component backend -Watch
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("frontend", "backend", "all")]
    [string]$Component = "all",
    
    [Parameter(Mandatory = $false)]
    [switch]$Coverage,
    
    [Parameter(Mandatory = $false)]
    [switch]$Watch
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
    Write-ColorOutput "🧪 $Message" $Blue
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

Write-Step "Running tests for CarbonLens AI..."

# Build test command arguments
$testArgs = @()
if ($Coverage) {
    $testArgs += "--coverage"
}
if (-not $Watch) {
    $testArgs += "--watchAll=false"
}

$frontendSuccess = $true
$backendSuccess = $true

# Run Frontend Tests
if ($Component -eq "frontend" -or $Component -eq "all") {
    Write-Step "Running frontend tests..."
    
    try {
        # Check if dependencies are installed
        if (-not (Test-Path "node_modules")) {
            Write-Step "Installing frontend dependencies..."
            npm install --legacy-peer-deps
        }
        
        # Run tests
        if ($Watch) {
            npm test
        } else {
            if ($Coverage) {
                npm run test:coverage
            } else {
                npm run test:ci
            }
        }
        
        Write-Success "Frontend tests completed successfully"
    } catch {
        Write-Error "Frontend tests failed: $_"
        $frontendSuccess = $false
    }
}

# Run Backend Tests
if ($Component -eq "backend" -or $Component -eq "all") {
    Write-Step "Running backend tests..."
    
    try {
        Push-Location "backend"
        
        # Check if dependencies are installed
        if (-not (Test-Path "node_modules")) {
            Write-Step "Installing backend dependencies..."
            npm install --legacy-peer-deps
        }
        
        # Run tests
        if ($Watch) {
            npm run test:watch
        } else {
            if ($Coverage) {
                npm run test:coverage
            } else {
                npm run test:ci
            }
        }
        
        Write-Success "Backend tests completed successfully"
    } catch {
        Write-Error "Backend tests failed: $_"
        $backendSuccess = $false
    } finally {
        Pop-Location
    }
}

# Run CDK Tests (if they exist)
if ($Component -eq "all") {
    Write-Step "Running CDK tests..."
    
    try {
        Push-Location "infrastructure/cdk"
        
        # Check if dependencies are installed
        if (-not (Test-Path "node_modules")) {
            Write-Step "Installing CDK dependencies..."
            npm install
        }
        
        # Build first
        npm run build
        
        # Run tests if they exist
        if (Test-Path "test") {
            npm test
            Write-Success "CDK tests completed successfully"
        } else {
            Write-Warning "No CDK tests found"
        }
    } catch {
        Write-Warning "CDK tests failed: $_"
    } finally {
        Pop-Location
    }
}

# Summary
Write-Step "Test Summary:"
if ($Component -eq "frontend" -or $Component -eq "all") {
    if ($frontendSuccess) {
        Write-Success "Frontend: PASSED"
    } else {
        Write-Error "Frontend: FAILED"
    }
}

if ($Component -eq "backend" -or $Component -eq "all") {
    if ($backendSuccess) {
        Write-Success "Backend: PASSED"
    } else {
        Write-Error "Backend: FAILED"
    }
}

# Coverage reports
if ($Coverage) {
    Write-Step "Coverage Reports:"
    
    if ($Component -eq "frontend" -or $Component -eq "all") {
        if (Test-Path "coverage/lcov-report/index.html") {
            Write-Success "Frontend coverage: coverage/lcov-report/index.html"
        }
    }
    
    if ($Component -eq "backend" -or $Component -eq "all") {
        if (Test-Path "backend/coverage/lcov-report/index.html") {
            Write-Success "Backend coverage: backend/coverage/lcov-report/index.html"
        }
    }
}

# Exit with appropriate code
if (($Component -eq "frontend" -and -not $frontendSuccess) -or 
    ($Component -eq "backend" -and -not $backendSuccess) -or
    ($Component -eq "all" -and (-not $frontendSuccess -or -not $backendSuccess))) {
    exit 1
} else {
    Write-Success "🎉 All tests completed successfully!"
    exit 0
}