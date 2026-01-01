# CarbonLens AI - AWS CDK Deployment Guide

This guide covers the new AWS CDK-based infrastructure deployment for CarbonLens AI, modeled after enterprise-grade CI/CD practices.

## 🏗️ Architecture Overview

### **Infrastructure as Code with AWS CDK**
- **AWS CDK v2**: TypeScript-based infrastructure definitions
- **Multi-Environment**: Dev, Staging, Production environments
- **Automated Deployment**: PowerShell scripts for consistent deployments
- **CI/CD Integration**: GitHub Actions with environment-specific workflows

### **AWS Services**
- **Frontend**: S3 + CloudFront + Route 53 (optional custom domain)
- **Backend**: Lambda Functions via Serverless Framework v3
- **Database**: DynamoDB with GSI for user queries
- **Authentication**: Cognito User Pools
- **AI Services**: Bedrock, Textract, Rekognition, Comprehend
- **Monitoring**: CloudWatch Logs and Metrics

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- AWS CLI v2
- PowerShell 7+ (Windows/Linux/macOS)
- AWS Account with appropriate permissions

### **1. Environment Setup**
```powershell
# Clone and setup
git clone <repository-url>
cd carbonlens-ai

# Run setup script
.\scripts\setup-environment.ps1 -Environment dev
```

### **2. Configure AWS Credentials**
```bash
aws configure
# Enter your AWS Access Key ID, Secret, Region (us-east-1), and output format (json)
```

### **3. Deploy to Development**
```powershell
# Basic deployment (no custom domain)
.\scripts\deploy.ps1 -Environment dev

# With custom domain
.\scripts\deploy.ps1 -Environment dev -DomainName "dev.carbonlens-ai.yourdomain.com" -CertificateArn "arn:aws:acm:..." -HostedZoneId "Z123..."
```

## 📁 Project Structure

```
carbonlens-ai/
├── .github/workflows/          # GitHub Actions CI/CD
│   ├── deploy.yml             # Main CI/CD pipeline
│   ├── pr-checks.yml          # Pull request validation
│   ├── security-scan.yml      # Security scanning
│   ├── performance-monitoring.yml
│   ├── scheduled-health-checks.yml
│   └── dependency-update.yml
├── infrastructure/
│   └── cdk/                   # AWS CDK Infrastructure
│       ├── lib/
│       │   └── carbonlens-ai-stack.ts
│       ├── app.ts
│       ├── cdk.json
│       ├── package.json
│       └── tsconfig.json
├── scripts/                   # Deployment Scripts
│   ├── deploy.ps1            # Main deployment script
│   ├── setup-environment.ps1 # Environment setup
│   ├── destroy.ps1           # Infrastructure cleanup
│   └── test.ps1              # Test runner
├── backend/                   # Serverless Backend
│   ├── src/handlers/         # Lambda functions
│   ├── serverless.yml        # Serverless config
│   └── package.json
├── src/                      # React Frontend
└── build/                    # Built frontend assets
```

## 🔧 Deployment Scripts

### **Main Deployment Script**
```powershell
.\scripts\deploy.ps1 -Environment <env> [options]

Options:
  -Environment        dev|staging|prod (required)
  -DomainName        Custom domain (optional)
  -CertificateArn    SSL certificate ARN (optional)
  -HostedZoneId      Route 53 hosted zone ID (optional)
  -SkipInfrastructure Skip CDK deployment
  -SkipBackend       Skip Serverless deployment
  -SkipFrontend      Skip frontend deployment
```

### **Environment Setup**
```powershell
.\scripts\setup-environment.ps1 -Environment <env>
```

### **Testing**
```powershell
.\scripts\test.ps1 -Component <frontend|backend|all> [-Coverage] [-Watch]
```

### **Cleanup**
```powershell
.\scripts\destroy.ps1 -Environment <env> [-Force]
```

## 🌍 Multi-Environment Deployment

### **Development Environment**
- **Trigger**: Push to `develop` branch or manual
- **Domain**: Optional custom domain
- **Purpose**: Feature development and testing

```powershell
.\scripts\deploy.ps1 -Environment dev
```

### **Staging Environment**
- **Trigger**: Push to `main` branch or manual
- **Domain**: staging.yourdomain.com
- **Purpose**: Pre-production testing

```powershell
.\scripts\deploy.ps1 -Environment staging -DomainName "staging.carbonlens-ai.yourdomain.com"
```

### **Production Environment**
- **Trigger**: Manual deployment only
- **Domain**: yourdomain.com
- **Purpose**: Live application

```powershell
.\scripts\deploy.ps1 -Environment prod -DomainName "carbonlens-ai.yourdomain.com"
```

## 🔐 GitHub Secrets Configuration

### **Required Secrets**
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_ACCOUNT_ID=123456789012

# Domain Configuration (Optional)
DEV_DOMAIN_NAME=dev.carbonlens-ai.yourdomain.com
STAGING_DOMAIN_NAME=staging.carbonlens-ai.yourdomain.com
PROD_DOMAIN_NAME=carbonlens-ai.yourdomain.com

# SSL Certificates (Required for custom domains)
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/...
STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/...
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/...

# Route 53 Hosted Zones (Required for custom domains)
DEV_HOSTED_ZONE_ID=Z123...
STAGING_HOSTED_ZONE_ID=Z456...
PROD_HOSTED_ZONE_ID=Z789...
```

### **Setting Up Secrets**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its name and value

## 🏗️ AWS CDK Infrastructure

### **CDK Stack Components**
- **S3 Buckets**: Frontend hosting and document storage
- **CloudFront**: Global CDN with optional custom domain
- **DynamoDB**: Application data with GSI for user queries
- **Cognito**: User authentication and management
- **IAM Roles**: Lambda execution with appropriate permissions
- **Route 53**: DNS management (optional)

### **CDK Commands**
```bash
cd infrastructure/cdk

# Install dependencies
npm install

# Build TypeScript
npm run build

# View changes
npx cdk diff --context environment=dev

# Deploy
npx cdk deploy --context environment=dev

# Destroy
npx cdk destroy --context environment=dev
```

## 🔄 CI/CD Pipeline

### **Workflow Triggers**
| Environment | Trigger | Branch | Manual |
|-------------|---------|--------|--------|
| Development | Push | `develop` | ✅ |
| Staging | Push | `main` | ✅ |
| Production | Manual only | - | ✅ |

### **Pipeline Stages**
1. **Test Frontend**: ESLint, unit tests, coverage
2. **Test Backend**: Lambda function tests, coverage
3. **Build Frontend**: React build with optimization
4. **Deploy Infrastructure**: AWS CDK deployment
5. **Deploy Backend**: Serverless Framework deployment
6. **Deploy Frontend**: S3 upload + CloudFront invalidation
7. **Health Checks**: Smoke tests and validation

### **Manual Deployment**
```bash
# Go to GitHub Actions
# Select "CI/CD Pipeline"
# Click "Run workflow"
# Choose environment and options
```

## 🔍 Monitoring & Debugging

### **CloudWatch Logs**
- Lambda Functions: `/aws/lambda/carbonlensaibackend-{stage}-{function}`
- API Gateway: Automatic logging enabled

### **Useful AWS CLI Commands**
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name carbonlens-ai-dev

# View Lambda logs
aws logs tail /aws/lambda/carbonlensaibackend-dev-processDocument --follow

# List S3 buckets
aws s3 ls | grep carbonlens-ai

# Check DynamoDB tables
aws dynamodb list-tables | grep carbonlens-ai
```

### **CDK Debugging**
```bash
cd infrastructure/cdk

# View synthesized CloudFormation
npx cdk synth --context environment=dev

# Compare environments
npx cdk diff --context environment=staging

# View CDK metadata
npx cdk metadata --context environment=dev
```

## 🚨 Troubleshooting

### **Common Issues**

**CDK Bootstrap Required**
```bash
npx cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

**Permission Denied**
- Ensure AWS credentials have sufficient permissions
- Check IAM policies for CDK and Serverless deployment

**Domain Not Working**
- Verify SSL certificate is validated
- Check Route 53 DNS records
- Wait for DNS propagation (up to 48 hours)

**Lambda Deployment Fails**
- Check Serverless Framework version (should be v3)
- Verify IAM permissions for Lambda deployment
- Check CloudWatch logs for specific errors

### **Getting Help**
1. Check CloudWatch logs for specific errors
2. Review GitHub Actions workflow logs
3. Use CDK diff to see what's changing
4. Verify AWS resource quotas and limits

## 💰 Cost Optimization

### **AWS Free Tier Usage**
- **Lambda**: 1M requests/month
- **DynamoDB**: 25GB storage
- **S3**: 5GB storage
- **CloudFront**: 50GB data transfer
- **Route 53**: $0.50/month per hosted zone

### **Cost Monitoring**
- Set up AWS Budgets for cost alerts
- Use AWS Cost Explorer to track spending
- Monitor CloudWatch metrics for usage patterns

## 🔒 Security Best Practices

### **Infrastructure Security**
- All S3 buckets use Origin Access Control
- DynamoDB uses IAM-based access control
- Lambda functions have minimal required permissions
- Cognito enforces strong password policies

### **Deployment Security**
- All secrets stored in GitHub Secrets
- No hardcoded credentials in code
- AWS credentials use least privilege principle
- Regular dependency updates via automated PRs

## 📈 Scaling Considerations

### **Performance Optimization**
- CloudFront caching for global performance
- DynamoDB on-demand billing for cost efficiency
- Lambda cold start optimization
- S3 Transfer Acceleration (optional)

### **High Availability**
- Multi-AZ DynamoDB deployment
- CloudFront global edge locations
- Lambda automatic scaling
- S3 99.999999999% durability

## 🎯 Next Steps

1. **Setup Environment**: Run setup script and configure AWS
2. **Deploy Development**: Test deployment to dev environment
3. **Configure Domains**: Set up custom domains and SSL certificates
4. **Setup Monitoring**: Configure CloudWatch alarms and dashboards
5. **Production Deployment**: Deploy to staging, then production

---

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Serverless Framework Guide](https://www.serverless.com/framework/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Free Tier Details](https://aws.amazon.com/free/)

**Status**: ✅ **Production Ready with Enterprise CI/CD**