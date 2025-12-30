# CarbonLens AI Test Automation Script
# Runs comprehensive test suite including unit, integration, and functional tests

param(
    [string]$TestType = "all",
    [switch]$Coverage = $false,
    [switch]$Watch = $false,
    [switch]$CI = $false
)

$ProjectName = "CarbonLens AI"

Write-Host "🧪 Running $ProjectName Test Suite" -ForegroundColor Green
Write-Host "Test Type: $TestType" -ForegroundColor Yellow
Write-Host "Coverage: $Coverage" -ForegroundColor Yellow
Write-Host "Watch Mode: $Watch" -ForegroundColor Yellow
Write-Host "CI Mode: $CI" -ForegroundColor Yellow
Write-Host ""

# Function to run tests with proper error handling
function Run-Tests {
    param(
        [string]$TestCommand,
        [string]$TestName,
        [string]$Directory = "."
    )
    
    Write-Host "🔍 Running $TestName..." -ForegroundColor Blue
    
    Push-Location $Directory
    
    try {
        if ($CI) {
            $TestCommand += " --ci"
        }
        
        Invoke-Expression $TestCommand
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $TestName passed" -ForegroundColor Green
        } else {
            Write-Host "❌ $TestName failed" -ForegroundColor Red
            $global:TestsFailed = $true
        }
    }
    catch {
        Write-Host "❌ $TestName failed with error: $($_.Exception.Message)" -ForegroundColor Red
        $global:TestsFailed = $true
    }
    finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Initialize test results
$global:TestsFailed = $false

# Frontend Unit Tests
if ($TestType -eq "all" -or $TestType -eq "unit" -or $TestType -eq "frontend") {
    $frontendTestCommand = "npm test"
    
    if ($Coverage) {
        $frontendTestCommand += " -- --coverage"
    }
    
    if ($Watch) {
        $frontendTestCommand += " -- --watch"
    }
    
    if ($CI) {
        $frontendTestCommand += " -- --watchAll=false"
    }
    
    Run-Tests $frontendTestCommand "Frontend Unit Tests" "."
}

# Backend Unit Tests
if ($TestType -eq "all" -or $TestType -eq "unit" -or $TestType -eq "backend") {
    $backendTestCommand = "npm test"
    
    if ($Coverage) {
        $backendTestCommand += " -- --coverage"
    }
    
    if ($Watch) {
        $backendTestCommand += " -- --watch"
    }
    
    if ($CI) {
        $backendTestCommand += " -- --watchAll=false"
    }
    
    Run-Tests $backendTestCommand "Backend Unit Tests" "backend"
}

# Integration Tests
if ($TestType -eq "all" -or $TestType -eq "integration") {
    Write-Host "🔗 Running Integration Tests..." -ForegroundColor Blue
    
    # Check if AWS credentials are configured
    try {
        aws sts get-caller-identity | Out-Null
        Write-Host "✅ AWS credentials configured" -ForegroundColor Green
        
        # Run API integration tests
        $integrationTestCommand = "npm test -- --testPathPattern=integration"
        
        if ($Coverage) {
            $integrationTestCommand += " --coverage"
        }
        
        Run-Tests $integrationTestCommand "API Integration Tests" "backend"
        
    } catch {
        Write-Host "⚠️ AWS credentials not configured, skipping integration tests" -ForegroundColor Yellow
    }
}

# Functional Tests (E2E)
if ($TestType -eq "all" -or $TestType -eq "e2e" -or $TestType -eq "functional") {
    Write-Host "🎭 Running End-to-End Tests..." -ForegroundColor Blue
    
    # Check if application is running
    try {
        $response = Invoke-WebRequest -Uri "https://carbonlens-ai.solutionsynth.cloud" -Method HEAD -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is accessible" -ForegroundColor Green
            
            # Install Playwright if not already installed
            if (!(Test-Path "node_modules/@playwright")) {
                Write-Host "📦 Installing Playwright..." -ForegroundColor Blue
                npm install --save-dev @playwright/test
                npx playwright install
            }
            
            Run-Tests "npx playwright test" "End-to-End Tests" "."
        }
    } catch {
        Write-Host "⚠️ Application not accessible, skipping E2E tests" -ForegroundColor Yellow
        Write-Host "   Make sure the application is deployed and running" -ForegroundColor Gray
    }
}

# Performance Tests
if ($TestType -eq "all" -or $TestType -eq "performance") {
    Write-Host "⚡ Running Performance Tests..." -ForegroundColor Blue
    
    # Check if API is accessible
    try {
        $response = Invoke-WebRequest -Uri "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/optimizations" -Method HEAD -TimeoutSec 10
        Write-Host "⚠️ API requires authentication, running authenticated performance tests" -ForegroundColor Yellow
        
        Run-Tests "npm test -- --testPathPattern=performance" "Performance Tests" "backend"
        
    } catch {
        Write-Host "⚠️ API not accessible, skipping performance tests" -ForegroundColor Yellow
    }
}

# Lint and Code Quality (if requested)
if ($TestType -eq "all" -or $TestType -eq "lint") {
    Write-Host "🔍 Running Code Quality Checks..." -ForegroundColor Blue
    
    # ESLint for frontend
    if (Test-Path "node_modules/.bin/eslint") {
        Run-Tests "npx eslint src --ext .js,.jsx" "Frontend Linting" "."
    }
    
    # ESLint for backend
    if (Test-Path "backend/node_modules/.bin/eslint") {
        Run-Tests "npx eslint src --ext .js" "Backend Linting" "backend"
    }
}

# Security Tests
if ($TestType -eq "all" -or $TestType -eq "security") {
    Write-Host "🛡️ Running Security Tests..." -ForegroundColor Blue
    
    # npm audit for frontend
    Run-Tests "npm audit --audit-level moderate" "Frontend Security Audit" "."
    
    # npm audit for backend
    Run-Tests "npm audit --audit-level moderate" "Backend Security Audit" "backend"
}

# Generate Test Report
Write-Host "📊 Test Summary" -ForegroundColor Blue
Write-Host "===============" -ForegroundColor Blue

if ($global:TestsFailed) {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Review test output above for specific failures" -ForegroundColor White
    Write-Host "2. Fix failing tests" -ForegroundColor White
    Write-Host "3. Run tests again: .\scripts\test.ps1 -TestType unit" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    
    if ($Coverage) {
        Write-Host "📈 Coverage Reports:" -ForegroundColor Blue
        Write-Host "- Frontend: coverage/lcov-report/index.html" -ForegroundColor White
        Write-Host "- Backend: backend/coverage/lcov-report/index.html" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "🎉 $ProjectName is ready for deployment!" -ForegroundColor Green
}

# Additional test commands help
if (!$CI) {
    Write-Host "💡 Available Test Commands:" -ForegroundColor Blue
    Write-Host ""
    Write-Host "# Run specific test types:" -ForegroundColor Gray
    Write-Host ".\scripts\test.ps1 -TestType unit" -ForegroundColor White
    Write-Host ".\scripts\test.ps1 -TestType integration" -ForegroundColor White
    Write-Host ".\scripts\test.ps1 -TestType e2e" -ForegroundColor White
    Write-Host ".\scripts\test.ps1 -TestType performance" -ForegroundColor White
    Write-Host ""
    Write-Host "# Run with coverage:" -ForegroundColor Gray
    Write-Host ".\scripts\test.ps1 -Coverage" -ForegroundColor White
    Write-Host ""
    Write-Host "# Run in watch mode:" -ForegroundColor Gray
    Write-Host ".\scripts\test.ps1 -TestType unit -Watch" -ForegroundColor White
    Write-Host ""
    Write-Host "# Run in CI mode:" -ForegroundColor Gray
    Write-Host ".\scripts\test.ps1 -CI" -ForegroundColor White
}