# CarbonLens AI - Quick Start Guide

Get your CarbonLens AI application running with custom domain in 5 minutes!

## 🚀 Live Application
- **Custom Domain**: https://carbonlens-ai.solutionsynth.cloud
- **CloudFront Backup**: https://d1dqupktcu8kce.cloudfront.net
- **Backend API**: https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev

## Prerequisites (2 minutes)

1. **AWS Account** with Free Tier access
2. **AWS CLI** installed and configured
3. **Node.js** (version 16 or higher)
4. **Git** for version control

## Quick Deployment (3 minutes)

### Option 1: Use Existing Infrastructure
The application is already deployed and ready to use! Simply visit:
```
https://carbonlens-ai.solutionsynth.cloud
```

### Option 2: Deploy Your Own Instance

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd carbonlens-ai
   ```

2. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS credentials
   ```

3. **Deploy with Custom Domain**
   ```powershell
   # Windows PowerShell
   .\scripts\deploy-with-domain.ps1 -CertificateArn 'YOUR-CERTIFICATE-ARN' -HostedZoneId 'YOUR-HOSTED-ZONE-ID'
   ```

   ```bash
   # Linux/Mac
   chmod +x scripts/deploy-with-domain.sh
   ./scripts/deploy-with-domain.sh
   ```

## What Gets Deployed

### **Infrastructure**
- ✅ **S3 Buckets**: Frontend hosting and document storage
- ✅ **CloudFront**: Global CDN with custom domain
- ✅ **DynamoDB**: NoSQL database for application data
- ✅ **Cognito**: User authentication and management
- ✅ **Route 53**: DNS management for custom domain
- ✅ **SSL Certificate**: Automatic HTTPS with AWS Certificate Manager

### **Backend Services**
- ✅ **Lambda Functions**: Serverless document processing
- ✅ **API Gateway**: RESTful API endpoints
- ✅ **AI Services**: Textract, Rekognition, Comprehend, Bedrock

### **Frontend Application**
- ✅ **React Dashboard**: Modern responsive UI
- ✅ **Document Upload**: Drag-and-drop file processing
- ✅ **Carbon Analytics**: Real-time footprint tracking
- ✅ **Certificate Generation**: QR code verification

## First Steps After Deployment

1. **Create Account**
   - Visit your custom domain
   - Click "Sign Up" to create an account
   - Verify your email address

2. **Upload Test Document**
   - Go to "Document Upload" section
   - Drag and drop a logistics document (PDF, image)
   - Watch AI extract data automatically

3. **View Carbon Analytics**
   - Navigate to "Dashboard"
   - See carbon footprint calculations
   - Explore optimization recommendations

4. **Generate Certificate**
   - Go to "Certificates" section
   - Generate a carbon certificate
   - Scan QR code for verification

## Key Features to Try

### **Document Processing**
- Upload invoices, shipping documents, receipts
- AI automatically extracts logistics data
- Real-time carbon footprint calculation

### **Analytics Dashboard**
- View carbon emissions by category
- Track trends over time
- Export reports for compliance

### **Certificate Verification**
- Generate blockchain-verified certificates
- QR codes link to your custom domain
- Public verification system

### **Admin Panel**
- Manage users and permissions
- View system analytics
- Configure emission factors

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

## Troubleshooting

### **Common Issues**

1. **Authentication Errors**
   - Check Cognito User Pool configuration
   - Verify email confirmation

2. **Document Upload Fails**
   - Check S3 bucket permissions
   - Verify Lambda function logs in CloudWatch

3. **Custom Domain Not Working**
   - Verify SSL certificate is validated
   - Check Route 53 DNS records
   - Wait for DNS propagation (up to 48 hours)

### **Getting Help**

- Check CloudWatch logs for Lambda functions
- Review CloudFormation stack events
- Verify AWS service quotas and limits

## 💰 AWS Free Tier Usage

The application is designed to stay within AWS Free Tier:
- **Lambda**: 1M requests/month
- **DynamoDB**: 25GB storage
- **S3**: 5GB storage
- **API Gateway**: 1M calls/month
- **Cognito**: 50,000 MAUs
- **CloudFront**: 50GB data transfer
- **Route 53**: $0.50/month for hosted zone

## Next Steps

1. **Customize Branding**: Update logos and colors in the React app
2. **Add Integrations**: Connect to your existing logistics systems
3. **Scale Resources**: Adjust Lambda memory and DynamoDB capacity as needed
4. **Monitor Costs**: Set up AWS budgets and cost alerts

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Consult the complete [User Guide](docs/USER_GUIDE.md)
4. Contact the development team

---

**Congratulations!** Your CarbonLens AI application is now running with professional custom domain support! 🎉