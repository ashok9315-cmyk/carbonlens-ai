# CarbonLens AI - Authentication Guide

## 🔐 Overview

CarbonLens AI uses Amazon Cognito for secure user authentication and authorization. This guide covers all authentication methods, from frontend integration to direct API access for testing and development.

---

## 📋 Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Frontend Authentication](#frontend-authentication)
3. [Direct API Authentication](#direct-api-authentication)
4. [Cognito Configuration](#cognito-configuration)
5. [JWT Token Management](#jwt-token-management)
6. [API Testing](#api-testing)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## 🏗️ Authentication Architecture

### **Components**

```mermaid
graph TD
    A[React Frontend] --> B[AWS Amplify Auth]
    B --> C[Amazon Cognito User Pool]
    C --> D[JWT Tokens]
    D --> E[API Gateway]
    E --> F[Lambda Functions]
    
    G[Direct API Access] --> H[AWS CLI/SDK]
    H --> C
```

### **Authentication Flow**

1. **User Registration/Login** → Cognito User Pool
2. **Token Generation** → JWT ID Token, Access Token, Refresh Token
3. **API Requests** → Include JWT token in Authorization header
4. **Token Validation** → API Gateway validates JWT signature
5. **Access Granted** → Lambda functions process requests

---

## 🌐 Frontend Authentication

### **Automatic Authentication (Recommended)**

The React frontend handles authentication automatically using AWS Amplify:

#### **Configuration**
```javascript
// src/aws-config.js
export const awsConfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_pesPWWfoF',
    userPoolWebClientId: '6lm8qg1seqc7o05tkp03ecv4v9',
  },
  API: {
    endpoints: [
      {
        name: 'carbonlens-api',
        endpoint: 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1'
      }
    ]
  }
};
```

#### **User Experience**
1. **Visit Application**: https://carbonlens-ai.solutionsynth.cloud
2. **Sign Up**: Create account with email and password
3. **Email Verification**: Confirm email address
4. **Automatic Login**: Amplify handles JWT tokens
5. **Seamless API Calls**: All requests include authentication

#### **Implementation Details**
```javascript
// App.js - Amplify integration
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { awsConfig } from './aws-config';

Amplify.configure(awsConfig);

// Automatic authentication wrapper
export default withAuthenticator(App, {
  socialProviders: [],
  signUpAttributes: ['email'],
  loginMechanisms: ['email']
});
```

---

## 🔧 Direct API Authentication

### **For Testing and Development**

When you need to test APIs directly or integrate with other systems:

#### **Step 1: Create Test User**
```powershell
# Create user via AWS CLI
aws cognito-idp admin-create-user `
  --user-pool-id us-east-1_pesPWWfoF `
  --username testuser `
  --temporary-password TempPass123! `
  --message-action SUPPRESS `
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_pesPWWfoF `
  --username testuser `
  --password MyPassword123! `
  --permanent `
  --region us-east-1
```

#### **Step 2: Get JWT Token**
```powershell
# Authenticate and get tokens
$authResult = aws cognito-idp admin-initiate-auth `
  --user-pool-id us-east-1_pesPWWfoF `
  --client-id 6lm8qg1seqc7o05tkp03ecv4v9 `
  --auth-flow ADMIN_NO_SRP_AUTH `
  --auth-parameters USERNAME=testuser,PASSWORD=MyPassword123! `
  --region us-east-1 | ConvertFrom-Json

$idToken = $authResult.AuthenticationResult.IdToken
$accessToken = $authResult.AuthenticationResult.AccessToken
$refreshToken = $authResult.AuthenticationResult.RefreshToken
```

#### **Step 3: Make Authenticated API Calls**
```powershell
# Set up headers with JWT token
$headers = @{
  "Authorization" = "Bearer $idToken"
  "Content-Type" = "application/json"
}

# Test GET endpoint
$response = Invoke-WebRequest `
  -Uri "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/optimizations" `
  -Method GET `
  -Headers $headers `
  -UseBasicParsing

# Test POST endpoint
$testData = @{
  documentUrl = "https://example.com/test.pdf"
  documentType = "invoice"
  fileData = @{
    name = "test-invoice.pdf"
    size = 1024
  }
} | ConvertTo-Json

$response = Invoke-WebRequest `
  -Uri "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/process-document" `
  -Method POST `
  -Headers $headers `
  -Body $testData `
  -UseBasicParsing
```

---

## ⚙️ Cognito Configuration

### **User Pool Settings**

```yaml
# CloudFormation Configuration
UserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: carbonlens-ai-users-dev
    AutoVerifiedAttributes:
      - email
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: false
    Schema:
      - Name: email
        AttributeDataType: String
        Required: true
        Mutable: true
```

### **User Pool Client Settings**

```yaml
UserPoolClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    ClientName: carbonlens-ai-client-dev
    UserPoolId: !Ref UserPool
    GenerateSecret: false
    ExplicitAuthFlows:
      - ALLOW_USER_SRP_AUTH          # Frontend authentication
      - ALLOW_REFRESH_TOKEN_AUTH     # Token refresh
      - ALLOW_ADMIN_USER_PASSWORD_AUTH # Direct API access
```

### **Authentication Flows Explained**

| Flow | Purpose | Usage |
|------|---------|-------|
| `ALLOW_USER_SRP_AUTH` | Secure Remote Password | Frontend login (secure) |
| `ALLOW_REFRESH_TOKEN_AUTH` | Token refresh | Automatic session renewal |
| `ALLOW_ADMIN_USER_PASSWORD_AUTH` | Admin authentication | Direct API testing |

---

## 🎫 JWT Token Management

### **Token Types**

#### **ID Token**
- **Purpose**: User identity and authentication
- **Usage**: API Gateway authorization
- **Contains**: User attributes, groups, custom claims
- **Lifetime**: 1 hour (configurable)

#### **Access Token**
- **Purpose**: API access authorization
- **Usage**: Resource server authorization
- **Contains**: Scopes and permissions
- **Lifetime**: 1 hour (configurable)

#### **Refresh Token**
- **Purpose**: Obtain new ID and Access tokens
- **Usage**: Automatic token renewal
- **Lifetime**: 30 days (configurable)

### **Token Structure**

```javascript
// JWT ID Token payload example
{
  "sub": "24d85468-30a1-70a1-b86b-087fde132c7c",
  "aud": "6lm8qg1seqc7o05tkp03ecv4v9",
  "cognito:groups": [],
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_pesPWWfoF",
  "cognito:username": "testuser",
  "aud": "6lm8qg1seqc7o05tkp03ecv4v9",
  "event_id": "...",
  "token_use": "id",
  "auth_time": 1735516171,
  "exp": 1735519771,
  "iat": 1735516171,
  "email": "user@example.com"
}
```

### **Token Refresh**

```powershell
# Refresh tokens when they expire
$refreshResult = aws cognito-idp admin-initiate-auth `
  --user-pool-id us-east-1_pesPWWfoF `
  --client-id 6lm8qg1seqc7o05tkp03ecv4v9 `
  --auth-flow REFRESH_TOKEN_AUTH `
  --auth-parameters REFRESH_TOKEN=$refreshToken `
  --region us-east-1 | ConvertFrom-Json

$newIdToken = $refreshResult.AuthenticationResult.IdToken
$newAccessToken = $refreshResult.AuthenticationResult.AccessToken
```

---

## 🧪 API Testing

### **Available Endpoints**

| Method | Endpoint | Purpose | Authentication |
|--------|----------|---------|----------------|
| GET | `/optimizations` | Get AI recommendations | Required |
| POST | `/process-document` | Process logistics documents | Required |
| POST | `/calculate-carbon` | Calculate carbon footprint | Required |
| POST | `/certificate` | Generate carbon certificates | Required |

### **Testing Script**

```powershell
# Complete API testing script
function Test-CarbonLensAPI {
    param(
        [string]$Username = "testuser",
        [string]$Password = "MyPassword123!"
    )
    
    # Get JWT token
    Write-Host "🔐 Authenticating..." -ForegroundColor Blue
    $authResult = aws cognito-idp admin-initiate-auth `
        --user-pool-id us-east-1_pesPWWfoF `
        --client-id 6lm8qg1seqc7o05tkp03ecv4v9 `
        --auth-flow ADMIN_NO_SRP_AUTH `
        --auth-parameters USERNAME=$Username,PASSWORD=$Password `
        --region us-east-1 | ConvertFrom-Json
    
    $token = $authResult.AuthenticationResult.IdToken
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Test optimizations endpoint
    Write-Host "🎯 Testing optimizations endpoint..." -ForegroundColor Blue
    try {
        $response = Invoke-WebRequest `
            -Uri "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/optimizations" `
            -Method GET `
            -Headers $headers `
            -UseBasicParsing
        Write-Host "✅ Optimizations: Success" -ForegroundColor Green
    } catch {
        Write-Host "❌ Optimizations: Failed - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test document processing endpoint
    Write-Host "📄 Testing document processing endpoint..." -ForegroundColor Blue
    $testData = @{
        documentUrl = "https://example.com/test.pdf"
        documentType = "invoice"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest `
            -Uri "https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/process-document" `
            -Method POST `
            -Headers $headers `
            -Body $testData `
            -UseBasicParsing
        Write-Host "✅ Document Processing: Success" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Document Processing: Expected error (test data) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Run tests
Test-CarbonLensAPI
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **"Missing Authentication Token"**
- **Cause**: No Authorization header or invalid token
- **Solution**: Ensure JWT token is included in Authorization header
- **Example**: `Authorization: Bearer eyJraWQiOiIxMDZHZlZIRURtRjAxdlJYYThvWFdxTFhVQXl0V0...`

#### **"Auth flow not enabled for this client"**
- **Cause**: Required auth flow not enabled in Cognito client
- **Solution**: Add `ALLOW_ADMIN_USER_PASSWORD_AUTH` to ExplicitAuthFlows
- **Fix**: Update CloudFormation template and redeploy

#### **"Token has expired"**
- **Cause**: JWT token lifetime exceeded (default 1 hour)
- **Solution**: Use refresh token to get new tokens
- **Prevention**: Implement automatic token refresh

#### **"User does not exist"**
- **Cause**: Username not found in User Pool
- **Solution**: Create user with `admin-create-user` command
- **Verification**: Check user exists with `admin-get-user`

### **Debugging Commands**

```powershell
# Check user exists
aws cognito-idp admin-get-user `
  --user-pool-id us-east-1_pesPWWfoF `
  --username testuser `
  --region us-east-1

# List all users
aws cognito-idp list-users `
  --user-pool-id us-east-1_pesPWWfoF `
  --region us-east-1

# Decode JWT token (requires jwt-cli or online decoder)
echo $token | jwt decode

# Check Cognito client configuration
aws cognito-idp describe-user-pool-client `
  --user-pool-id us-east-1_pesPWWfoF `
  --client-id 6lm8qg1seqc7o05tkp03ecv4v9 `
  --region us-east-1
```

---

## 🛡️ Security Best Practices

### **Token Security**

1. **Never Log Tokens**: Avoid logging JWT tokens in application logs
2. **Secure Storage**: Store tokens securely (encrypted storage, secure cookies)
3. **Token Rotation**: Implement automatic token refresh
4. **Minimal Lifetime**: Use short token lifetimes (1 hour recommended)

### **API Security**

1. **HTTPS Only**: All API calls must use HTTPS
2. **Token Validation**: API Gateway validates JWT signatures automatically
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **CORS Configuration**: Properly configure CORS for frontend domains

### **User Management**

1. **Strong Passwords**: Enforce password complexity requirements
2. **Email Verification**: Require email verification for new accounts
3. **Account Lockout**: Implement account lockout after failed attempts
4. **Multi-Factor Authentication**: Consider enabling MFA for production

### **Development vs Production**

#### **Development**
- Admin auth flows enabled for testing
- Relaxed CORS settings
- Detailed error messages

#### **Production**
- Disable admin auth flows
- Strict CORS settings
- Generic error messages
- Enable CloudTrail logging

---

## 📚 Integration Examples

### **JavaScript/Node.js**

```javascript
const AWS = require('aws-sdk');
const axios = require('axios');

// Configure Cognito
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1'
});

// Authenticate user
async function authenticate(username, password) {
  const params = {
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    UserPoolId: 'us-east-1_YsfqO2eRu',
    ClientId: '41rnuf729f7ejfuv8dl727voel',
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  };
  
  const result = await cognito.adminInitiateAuth(params).promise();
  return result.AuthenticationResult.IdToken;
}

// Make authenticated API call
async function callAPI(endpoint, token, data = null) {
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    return await axios.post(endpoint, data, config);
  } else {
    return await axios.get(endpoint, config);
  }
}

// Usage example
async function example() {
  try {
    const token = await authenticate('testuser', 'MyPassword123!');
    const response = await callAPI(
      'https://pt9uwvq8ld.execute-api.us-east-1.amazonaws.com/dev/optimizations',
      token
    );
    console.log('API Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### **Python**

```python
import boto3
import requests
import json

# Configure Cognito client
cognito = boto3.client('cognito-idp', region_name='us-east-1')

def authenticate(username, password):
    """Authenticate user and return JWT token"""
    response = cognito.admin_initiate_auth(
        UserPoolId='us-east-1_pesPWWfoF',
        ClientId='6lm8qg1seqc7o05tkp03ecv4v9',
        AuthFlow='ADMIN_NO_SRP_AUTH',
        AuthParameters={
            'USERNAME': username,
            'PASSWORD': password
        }
    )
    return response['AuthenticationResult']['IdToken']

def call_api(endpoint, token, data=None):
    """Make authenticated API call"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    if data:
        response = requests.post(endpoint, headers=headers, json=data)
    else:
        response = requests.get(endpoint, headers=headers)
    
    return response.json()

# Usage example
if __name__ == "__main__":
    try:
        token = authenticate('testuser', 'MyPassword123!')
        result = call_api(
            'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev/optimizations',
            token
        )
        print('API Response:', json.dumps(result, indent=2))
    except Exception as e:
        print(f'Error: {e}')
```

---

## 📞 Support

### **Authentication Issues**
- Check Cognito User Pool configuration
- Verify JWT token format and expiration
- Ensure proper Authorization header format

### **API Access Issues**
- Confirm API Gateway endpoint URLs
- Verify CORS configuration
- Check Lambda function permissions

### **Development Support**
- Use CloudWatch logs for debugging
- Enable detailed error messages in development
- Test with Postman or similar tools

---

*This authentication guide provides comprehensive coverage of all authentication methods available in CarbonLens AI. For additional support, refer to the AWS Cognito documentation or contact the development team.*

---

**Last Updated**: December 30, 2024  
**Version**: 1.0.0  
**Application**: CarbonLens AI