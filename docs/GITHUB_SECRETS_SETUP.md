# GitHub Secrets Setup Guide

This guide walks you through setting up all required GitHub Secrets for the CarbonLens AI CI/CD pipeline.

## 🔐 Required Secrets

### AWS Credentials (Required)

These are essential for deploying to AWS:

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_ACCOUNT_ID=123456789012
```

**How to get these:**

1. **Create IAM User** (if you don't have one):
   ```bash
   aws iam create-user --user-name github-actions-carbonlens
   ```

2. **Attach Required Policies**:
   ```bash
   aws iam attach-user-policy --user-name github-actions-carbonlens --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
   aws iam attach-user-policy --user-name github-actions-carbonlens --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
   ```

3. **Create Access Keys**:
   ```bash
   aws iam create-access-key --user-name github-actions-carbonlens
   ```

4. **Get Account ID**:
   ```bash
   aws sts get-caller-identity --query Account --output text
   ```

### Domain Configuration (Optional)

If using custom domains, set these (otherwise defaults will be used):

```bash
PROD_DOMAIN_NAME=https://carbonlens-ai.solutionsynth.cloud
DEV_DOMAIN_NAME=https://dev.carbonlens-ai.solutionsynth.cloud
STAGING_DOMAIN_NAME=https://staging.carbonlens-ai.solutionsynth.cloud
```

### SSL Certificates (Required for Custom Domains)

```bash
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/87654321-4321-4321-4321-210987654321
STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/11111111-2222-3333-4444-555555555555
```

**How to get these:**

1. **Request Certificate**:
   ```bash
   aws acm request-certificate \
     --domain-name carbonlens-ai.solutionsynth.cloud \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Get Certificate ARN**:
   ```bash
   aws acm list-certificates --region us-east-1
   ```

### CloudFront Distribution IDs (Required)

```bash
PROD_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
DEV_CLOUDFRONT_DISTRIBUTION_ID=E0987654321DEF
STAGING_CLOUDFRONT_DISTRIBUTION_ID=E1111111111GHI
```

**How to get these:**

1. **List Distributions**:
   ```bash
   aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName]' --output table
   ```

2. **Or from CloudFormation Stack**:
   ```bash
   aws cloudformation describe-stacks --stack-name carbonlens-ai-production --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text
   ```

### API Configuration (Optional)

```bash
API_BASE_URL=https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev
CLOUDFRONT_BACKUP_URL=https://d1dqupktcu8kce.cloudfront.net
```

**How to get these:**

1. **API Gateway URL**:
   ```bash
   aws apigateway get-rest-apis --query 'items[?name==`dev-carbonlensaibackend`].[id,name]' --output table
   # URL format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
   ```

2. **CloudFront Domain**:
   ```bash
   aws cloudfront list-distributions --query 'DistributionList.Items[*].DomainName' --output text
   ```

### Cognito Configuration (Optional)

```bash
COGNITO_USER_POOL_ID=us-east-1_abcDEF123
```

**How to get this:**

```bash
aws cognito-idp list-user-pools --max-items 10 --query 'UserPools[?Name==`carbonlens-ai-users-dev`].[Id,Name]' --output table
```

### Monitoring Tokens (Optional)

```bash
CODECOV_TOKEN=your-codecov-token
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

**How to get these:**

1. **Codecov Token**:
   - Go to [codecov.io](https://codecov.io)
   - Sign in with GitHub
   - Add your repository
   - Copy the upload token

2. **Lighthouse CI Token**:
   - Install Lighthouse CI GitHub App
   - Generate token in app settings

## 🔧 Adding Secrets to GitHub

### Method 1: GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

### Method 2: GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Login to GitHub
gh auth login

# Add secrets (replace with your actual values)
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "..."
gh secret set AWS_ACCOUNT_ID --body "123456789012"

# Add domain configuration
gh secret set PROD_DOMAIN_NAME --body "https://carbonlens-ai.solutionsynth.cloud"
gh secret set DEV_DOMAIN_NAME --body "https://dev.carbonlens-ai.solutionsynth.cloud"
gh secret set STAGING_DOMAIN_NAME --body "https://staging.carbonlens-ai.solutionsynth.cloud"

# Add certificate ARNs
gh secret set PROD_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."
gh secret set DEV_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."
gh secret set STAGING_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."

# Add CloudFront distribution IDs
gh secret set PROD_CLOUDFRONT_DISTRIBUTION_ID --body "E1234567890ABC"
gh secret set DEV_CLOUDFRONT_DISTRIBUTION_ID --body "E0987654321DEF"
gh secret set STAGING_CLOUDFRONT_DISTRIBUTION_ID --body "E1111111111GHI"

# Add API configuration
gh secret set API_BASE_URL --body "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev"
gh secret set CLOUDFRONT_BACKUP_URL --body "https://d1dqupktcu8kce.cloudfront.net"

# Add Cognito configuration
gh secret set COGNITO_USER_POOL_ID --body "us-east-1_abcDEF123"

# Add monitoring tokens (optional)
gh secret set CODECOV_TOKEN --body "your-codecov-token"
gh secret set LHCI_GITHUB_APP_TOKEN --body "your-lighthouse-ci-token"
```

### Method 3: Bulk Script

Create a file called `setup-secrets.sh`:

```bash
#!/bin/bash

# AWS Credentials (REQUIRED - Replace with your values)
gh secret set AWS_ACCESS_KEY_ID --body "AKIA..."
gh secret set AWS_SECRET_ACCESS_KEY --body "..."
gh secret set AWS_ACCOUNT_ID --body "123456789012"

# Domain Configuration (Replace with your domains or remove for defaults)
gh secret set PROD_DOMAIN_NAME --body "https://carbonlens-ai.solutionsynth.cloud"
gh secret set DEV_DOMAIN_NAME --body "https://dev.carbonlens-ai.solutionsynth.cloud"
gh secret set STAGING_DOMAIN_NAME --body "https://staging.carbonlens-ai.solutionsynth.cloud"

# SSL Certificates (Replace with your certificate ARNs)
gh secret set PROD_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."
gh secret set DEV_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."
gh secret set STAGING_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/..."

# CloudFront Distribution IDs (Replace with your distribution IDs)
gh secret set PROD_CLOUDFRONT_DISTRIBUTION_ID --body "E1234567890ABC"
gh secret set DEV_CLOUDFRONT_DISTRIBUTION_ID --body "E0987654321DEF"
gh secret set STAGING_CLOUDFRONT_DISTRIBUTION_ID --body "E1111111111GHI"

# API Configuration (Replace with your API URLs)
gh secret set API_BASE_URL --body "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev"
gh secret set CLOUDFRONT_BACKUP_URL --body "https://d1dqupktcu8kce.cloudfront.net"

# Cognito Configuration (Replace with your User Pool ID)
gh secret set COGNITO_USER_POOL_ID --body "us-east-1_abcDEF123"

echo "✅ All secrets have been set!"
```

Run it:
```bash
chmod +x setup-secrets.sh
./setup-secrets.sh
```

## 🔍 Verifying Secrets

### List All Secrets
```bash
gh secret list
```

### Test AWS Credentials
Create a simple workflow to test your AWS credentials:

```yaml
name: Test AWS Credentials
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Test AWS access
      run: |
        aws sts get-caller-identity
        aws s3 ls
```

## 🚨 Security Best Practices

### 1. Principle of Least Privilege
- Only grant necessary permissions to the IAM user
- Regularly review and rotate access keys
- Use temporary credentials when possible

### 2. Secret Management
- Never commit secrets to your repository
- Use GitHub Secrets for all sensitive data
- Regularly rotate API keys and tokens

### 3. Monitoring
- Enable CloudTrail for AWS API monitoring
- Set up alerts for unusual API activity
- Monitor GitHub Actions usage

### 4. Access Control
- Limit who can modify GitHub Secrets
- Use branch protection rules
- Require reviews for production deployments

## 🔄 Updating Secrets

### When to Update:
- AWS access keys are rotated
- SSL certificates are renewed
- Domain names change
- CloudFront distributions are recreated

### How to Update:
```bash
# Update a single secret
gh secret set SECRET_NAME --body "new-value"

# Or use the GitHub web interface
# Settings → Secrets and variables → Actions → Update
```

## 🆘 Troubleshooting

### Common Issues:

**AWS Access Denied**:
- Verify IAM user has correct permissions
- Check access key is active and not expired
- Ensure correct AWS region

**Certificate Not Found**:
- Verify certificate exists in us-east-1 region
- Check certificate is validated
- Ensure ARN format is correct

**CloudFront Distribution Not Found**:
- Verify distribution exists and is deployed
- Check distribution ID format
- Ensure correct AWS account

**Domain Not Accessible**:
- Verify DNS records are correct
- Check SSL certificate is valid
- Ensure CloudFront distribution is deployed

### Getting Help:

1. **Check Workflow Logs**: Review failed workflow runs for specific errors
2. **AWS Console**: Verify resources exist and are configured correctly
3. **GitHub Actions**: Check secret names match exactly (case-sensitive)
4. **AWS CLI**: Test commands locally with same credentials

## ✅ Verification Checklist

Before running workflows, ensure:

- [ ] AWS credentials are set and working
- [ ] AWS account ID is correct
- [ ] SSL certificates exist and are validated
- [ ] CloudFront distributions are deployed
- [ ] Domain names are accessible
- [ ] All secret names match workflow requirements
- [ ] IAM user has necessary permissions

---

## 🚀 Next Steps

After setting up secrets:

1. **Test Workflows**: Run a manual workflow to verify everything works
2. **Monitor Deployments**: Check that deployments complete successfully
3. **Set Up Monitoring**: Configure alerts for failed workflows
4. **Document Changes**: Keep track of any custom configurations

Your CI/CD pipeline is now ready to automatically deploy CarbonLens AI! 🎉