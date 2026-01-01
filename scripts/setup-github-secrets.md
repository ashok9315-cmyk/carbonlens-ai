# GitHub Secrets Setup Guide

## 🎯 Quick Setup for Custom Domain

To enable the custom domain `dev-carbonlens-ai.solutionsynth.cloud`, add these GitHub secrets:

### 📋 Required Secrets

Go to: `https://github.com/ashok9315-cmyk/carbonlens-ai/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DEV_DOMAIN_NAME` | `dev-carbonlens-ai.solutionsynth.cloud` | Development environment domain |
| `HOSTED_ZONE_ID` | `Z02373041SS8TKQHXZLAR` | Route 53 hosted zone ID |

### 🚀 How to Add Secrets

1. **Go to Repository Settings**
   - Navigate to: https://github.com/ashok9315-cmyk/carbonlens-ai
   - Click **Settings** tab

2. **Access Secrets**
   - In left sidebar, click **Secrets and variables**
   - Click **Actions**

3. **Add Each Secret**
   - Click **New repository secret**
   - Enter **Name**: `DEV_DOMAIN_NAME`
   - Enter **Secret**: `dev-carbonlens-ai.solutionsynth.cloud`
   - Click **Add secret**
   
   - Click **New repository secret** again
   - Enter **Name**: `HOSTED_ZONE_ID`
   - Enter **Secret**: `Z02373041SS8TKQHXZLAR`
   - Click **Add secret**

### ✅ After Adding Secrets

1. **Trigger Deployment**
   - Push any change to the `develop` branch
   - Or manually trigger the workflow

2. **What Will Happen**
   - CI/CD will detect the domain name
   - Automatically create SSL certificate
   - Configure CloudFront with custom domain
   - Set up Route 53 DNS records
   - Deploy to: `https://dev-carbonlens-ai.solutionsynth.cloud/`

3. **Timeline**
   - Certificate creation: ~5-10 minutes
   - DNS propagation: ~2-5 minutes
   - Total deployment: ~10-15 minutes

### 🔍 Verification

After deployment completes, test:

```bash
# Test custom domain
curl -I https://dev-carbonlens-ai.solutionsynth.cloud/

# Check certificate
openssl s_client -connect dev-carbonlens-ai.solutionsynth.cloud:443 -servername dev-carbonlens-ai.solutionsynth.cloud < /dev/null

# DNS lookup
nslookup dev-carbonlens-ai.solutionsynth.cloud
```

### 🎉 Expected Result

- ✅ `https://dev-carbonlens-ai.solutionsynth.cloud/` → Working with SSL
- ✅ `https://dle4w1hfjdivv.cloudfront.net/` → Still working (backup)
- ✅ Automatic certificate management
- ✅ DNS automatically configured

## 🔧 Optional: Additional Environments

### Staging Environment
```
STAGING_DOMAIN_NAME=staging-carbonlens-ai.solutionsynth.cloud
```

### Production Environment
```
PROD_DOMAIN_NAME=carbonlens-ai.solutionsynth.cloud
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:790756194179:certificate/cb1674fc-bed9-4913-848b-9a40be448689
```

## 🆘 Troubleshooting

If the custom domain doesn't work after 15 minutes:

1. **Check GitHub Actions logs**
2. **Verify secrets are added correctly**
3. **Check AWS Certificate Manager** for certificate status
4. **Check Route 53** for DNS records
5. **Wait for DNS propagation** (can take up to 48 hours globally)

## 📞 Support

If you need help, check the GitHub Actions logs at:
`https://github.com/ashok9315-cmyk/carbonlens-ai/actions`