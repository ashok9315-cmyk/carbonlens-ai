#!/usr/bin/env pwsh

# CarbonLens AI - Git Setup Script
# This script helps you set up Git and push to GitHub

param(
    [string]$GitHubUsername = "",
    [string]$UserName = "",
    [string]$UserEmail = ""
)

Write-Host "🔄 CarbonLens AI - Git Setup" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first:" -ForegroundColor Red
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Get user information if not provided
if ([string]::IsNullOrEmpty($UserName)) {
    $UserName = Read-Host "Enter your full name (for Git commits)"
}

if ([string]::IsNullOrEmpty($UserEmail)) {
    $UserEmail = Read-Host "Enter your email address (for Git commits)"
}

if ([string]::IsNullOrEmpty($GitHubUsername)) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
}

Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Blue
Write-Host "Name: $UserName" -ForegroundColor White
Write-Host "Email: $UserEmail" -ForegroundColor White
Write-Host "GitHub Username: $GitHubUsername" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with this configuration? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Setup cancelled" -ForegroundColor Yellow
    exit 0
}

try {
    Write-Host "⚙️ Step 1: Configuring Git..." -ForegroundColor Blue
    
    # Configure Git
    git config --global user.name "$UserName"
    git config --global user.email "$UserEmail"
    git config --global init.defaultBranch main
    
    Write-Host "✅ Git configured successfully" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📁 Step 2: Initializing repository..." -ForegroundColor Blue
    
    # Initialize Git repository if not already done
    if (!(Test-Path ".git")) {
        git init
        Write-Host "✅ Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "✅ Git repository already exists" -ForegroundColor Green
    }
    
    # Add remote if not already added
    $remoteExists = git remote get-url origin 2>$null
    if (!$remoteExists) {
        $repoUrl = "https://github.com/$GitHubUsername/carbonlens-ai.git"
        git remote add origin $repoUrl
        Write-Host "✅ GitHub remote added: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "✅ GitHub remote already configured: $remoteExists" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📦 Step 3: Preparing initial commit..." -ForegroundColor Blue
    
    # Add all files
    git add .
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ($status) {
        # Create initial commit
        git commit -m "Initial commit: CarbonLens AI - Complete serverless application with AI-powered carbon tracking"
        
        Write-Host "✅ Initial commit created" -ForegroundColor Green
    } else {
        Write-Host "✅ No changes to commit" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🚀 Step 4: Pushing to GitHub..." -ForegroundColor Blue
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Make sure you've created the repository on GitHub first!" -ForegroundColor Yellow
    Write-Host "   1. Go to https://github.com/new" -ForegroundColor White
    Write-Host "   2. Repository name: carbonlens-ai" -ForegroundColor White
    Write-Host "   3. Description: Intelligent Supply Chain Carbon Footprint Tracker" -ForegroundColor White
    Write-Host "   4. Choose Public or Private" -ForegroundColor White
    Write-Host "   5. DON'T initialize with README (we have one)" -ForegroundColor White
    Write-Host "   6. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    
    $pushConfirm = Read-Host "Have you created the GitHub repository? Push now? (y/N)"
    if ($pushConfirm -eq 'y' -or $pushConfirm -eq 'Y') {
        try {
            git push -u origin main
            Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Push failed. This is normal if the repository does not exist yet." -ForegroundColor Yellow
            Write-Host "   Create the repository on GitHub first, then run:" -ForegroundColor White
            Write-Host "   git push -u origin main" -ForegroundColor Cyan
        }
    } else {
        Write-Host "📝 To push later, run:" -ForegroundColor Yellow
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🎉 Git setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Blue
    Write-Host "1. Create repository on GitHub: https://github.com/new" -ForegroundColor White
    Write-Host "2. Push code: git push -u origin main" -ForegroundColor White
    Write-Host "3. Set up GitHub Actions secrets for automated deployment" -ForegroundColor White
    Write-Host "4. Configure branch protection rules" -ForegroundColor White
    Write-Host ""
    Write-Host "🔐 GitHub Actions Secrets to add:" -ForegroundColor Blue
    Write-Host "   AWS_ACCESS_KEY_ID" -ForegroundColor Cyan
    Write-Host "   AWS_SECRET_ACCESS_KEY" -ForegroundColor Cyan
    Write-Host "   AWS_ACCOUNT_ID: 790756194179" -ForegroundColor Cyan
    Write-Host "   CLOUDFRONT_DISTRIBUTION_ID: E2P398QOXMEM5S" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📚 Repository URL: https://github.com/$GitHubUsername/carbonlens-ai" -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual setup commands:" -ForegroundColor Yellow
    Write-Host "git config --global user.name `"$UserName`"" -ForegroundColor White
    Write-Host "git config --global user.email `"$UserEmail`"" -ForegroundColor White
    Write-Host "git init" -ForegroundColor White
    Write-Host "git remote add origin https://github.com/$GitHubUsername/carbonlens-ai.git" -ForegroundColor White
    Write-Host "git add ." -ForegroundColor White
    Write-Host "git commit -m `"Initial commit`"" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    exit 1
}
}