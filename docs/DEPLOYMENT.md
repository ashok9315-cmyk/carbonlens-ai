# CarbonLens AI Deployment Guide

This guide walks you through deploying CarbonLens AI to AWS with custom domain support using the Free Tier services.

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with Free Tier access
2. **AWS CLI** installed and configured
3. **Node.js** (version 16 or higher)
4. **Git** for version control
5. **Custom Domain** (optional) - we use `carbonlens-ai.solutionsynth.cloud`

## Current Live Deployment

The application is currently deployed and operational:

- **Custom Domain**: https://carbonlens-ai.solutionsynth.cloud
- **CloudFront Backup**: https://d1dqupktcu8kce.cloudfront.net
- **Backend API**: https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev
- **Status**: ✅ **FULLY OPERATIONAL**

## Quick Start

### Windows Users

1. **Setup Environment**
   ```powershell
   npm install
   cd backend && npm install && cd ..
   ```

2. **Configure AWS Credentials**
   ```powershell
   aws configure
   ```

3. **Deploy with Custom Domain**
   ```powershell
   .\scripts\deploy-with-domain.ps1 -CertificateArn 'arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689' -HostedZoneId 'Z02373041SS8TKQHXZLAR'
   ```

### Linux/Mac Users

1. **Setup Environment**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```

3. **Deploy Application**
   ```bash
   # Create executable script
   chmod +x scripts/deploy-with-domain.sh
   ./scripts/deploy-with-domain.sh
   ```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### Step 1: Deploy Infrastructure

Deploy the CloudFormation stack:

```bash
aws cloudformation deploy \
    --template-file infrastructure/cloudformation-simple.yml \
    --stack-name carbonlens-ai-production \
    --parameter-overrides \
        Environment=dev \
        ProjectName=carbonlens-ai \
        DomainName=carbonlens-ai.solutionsynth.cloud \
        CertificateArn=arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689 \
    --capabilities CAPABILITY_IAM \
    --region us-east-1
```

### Step 2: Deploy Backend Services

```bash
cd backend
npm install
serverless deploy --stage dev --region us-east-1
cd ..
```

### Step 3: Build and Deploy Frontend

```bash
npm install
npm run build
aws s3 sync build/ s3://carbonlens-ai-web-dev-790756194179 --delete
aws cloudfront create-invalidation --distribution-id E2P398QOXMEM5S --paths "/*"
```

### Step 4: Configure DNS (if using custom domain)

```bash
# Create Route 53 DNS record
aws route53 change-resource-record-sets --hosted-zone-id Z02373041SS8TKQHXZLAR --change-batch '{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "carbonlens-ai.solutionsynth.cloud",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "d1dqupktcu8kce.cloudfront.net"
          }
        ]
      }
    }
  ]
}'
```

## Architecture Overview

The application uses the following AWS services:

### Compute & Storage
- **AWS Lambda**: Serverless functions for document processing and carbon calculations
- **Amazon S3**: Static website hosting and document storage
- **Amazon DynamoDB**: NoSQL database for application data

### AI Services
- **Amazon Bedrock**: Nova models for AI insights and optimization recommendations
- **Amazon Textract**: Document text extraction
- **Amazon Rekognition**: Image and label recognition
- **Amazon Comprehend**: Natural language processing

### Security & Networking
- **Amazon Cognito**: User authentication and authorization
- **Amazon API Gateway**: RESTful API management
- **Amazon CloudFront**: Content delivery network with custom domain
- **AWS Route 53**: DNS management and domain hosting
- **AWS Certificate Manager**: SSL/TLS certificate management
- **AWS CloudWatch**: Monitoring and logging

## Current Infrastructure

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

## Environment Configuration

The application supports multiple environments:

- **dev**: Development environment (currently deployed)
- **staging**: Staging environment for testing
- **prod**: Production environment

To deploy to a specific environment:

```bash
.\scripts\deploy-with-domain.ps1 -Environment staging -CertificateArn 'YOUR-CERT-ARN' -HostedZoneId 'YOUR-ZONE-ID'
```

## Free Tier Considerations

The application is designed to stay within AWS Free Tier limits:

### Lambda
- 1M free requests per month
- 400,000 GB-seconds of compute time

### DynamoDB
- 25 GB of storage
- 25 provisioned read/write capacity units

### S3
- 5 GB of standard storage
- 20,000 GET requests
- 2,000 PUT requests

### CloudFront
- 50 GB data transfer out
- 2,000,000 HTTP/HTTPS requests

### API Gateway
- 1M API calls per month

## Monitoring and Costs

Monitor your usage through:

1. **AWS Cost Explorer**: Track spending
2. **CloudWatch**: Monitor application metrics
3. **AWS Budgets**: Set up cost alerts

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure your AWS user has necessary permissions
   - Check IAM roles and policies

2. **Resource Limits**
   - Verify Free Tier limits haven't been exceeded
   - Check service quotas in AWS console

3. **Deployment Failures**
   - Check CloudFormation events for detailed error messages
   - Verify all prerequisites are installed

### Getting Help

- Check AWS CloudWatch logs for Lambda function errors
- Review CloudFormation stack events
- Consult AWS documentation for service-specific issues

## Security Best Practices

1. **Use IAM Roles**: Never hardcode AWS credentials
2. **Enable MFA**: Multi-factor authentication for AWS console
3. **Regular Updates**: Keep dependencies updated
4. **Monitor Access**: Review CloudTrail logs regularly
5. **Encrypt Data**: Use S3 encryption and HTTPS

## Cleanup

To avoid charges, clean up resources when done:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name carbonlens-ai-dev

# Empty and delete S3 buckets
aws s3 rm s3://your-bucket-name --recursive
aws s3 rb s3://your-bucket-name
```

## Next Steps

After deployment:

1. **Test the Application**: Upload sample documents
2. **Configure Monitoring**: Set up CloudWatch alarms
3. **Customize Settings**: Adjust emission factors and calculations
4. **Scale as Needed**: Monitor usage and optimize resources

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review AWS documentation
3. Contact the development team
4. Submit issues on the project repository