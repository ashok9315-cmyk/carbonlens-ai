# CarbonLens AI - Intelligent Supply Chain Carbon Footprint Tracker

## Overview
CarbonLens AI is an intelligent platform that automatically tracks and analyzes the carbon footprint of products throughout their entire supply chain journey, using AI to extract logistics data and provide actionable recommendations.

## Architecture
- **Frontend**: React dashboard hosted on S3 + CloudFront with custom domain
- **Backend**: Serverless architecture using AWS Lambda
- **AI Services**: Amazon Bedrock, Textract, Rekognition, Comprehend
- **Storage**: DynamoDB for data, S3 for documents
- **Authentication**: Amazon Cognito
- **API**: API Gateway with Lambda integration
- **DNS**: Route 53 with custom domain management
- **SSL**: AWS Certificate Manager with automatic validation

## Features
- Automated data capture from logistics documents
- Real-time carbon footprint analysis
- AI-powered optimization recommendations
- Blockchain-verified carbon certificates
- Consumer-facing transparency tools
- Compliance reporting dashboard
- QR code certificate verification
- Custom domain with professional SSL

## 🚀 Live Application
- **Custom Domain**: https://carbonlens-ai.solutionsynth.cloud
- **CloudFront Backup**: https://d1dqupktcu8kce.cloudfront.net
- **Backend API**: https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev
- **Status**: ✅ **FULLY OPERATIONAL**
- **Cost**: **$0/month** on AWS Free Tier

## 🛠️ Deployment Scripts

### **Full Deployment with Custom Domain**
```powershell
# Deploy entire application with custom domain support
.\scripts\deploy-with-domain.ps1 -CertificateArn 'arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689' -HostedZoneId 'Z02373041SS8TKQHXZLAR'
```

### **Backend Only Deployment**
```powershell
# Deploy serverless backend functions
cd backend
npx serverless deploy --stage dev --region us-east-1
cd ..
```

### **Frontend Only Deployment**
```powershell
# Build and deploy frontend
npm run build
aws s3 sync build/ s3://carbonlens-ai-web-dev-790756194179 --delete
aws cloudfront create-invalidation --distribution-id E2P398QOXMEM5S --paths "/*"
```

**Features:**
- ✅ Custom domain with SSL certificate
- ✅ Automatic CloudFront cache invalidation
- ✅ Route 53 DNS management
- ✅ Clean build process
- ✅ S3 sync with cache-control headers
- ✅ Comprehensive error handling
- ✅ Status reporting and URLs

## 📚 Documentation

### **Getting Started**
- [Quick Start Guide](QUICK_START.md) - Get up and running in 5 minutes
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [User Guide](docs/USER_GUIDE.md) - Complete application usage guide

### **Custom Domain Setup**
- [Custom Domain Setup](CUSTOM_DOMAIN_SETUP.md) - Complete custom domain configuration
- [Route 53 Transfer Guide](AWS_ROUTE53_TRANSFER_GUIDE.md) - Transfer domain to AWS Route 53
- [Fresh IAM User Setup](CREATE_FRESH_IAM_USER.md) - Create clean deployment user
- [GoDaddy DNS Setup](GODADDY_DNS_SETUP.md) - Configure DNS in GoDaddy

### **Development & Deployment**
- [Development Phases](docs/DEVELOPMENT_PHASES.md) - Complete development journey
- [Deployment Guide](docs/DEPLOYMENT.md) - Step-by-step deployment instructions
- [Manual Deployment](MANUAL_DEPLOYMENT.md) - Alternative deployment methods

### **Technical Documentation**
- [API Documentation](docs/API.md) - Complete API reference
- [Authentication Guide](docs/AUTHENTICATION_GUIDE.md) - Authentication methods and JWT tokens
- [Serverless Framework Guide](docs/SERVERLESS_FRAMEWORK_GUIDE.md) - Why and how we use Serverless Framework
- [Testing Guide](docs/TESTING_GUIDE.md) - Comprehensive testing strategy and implementation

### **AWS & Infrastructure**
- [AWS Credentials Guide](AWS_CREDENTIALS_GUIDE.md) - Setting up AWS access
- [AWS Free Tier Analysis](AWS_FREE_TIER_ANALYSIS.md) - Cost analysis and optimization

## 🏗️ Current Infrastructure

### **Production Stack: `carbonlens-ai-production`**
- **CloudFormation Template**: `infrastructure/cloudformation-simple.yml`
- **Frontend S3 Bucket**: `carbonlens-ai-web-dev-790756194179`
- **Documents S3 Bucket**: `carbonlens-ai-docs-dev-790756194179`
- **DynamoDB Table**: `carbonlens-ai-data-dev`
- **CloudFront Distribution**: `E2P398QOXMEM5S`
- **Cognito User Pool**: `us-east-1_pesPWWfoF`
- **User Pool Client**: `6lm8qg1seqc7o05tkp03ecv4v9`

### **Custom Domain Configuration**
- **Domain**: `carbonlens-ai.solutionsynth.cloud`
- **SSL Certificate**: `arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689`
- **Route 53 Hosted Zone**: `Z02373041SS8TKQHXZLAR`
- **DNS Management**: Fully automated via Route 53

## Team
**Synth AI**
- Primary Contact: Ashok (ashok931502@gmail.com)
- Country: India
- Track: Social Good (with Commercial Potential)