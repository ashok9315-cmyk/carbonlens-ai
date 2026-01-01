# Custom Domain CI/CD Setup Guide

## 🎯 Goal
Configure the CI/CD pipeline to automatically create SSL certificates and set up custom domains for each environment.

## 📋 Current Status
- ✅ **CloudFront Distribution**: Working at `https://dle4w1hfjdivv.cloudfront.net/`
- ✅ **Infrastructure**: Deployed successfully via CDK
- ❌ **Custom Domain**: `dev-carbonlens-ai.solutionsynth.cloud` not configured
- ❌ **SSL Certificate**: Missing for dev subdomain

## 🔧 Required GitHub Secrets

Add these secrets to your GitHub repository:

### Development Environment
```
DEV_DOMAIN_NAME=dev-carbonlens-ai.solutionsynth.cloud
HOSTED_ZONE_ID=Z02373041SS8TKQHXZLAR
```

### Staging Environment (Optional)
```
STAGING_DOMAIN_NAME=staging-carbonlens-ai.solutionsynth.cloud
```

### Production Environment (Optional)
```
PROD_DOMAIN_NAME=carbonlens-ai.solutionsynth.cloud
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689
```

## 🚀 How to Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/ashok9315-cmyk/carbonlens-ai`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one

## 🔄 What Happens After Adding Secrets

Once you add the `DEV_DOMAIN_NAME` secret, the next CI/CD run will:

1. **Create SSL Certificate**: CDK will automatically create and validate a certificate for `dev-carbonlens-ai.solutionsynth.cloud`
2. **Configure CloudFront**: Add the custom domain as an alias to the distribution
3. **Create DNS Records**: Route 53 A record pointing to CloudFront
4. **Update Application**: Custom domain will be accessible

## 🛠️ Alternative: Use Wildcard Certificate

Since you already have certificates, we could also use a wildcard certificate approach:

### Option A: Create Wildcard Certificate
Create a certificate for `*.solutionsynth.cloud` that covers all subdomains.

### Option B: Use Existing Certificate Pattern
Modify the CDK to use the existing `solutionsynth.cloud` certificate with CloudFront.

## 📝 Next Steps

1. **Add GitHub Secrets** (recommended approach)
2. **Push any change** to trigger CI/CD
3. **Wait for deployment** (5-10 minutes)
4. **Test custom domain**: `https://dev-carbonlens-ai.solutionsynth.cloud/`

## 🔍 Verification Commands

After deployment, verify the setup:

```bash
# Check certificate
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`dev-carbonlens-ai.solutionsynth.cloud`]'

# Check CloudFront aliases
aws cloudfront get-distribution --id EOZTM50EULZDL --query 'Distribution.DistributionConfig.Aliases'

# Check DNS records
nslookup dev-carbonlens-ai.solutionsynth.cloud
```

## ✅ Expected Result

After successful setup:
- ✅ `https://dev-carbonlens-ai.solutionsynth.cloud/` → Working
- ✅ `https://dle4w1hfjdivv.cloudfront.net/` → Still working (backup)
- ✅ SSL Certificate → Auto-created and validated
- ✅ DNS → Automatically configured