# GitHub Actions Workflows

This directory contains automated workflows for the CarbonLens AI project.

## 🚀 Workflows Overview

### 1. **CI/CD Pipeline** (`deploy.yml`)
**Triggers**: Push to `main`/`develop`, Pull Requests, Manual dispatch

**Features**:
- ✅ **Code Quality**: ESLint, security scanning, license checks
- 🧪 **Testing**: Frontend and backend unit tests with coverage
- 🏗️ **Build**: React frontend build with artifact storage
- 🚀 **Multi-Environment Deployment**: Dev, Staging, Production
- 📊 **Infrastructure as Code**: CloudFormation deployment
- ⚡ **Serverless Backend**: Lambda functions via Serverless Framework
- 🌐 **Frontend Deployment**: S3 + CloudFront with cache invalidation
- 🔍 **Smoke Tests**: Post-deployment health verification

**Environments**:
- **Development**: Auto-deploy from `develop` branch
- **Staging**: Auto-deploy from `main` branch  
- **Production**: Manual deployment only

### 2. **Pull Request Checks** (`pr-checks.yml`)
**Triggers**: Pull Requests to `main`/`develop`

**Features**:
- 📝 **PR Validation**: Semantic PR titles and descriptions
- 🔍 **Code Quality**: ESLint, Prettier formatting checks
- 🧪 **Test Coverage**: Unit tests with coverage reporting
- 🏗️ **Build Verification**: Ensures successful builds
- 🔒 **Security Validation**: Dependency audits and secret scanning
- 📊 **Coverage Comments**: Automated coverage reports on PRs
- 🏗️ **Infrastructure Validation**: CloudFormation and Serverless config checks

### 3. **Security Scanning** (`security-scan.yml`)
**Triggers**: Weekly schedule, Manual dispatch, Dependency changes

**Features**:
- 🔒 **Dependency Vulnerability Scanning**: npm audit with SARIF upload
- 🔍 **SAST (Static Analysis)**: Semgrep security rules
- 🕵️ **Secret Detection**: TruffleHog for hardcoded secrets
- 📜 **License Compliance**: License checker for legal compliance
- 🏗️ **Infrastructure Security**: Checkov for CloudFormation
- 📊 **Security Reports**: Comprehensive security summaries

### 4. **Performance Monitoring** (`performance-monitoring.yml`)
**Triggers**: Every 6 hours, Manual dispatch

**Features**:
- 🔍 **Lighthouse Audits**: Performance, accessibility, SEO scores
- ⚡ **API Performance**: k6 load testing for backend endpoints
- 📦 **Bundle Analysis**: Webpack bundle size monitoring
- ☁️ **AWS Resource Monitoring**: Lambda, DynamoDB, S3 metrics
- 📊 **Performance Reports**: Detailed performance summaries

### 5. **Scheduled Health Checks** (`scheduled-health-checks.yml`)
**Triggers**: Every 6 hours, Manual dispatch

**Features**:
- 🌐 **Website Uptime**: HTTP status and response time monitoring
- 🔌 **API Health**: Endpoint availability and performance
- ☁️ **AWS Resource Health**: Lambda, DynamoDB, S3, CloudFront status
- 🔐 **Cognito Health**: User pool status and metrics
- 📊 **Lighthouse Performance**: Automated performance audits
- 🚨 **Failure Notifications**: Alerts when services are down

### 6. **Dependency Updates** (`dependency-update.yml`)
**Triggers**: Weekly (Mondays 9 AM UTC), Manual dispatch

**Features**:
- 📦 **Dependency Scanning**: Automated outdated package detection
- 🔒 **Security Auditing**: Vulnerability scanning with severity levels
- 🔄 **Automated Updates**: Creates PRs with dependency updates
- 📊 **Detailed Reports**: Security and dependency status reports
- ⚠️ **Critical Alerts**: Fails on critical vulnerabilities

## 🔧 Setup Requirements

### GitHub Secrets

Add these secrets to your GitHub repository (`Settings → Secrets and variables → Actions`):

```bash
# AWS Credentials (Required)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_ACCOUNT_ID=your-aws-account-id

# Domain Configuration (Optional - uses defaults if not set)
PROD_DOMAIN_NAME=https://carbonlens-ai.solutionsynth.cloud
DEV_DOMAIN_NAME=https://dev.carbonlens-ai.solutionsynth.cloud
STAGING_DOMAIN_NAME=https://staging.carbonlens-ai.solutionsynth.cloud

# SSL Certificates (Required for custom domains)
PROD_CERTIFICATE_ARN=arn:aws:acm:us-east-1:account:certificate/cert-id
DEV_CERTIFICATE_ARN=arn:aws:acm:us-east-1:account:certificate/cert-id
STAGING_CERTIFICATE_ARN=arn:aws:acm:us-east-1:account:certificate/cert-id

# CloudFront Distribution IDs (Required)
PROD_CLOUDFRONT_DISTRIBUTION_ID=your-prod-distribution-id
DEV_CLOUDFRONT_DISTRIBUTION_ID=your-dev-distribution-id
STAGING_CLOUDFRONT_DISTRIBUTION_ID=your-staging-distribution-id

# API Configuration (Optional - uses defaults)
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
CLOUDFRONT_BACKUP_URL=https://your-cloudfront-url.cloudfront.net

# Cognito Configuration (Optional)
COGNITO_USER_POOL_ID=us-east-1_yourPoolId

# Monitoring (Optional)
CODECOV_TOKEN=your-codecov-token
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

### Repository Settings

1. **Enable Actions**: `Settings → Actions → General → Allow all actions`
2. **Branch Protection**: Set up protection rules for `main` branch
3. **Environments**: Create `development`, `staging`, `production` environments
4. **Required Reviews**: Configure required reviewers for production deployments

## 📊 Workflow Status

### Main Branch Status
- [![CI/CD Pipeline](../../actions/workflows/deploy.yml/badge.svg)](../../actions/workflows/deploy.yml)
- [![Health Checks](../../actions/workflows/scheduled-health-checks.yml/badge.svg)](../../actions/workflows/scheduled-health-checks.yml)
- [![Security Scan](../../actions/workflows/security-scan.yml/badge.svg)](../../actions/workflows/security-scan.yml)

### Security & Dependencies
- [![Dependency Updates](../../actions/workflows/dependency-update.yml/badge.svg)](../../actions/workflows/dependency-update.yml)
- [![Performance Monitoring](../../actions/workflows/performance-monitoring.yml/badge.svg)](../../actions/workflows/performance-monitoring.yml)

## 🎯 Workflow Triggers

| Workflow | Push | PR | Schedule | Manual |
|----------|------|----|---------|---------| 
| CI/CD Pipeline | ✅ main/develop | ✅ to main/develop | ❌ | ✅ |
| PR Checks | ❌ | ✅ to main/develop | ❌ | ❌ |
| Security Scan | ✅ main | ❌ | ✅ Weekly | ✅ |
| Performance Monitoring | ❌ | ❌ | ✅ Every 6h | ✅ |
| Health Checks | ❌ | ❌ | ✅ Every 6h | ✅ |
| Dependency Updates | ❌ | ❌ | ✅ Weekly | ✅ |

## 🔄 Development Workflow

### For Contributors:
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Develop your feature with tests
3. **Create PR**: Open PR to `develop` for features, `main` for hotfixes
4. **Automated Checks**: PR checks run automatically
5. **Review & Merge**: After approval, merge triggers appropriate deployment

### For Maintainers:
1. **Monitor Health**: Check scheduled health check results
2. **Review Dependencies**: Weekly dependency update PRs
3. **Security Updates**: Address security audit findings promptly
4. **Performance**: Monitor performance metrics and optimize as needed
5. **Production Deployments**: Manual approval required for production

## 🚨 Troubleshooting

### Common Issues:

**Deployment Failures**:
- ✅ Check AWS credentials in secrets
- ✅ Verify CloudFormation template syntax
- ✅ Ensure AWS resources don't conflict
- ✅ Check Serverless Framework configuration

**Test Failures**:
- ✅ Review test logs for specific failures
- ✅ Ensure all dependencies are properly installed
- ✅ Check for environment-specific issues

**Security Alerts**:
- ✅ Review npm audit results
- ✅ Update vulnerable dependencies immediately
- ✅ Check for hardcoded secrets in code

**Health Check Failures**:
- ✅ Verify website accessibility
- ✅ Check AWS resource status in console
- ✅ Review CloudWatch logs for errors
- ✅ Validate DNS and SSL certificate status

**Performance Issues**:
- ✅ Review Lighthouse audit results
- ✅ Check bundle size for optimization opportunities
- ✅ Monitor AWS resource utilization
- ✅ Optimize slow API endpoints

## 📈 Monitoring & Alerts

### What's Monitored:
- ✅ Website uptime and performance (every 6 hours)
- ✅ API endpoint health and response times
- ✅ AWS resource status (Lambda, DynamoDB, S3, CloudFront)
- ✅ Security vulnerabilities (weekly scans)
- ✅ Dependency freshness (weekly updates)
- ✅ Performance metrics (Lighthouse scores)
- ✅ Bundle size and optimization opportunities

### Alert Channels:
- 📧 GitHub Actions notifications
- 📊 Workflow run summaries
- 📁 Artifact reports (security, performance, health)
- 🔔 Failed workflow notifications

## 🔒 Security Features

### Automated Security:
- **Secret Scanning**: Prevents hardcoded API keys and credentials
- **Dependency Auditing**: Weekly security vulnerability scans
- **SAST Analysis**: Static code analysis with Semgrep
- **Infrastructure Security**: CloudFormation security checks
- **License Compliance**: Automated license checking

### Best Practices:
- ✅ All secrets stored securely in GitHub Secrets
- ✅ No hardcoded credentials in source code
- ✅ Regular automated dependency updates
- ✅ Comprehensive security scanning pipeline
- ✅ Infrastructure as Code with security validation

## 🚀 Quick Start

1. **Fork/Clone** the repository
2. **Add Required Secrets** to your GitHub repository
3. **Configure Branch Protection** for main branch
4. **Push Changes** to trigger workflows
5. **Monitor** workflow runs in the Actions tab

The workflows will automatically handle:
- ✅ Code quality checks and testing
- ✅ Security scanning and vulnerability detection
- ✅ Multi-environment deployments
- ✅ Performance monitoring and optimization
- ✅ Health checks and uptime monitoring
- ✅ Dependency management and updates

Your CarbonLens AI application will be automatically tested, secured, and deployed! 🎉

---

## 📚 Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Serverless Framework Guide](https://www.serverless.com/framework/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Free Tier Limits](https://aws.amazon.com/free/)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides)