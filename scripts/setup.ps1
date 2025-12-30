# CarbonLens AI Setup Script for Windows
# This script sets up the development environment and prepares for deployment

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Setting up CarbonLens AI Development Environment" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Blue

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Install Serverless Framework if not present
try {
    $serverlessVersion = serverless --version
    Write-Host "✅ Serverless Framework found: $serverlessVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Serverless Framework..." -ForegroundColor Yellow
    npm install -g serverless
}

# Setup project structure
Write-Host "📁 Setting up project structure..." -ForegroundColor Blue

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

# Create environment files
Write-Host "⚙️ Creating environment configuration..." -ForegroundColor Blue

# Create .env file for local development
@"
REACT_APP_AWS_REGION=$Region
REACT_APP_ENVIRONMENT=$Environment
REACT_APP_PROJECT_NAME=carbonlens-ai
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Create deployment configuration
@"
{
  "environment": "$Environment",
  "region": "$Region",
  "projectName": "carbonlens-ai",
  "stackName": "carbonlens-ai-$Environment"
}
"@ | Out-File -FilePath "deploy-config.json" -Encoding UTF8

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. Configure your AWS credentials: aws configure" -ForegroundColor White
Write-Host "2. Deploy infrastructure: .\scripts\deploy.ps1" -ForegroundColor White
Write-Host "3. Start development: npm start" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Development Commands:" -ForegroundColor Blue
Write-Host "- npm start          : Start development server" -ForegroundColor White
Write-Host "- npm run build      : Build for production" -ForegroundColor White
Write-Host "- npm test           : Run tests" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Deployment Commands:" -ForegroundColor Blue
Write-Host "- .\scripts\deploy.ps1 : Deploy to AWS" -ForegroundColor White
Write-Host "- .\scripts\destroy.ps1: Destroy AWS resources" -ForegroundColor White