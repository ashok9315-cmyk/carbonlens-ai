# Simple CarbonLens AI Deployment Script
# Run each step manually if needed

param(
    [string]$Environment = "dev",
    [string]$Region = "us-east-1"
)

$ProjectName = "carbonlens-ai"
$StackName = "$ProjectName-$Environment"

Write-Host "=== CarbonLens AI Deployment ===" -ForegroundColor Green
Write-Host "Environment: $Environment"
Write-Host "Region: $Region"
Write-Host "Stack: $StackName"
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "Step 1: Checking Prerequisites" -ForegroundColor Yellow
Write-Host "Checking AWS CLI..."
try {
    aws --version
    Write-Host "AWS CLI: OK" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI: NOT FOUND" -ForegroundColor Red
    Write-Host "Please install AWS CLI and run 'aws configure'"
    exit 1
}

Write-Host "Checking Node.js..."
try {
    node --version
    Write-Host "Node.js: OK" -ForegroundColor Green
} catch {
    Write-Host "Node.js: NOT FOUND" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to continue with Step 2 (Deploy Infrastructure)"

# Step 2: Deploy Infrastructure
Write-Host "Step 2: Deploying Infrastructure" -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes..."

aws cloudformation deploy --template-file infrastructure/cloudformation.yml --stack-name $StackName --parameter-overrides Environment=$Environment ProjectName=$ProjectName --capabilities CAPABILITY_NAMED_IAM --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Infrastructure deployment failed!" -ForegroundColor Red
    Write-Host "Check AWS CloudFormation console for details"
    exit 1
}

Write-Host "Infrastructure deployed successfully!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue with Step 3 (Install Dependencies)"

# Step 3: Install Dependencies
Write-Host "Step 3: Installing Dependencies" -ForegroundColor Yellow

Write-Host "Installing frontend dependencies..."
npm install

Write-Host "Installing backend dependencies..."
Set-Location backend
npm install
Set-Location ..

Write-Host "Installing Serverless Framework..."
npm install -g serverless

Write-Host "Dependencies installed!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue with Step 4 (Deploy Backend)"

# Step 4: Deploy Backend
Write-Host "Step 4: Deploying Backend Services" -ForegroundColor Yellow

Set-Location backend
serverless deploy --stage $Environment --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue with Step 5 (Get Configuration)"

# Step 5: Get Configuration Values
Write-Host "Step 5: Getting Configuration Values" -ForegroundColor Yellow

Write-Host "Getting CloudFormation outputs..."
aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs"

Write-Host ""
Write-Host "Getting API Gateway URL..."
Set-Location backend
serverless info --stage $Environment --region $Region
Set-Location ..

Write-Host ""
Write-Host "IMPORTANT: Copy the values above for the next step!" -ForegroundColor Red
Write-Host "You'll need:"
Write-Host "- FrontendBucketName"
Write-Host "- UserPoolId"
Write-Host "- UserPoolClientId"
Write-Host "- API Gateway URL (from serverless info)"
Write-Host ""
Read-Host "Press Enter when you've noted the values above"

# Step 6: Manual Configuration
Write-Host "Step 6: Manual Configuration Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please create src/aws-config.js with the following content:" -ForegroundColor Cyan
Write-Host ""
Write-Host "export const awsConfig = {" -ForegroundColor White
Write-Host "  Auth: {" -ForegroundColor White
Write-Host "    region: '$Region'," -ForegroundColor White
Write-Host "    userPoolId: 'YOUR_USER_POOL_ID'," -ForegroundColor White
Write-Host "    userPoolWebClientId: 'YOUR_CLIENT_ID'," -ForegroundColor White
Write-Host "  }," -ForegroundColor White
Write-Host "  API: {" -ForegroundColor White
Write-Host "    endpoints: [" -ForegroundColor White
Write-Host "      {" -ForegroundColor White
Write-Host "        name: 'carbonlens-api'," -ForegroundColor White
Write-Host "        endpoint: 'YOUR_API_GATEWAY_URL'," -ForegroundColor White
Write-Host "        region: '$Region'" -ForegroundColor White
Write-Host "      }" -ForegroundColor White
Write-Host "    ]" -ForegroundColor White
Write-Host "  }" -ForegroundColor White
Write-Host "};" -ForegroundColor White
Write-Host ""
Write-Host "Replace YOUR_USER_POOL_ID, YOUR_CLIENT_ID, and YOUR_API_GATEWAY_URL with actual values from above"
Write-Host ""
Read-Host "Press Enter when you've created the aws-config.js file"

# Step 7: Build and Deploy Frontend
Write-Host "Step 7: Building and Deploying Frontend" -ForegroundColor Yellow

Write-Host "Building React application..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Enter your Frontend Bucket Name from Step 5:"
$FrontendBucket = Read-Host "Frontend Bucket Name"

Write-Host "Uploading to S3..."
aws s3 sync build/ s3://$FrontendBucket --delete --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your CarbonLens AI application is now deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "To get your application URL, run:" -ForegroundColor Yellow
Write-Host "aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs[?OutputKey==``CloudFrontDomainName``].OutputValue' --output text"
Write-Host ""
Write-Host "Then visit: https://[your-cloudfront-domain]" -ForegroundColor Cyan