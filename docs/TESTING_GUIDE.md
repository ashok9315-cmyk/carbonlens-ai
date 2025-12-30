# CarbonLens AI - Testing Guide

## 🧪 Overview

This guide covers comprehensive testing strategies for CarbonLens AI, including unit tests, integration tests, and end-to-end functional tests across both frontend and backend components.

---

## 📋 Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Testing Setup](#testing-setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [Functional Tests](#functional-tests)
6. [End-to-End Tests](#end-to-end-tests)
7. [Performance Tests](#performance-tests)
8. [Test Automation](#test-automation)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

---

## 🎯 Testing Strategy

### **Testing Pyramid**

```
    /\
   /E2E\     ← Few, High-level, Slow
  /______\
 /        \
/Integration\ ← Some, Medium-level, Medium speed
\____________/
\            /
 \Unit Tests/ ← Many, Low-level, Fast
  \________/
```

### **Test Coverage Goals**

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| **Frontend React Components** | 90%+ | 80%+ | Key workflows |
| **Backend Lambda Functions** | 95%+ | 85%+ | API endpoints |
| **Utility Functions** | 100% | N/A | N/A |
| **API Integration** | N/A | 90%+ | Critical paths |

### **Testing Levels**

#### **1. Unit Tests**
- Individual functions and components
- Mocked dependencies
- Fast execution (< 1 second each)
- High coverage (90%+)

#### **2. Integration Tests**
- Component interactions
- Database operations
- API calls with real services
- Medium execution time (1-10 seconds)

#### **3. Functional Tests**
- Complete user workflows
- Real AWS services
- End-to-end scenarios
- Slower execution (10+ seconds)

#### **4. Performance Tests**
- Load testing
- Stress testing
- Response time validation
- Scalability verification

---

## ⚙️ Testing Setup

### **Frontend Testing Stack**

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^27.5.1",
    "jest-environment-jsdom": "^27.5.1",
    "msw": "^1.3.2"
  }
}
```

### **Backend Testing Stack**

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "aws-sdk-mock": "^5.8.0",
    "supertest": "^6.3.3",
    "nock": "^13.3.8",
    "@types/jest": "^29.5.8"
  }
}
```

### **E2E Testing Stack**

```json
{
  "devDependencies": {
    "playwright": "^1.40.0",
    "cypress": "^13.6.0"
  }
}
```

---

## 🔬 Unit Tests

### **Frontend Unit Tests**

#### **Component Testing Setup**

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  API: {
    post: jest.fn(),
    get: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));
```

#### **Dashboard Component Test**

```javascript
// src/components/__tests__/Dashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { API } from 'aws-amplify';
import Dashboard from '../Dashboard';

// Mock API responses
jest.mock('aws-amplify');
const mockAPI = API as jest.Mocked<typeof API>;

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('displays metrics after data loads', async () => {
    const mockMetrics = {
      totalEmissions: 1250.5,
      documentsProcessed: 15,
      optimizations: 8,
      certificates: 3
    };

    mockAPI.get.mockResolvedValueOnce({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250.5 kg CO₂e')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockAPI.get.mockRejectedValueOnce(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button clicked', async () => {
    const mockMetrics = { totalEmissions: 1000 };
    mockAPI.get.mockResolvedValue({ data: mockMetrics });

    render(<Dashboard />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockAPI.get).toHaveBeenCalledTimes(2);
    });
  });
});
```

#### **DocumentUpload Component Test**

```javascript
// src/components/__tests__/DocumentUpload.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { API } from 'aws-amplify';
import DocumentUpload from '../DocumentUpload';

jest.mock('aws-amplify');
const mockAPI = API as jest.Mocked<typeof API>;

describe('DocumentUpload Component', () => {
  test('accepts file drop', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    await user.upload(dropZone, file);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  test('validates file type', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const dropZone = screen.getByTestId('drop-zone');

    await user.upload(dropZone, invalidFile);

    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });

  test('processes document successfully', async () => {
    mockAPI.post.mockResolvedValueOnce({
      data: {
        extractedData: {
          origin: 'New York',
          destination: 'Los Angeles',
          weight: 1000,
          transportMode: 'truck'
        }
      }
    });

    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    await user.upload(dropZone, file);
    
    const processButton = screen.getByRole('button', { name: /process/i });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
    });
  });
});
```

### **Backend Unit Tests**

#### **Carbon Calculator Tests**

```javascript
// backend/src/handlers/__tests__/carbonCalculator.test.js
const { handler } = require('../carbonCalculator');
const AWS = require('aws-sdk-mock');

describe('Carbon Calculator Handler', () => {
  beforeEach(() => {
    AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
      callback(null, { Item: params.Item });
    });
  });

  afterEach(() => {
    AWS.restore('DynamoDB.DocumentClient');
  });

  test('calculates truck transport emissions correctly', async () => {
    const event = {
      body: JSON.stringify({
        transportMode: 'truck',
        weight: 1000, // kg
        distance: 500, // km
        origin: 'New York',
        destination: 'Philadelphia'
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.carbonFootprint.totalEmissions).toBe(31); // 1000kg * 500km * 0.062 / 1000
    expect(response.carbonFootprint.emissionFactor).toBe(0.062);
    expect(response.carbonFootprint.transportMode).toBe('truck');
  });

  test('calculates air freight emissions correctly', async () => {
    const event = {
      body: JSON.stringify({
        transportMode: 'air',
        weight: 100,
        distance: 3000
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(response.carbonFootprint.totalEmissions).toBe(180.6); // 100 * 3000 * 0.602 / 1000
  });

  test('handles missing parameters', async () => {
    const event = {
      body: JSON.stringify({
        transportMode: 'truck'
        // Missing weight and distance
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Missing required parameters');
  });

  test('handles invalid transport mode', async () => {
    const event = {
      body: JSON.stringify({
        transportMode: 'teleporter',
        weight: 1000,
        distance: 500
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Invalid transport mode');
  });

  test('saves calculation to DynamoDB', async () => {
    const mockPut = jest.fn((params, callback) => {
      callback(null, { Item: params.Item });
    });
    
    AWS.remock('DynamoDB.DocumentClient', 'put', mockPut);

    const event = {
      body: JSON.stringify({
        transportMode: 'truck',
        weight: 1000,
        distance: 500
      })
    };

    await handler(event);

    expect(mockPut).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: process.env.TABLE_NAME,
        Item: expect.objectContaining({
          type: 'carbon-calculation',
          transportMode: 'truck',
          totalEmissions: 31
        })
      }),
      expect.any(Function)
    );
  });
});
```

#### **Document Processor Tests**

```javascript
// backend/src/handlers/__tests__/documentProcessor.test.js
const { handler } = require('../documentProcessor');
const AWS = require('aws-sdk-mock');

describe('Document Processor Handler', () => {
  beforeEach(() => {
    // Mock Textract
    AWS.mock('Textract', 'detectDocumentText', {
      Blocks: [
        {
          BlockType: 'LINE',
          Text: 'INVOICE',
          Confidence: 99.5
        },
        {
          BlockType: 'LINE',
          Text: 'From: New York, NY',
          Confidence: 98.2
        },
        {
          BlockType: 'LINE',
          Text: 'To: Los Angeles, CA',
          Confidence: 97.8
        },
        {
          BlockType: 'LINE',
          Text: 'Weight: 1,500 lbs',
          Confidence: 96.5
        }
      ]
    });

    // Mock Comprehend
    AWS.mock('Comprehend', 'detectEntities', {
      Entities: [
        {
          Text: 'New York',
          Type: 'LOCATION',
          Score: 0.99
        },
        {
          Text: 'Los Angeles',
          Type: 'LOCATION',
          Score: 0.98
        }
      ]
    });
  });

  afterEach(() => {
    AWS.restore();
  });

  test('processes document and extracts shipping data', async () => {
    const event = {
      body: JSON.stringify({
        documentUrl: 'https://example.com/invoice.pdf',
        documentType: 'invoice'
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.extractedData.origin).toBe('New York');
    expect(response.extractedData.destination).toBe('Los Angeles');
    expect(response.extractedData.weight).toBe(680.4); // 1500 lbs converted to kg
    expect(response.confidence.overall).toBeGreaterThan(0.9);
  });

  test('handles document processing errors', async () => {
    AWS.remock('Textract', 'detectDocumentText', (params, callback) => {
      callback(new Error('Textract service error'));
    });

    const event = {
      body: JSON.stringify({
        documentUrl: 'https://example.com/invalid.pdf',
        documentType: 'invoice'
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toContain('Document processing failed');
  });

  test('validates document URL format', async () => {
    const event = {
      body: JSON.stringify({
        documentUrl: 'invalid-url',
        documentType: 'invoice'
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain('Invalid document URL');
  });
});
```

---

## 🔗 Integration Tests

### **API Integration Tests**

```javascript
// backend/__tests__/integration/api.integration.test.js
const AWS = require('aws-sdk');
const axios = require('axios');

describe('API Integration Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev';
  let authToken;

  beforeAll(async () => {
    // Get authentication token
    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
    
    const authResult = await cognito.adminInitiateAuth({
      UserPoolId: 'us-east-1_pesPWWfoF',
      ClientId: '6lm8qg1seqc7o05tkp03ecv4v9',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: 'testuser',
        PASSWORD: 'MyPassword123!'
      }
    }).promise();

    authToken = authResult.AuthenticationResult.IdToken;
  });

  const apiCall = async (method, endpoint, data = null) => {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    return axios(config);
  };

  test('GET /optimizations returns recommendations', async () => {
    const response = await apiCall('GET', '/optimizations');

    expect(response.status).toBe(200);
    expect(response.data.optimizations).toBeDefined();
    expect(response.data.optimizations.routeOptimization).toBeInstanceOf(Array);
    expect(response.data.optimizations.summary.totalPotentialReduction).toMatch(/\d+-\d+%/);
  });

  test('POST /calculate-carbon calculates emissions', async () => {
    const carbonData = {
      transportMode: 'truck',
      weight: 1000,
      distance: 500,
      origin: 'New York',
      destination: 'Philadelphia'
    };

    const response = await apiCall('POST', '/calculate-carbon', carbonData);

    expect(response.status).toBe(200);
    expect(response.data.carbonFootprint.totalEmissions).toBe(31);
    expect(response.data.carbonFootprint.transportMode).toBe('truck');
    expect(response.data.calculationId).toBeDefined();
  });

  test('POST /certificate generates certificate', async () => {
    const certificateData = {
      carbonFootprint: {
        totalEmissions: 31,
        transportMode: 'truck',
        weight: 1000,
        distance: 500
      },
      productInfo: {
        name: 'Test Product',
        sku: 'TEST-001'
      },
      companyInfo: {
        name: 'Test Company',
        address: '123 Test St'
      }
    };

    const response = await apiCall('POST', '/certificate', certificateData);

    expect(response.status).toBe(200);
    expect(response.data.certificate.id).toBeDefined();
    expect(response.data.certificate.verification.hash).toBeDefined();
    expect(response.data.qrCode).toBeDefined();
  });

  test('API handles authentication errors', async () => {
    try {
      await axios.get(`${API_BASE_URL}/optimizations`);
      fail('Should have thrown authentication error');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('API handles invalid data gracefully', async () => {
    try {
      await apiCall('POST', '/calculate-carbon', { invalid: 'data' });
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Missing required parameters');
    }
  });
});
```

### **Database Integration Tests**

```javascript
// backend/__tests__/integration/database.integration.test.js
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

describe('DynamoDB Integration Tests', () => {
  const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
  const tableName = process.env.TABLE_NAME || 'carbonlens-ai-data-dev';

  test('saves and retrieves carbon calculation', async () => {
    const calculationId = uuidv4();
    const testData = {
      id: calculationId,
      type: 'carbon-calculation',
      transportMode: 'truck',
      weight: 1000,
      distance: 500,
      totalEmissions: 31,
      createdAt: new Date().toISOString()
    };

    // Save data
    await dynamodb.put({
      TableName: tableName,
      Item: testData
    }).promise();

    // Retrieve data
    const result = await dynamodb.get({
      TableName: tableName,
      Key: {
        id: calculationId,
        type: 'carbon-calculation'
      }
    }).promise();

    expect(result.Item).toEqual(testData);
  });

  test('queries calculations by type', async () => {
    const result = await dynamodb.query({
      TableName: tableName,
      IndexName: 'type-createdAt-index',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':type': 'carbon-calculation'
      },
      Limit: 10
    }).promise();

    expect(result.Items).toBeInstanceOf(Array);
    expect(result.Items.length).toBeGreaterThan(0);
    expect(result.Items[0].type).toBe('carbon-calculation');
  });

  afterEach(async () => {
    // Cleanup test data
    const testItems = await dynamodb.scan({
      TableName: tableName,
      FilterExpression: 'contains(id, :testPrefix)',
      ExpressionAttributeValues: {
        ':testPrefix': 'test-'
      }
    }).promise();

    for (const item of testItems.Items) {
      await dynamodb.delete({
        TableName: tableName,
        Key: {
          id: item.id,
          type: item.type
        }
      }).promise();
    }
  });
});
```

---

## 🎭 Functional Tests

### **End-to-End User Workflows**

```javascript
// tests/e2e/user-workflows.e2e.test.js
const { test, expect } = require('@playwright/test');

test.describe('CarbonLens AI User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://carbonlens-ai.solutionsynth.cloud');
  });

  test('complete carbon tracking workflow', async ({ page }) => {
    // 1. Sign in
    await page.click('text=Sign In');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'MyPassword123!');
    await page.click('[data-testid="sign-in-button"]');

    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // 2. Upload document
    await page.click('text=Upload Documents');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-invoice.pdf');
    
    await page.click('text=Process Document');
    
    // Wait for processing to complete
    await expect(page.locator('text=Processing complete')).toBeVisible({ timeout: 30000 });

    // 3. Review extracted data
    await expect(page.locator('[data-testid="origin"]')).toContainText('New York');
    await expect(page.locator('[data-testid="destination"]')).toContainText('Los Angeles');
    
    // 4. Calculate carbon footprint
    await page.click('text=Calculate Carbon Footprint');
    
    await expect(page.locator('[data-testid="total-emissions"]')).toBeVisible({ timeout: 15000 });
    
    // 5. View optimizations
    await page.click('text=View Optimizations');
    
    await expect(page.locator('text=Route Optimization')).toBeVisible();
    await expect(page.locator('text=15-25% reduction')).toBeVisible();

    // 6. Generate certificate
    await page.click('text=Generate Certificate');
    
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.fill('[data-testid="product-sku"]', 'TEST-001');
    
    await page.click('text=Create Certificate');
    
    await expect(page.locator('[data-testid="certificate-id"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
  });

  test('document upload validation', async ({ page }) => {
    await page.click('text=Sign In');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'MyPassword123!');
    await page.click('[data-testid="sign-in-button"]');

    await page.click('text=Upload Documents');
    
    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid-file.txt');
    
    await expect(page.locator('text=Invalid file type')).toBeVisible();
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('https://carbonlens-ai.solutionsynth.cloud');
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
```

### **API Functional Tests**

```javascript
// tests/functional/api-workflows.test.js
const axios = require('axios');
const fs = require('fs');

describe('API Functional Tests', () => {
  const API_BASE_URL = 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev';
  let authToken;

  beforeAll(async () => {
    // Authenticate
    const AWS = require('aws-sdk');
    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
    
    const authResult = await cognito.adminInitiateAuth({
      UserPoolId: 'us-east-1_pesPWWfoF',
      ClientId: '6lm8qg1seqc7o05tkp03ecv4v9',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: 'testuser',
        PASSWORD: 'MyPassword123!'
      }
    }).promise();

    authToken = authResult.AuthenticationResult.IdToken;
  });

  test('complete document processing workflow', async () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // 1. Process document
    const documentData = {
      documentUrl: 'https://example.com/test-invoice.pdf',
      documentType: 'invoice',
      fileData: {
        name: 'test-invoice.pdf',
        size: 1024
      }
    };

    let response = await axios.post(`${API_BASE_URL}/process-document`, documentData, { headers });
    expect(response.status).toBe(200);
    
    const extractedData = response.data.extractedData;
    expect(extractedData.origin).toBeDefined();
    expect(extractedData.destination).toBeDefined();

    // 2. Calculate carbon footprint
    const carbonData = {
      transportMode: extractedData.transportMode || 'truck',
      weight: extractedData.weight || 1000,
      distance: extractedData.distance || 500,
      origin: extractedData.origin,
      destination: extractedData.destination
    };

    response = await axios.post(`${API_BASE_URL}/calculate-carbon`, carbonData, { headers });
    expect(response.status).toBe(200);
    
    const carbonFootprint = response.data.carbonFootprint;
    expect(carbonFootprint.totalEmissions).toBeGreaterThan(0);

    // 3. Get optimizations
    response = await axios.get(`${API_BASE_URL}/optimizations`, { headers });
    expect(response.status).toBe(200);
    expect(response.data.optimizations.summary.totalPotentialReduction).toBeDefined();

    // 4. Generate certificate
    const certificateData = {
      carbonFootprint,
      productInfo: {
        name: 'Test Product',
        sku: 'TEST-001'
      },
      companyInfo: {
        name: 'Test Company',
        address: '123 Test St'
      }
    };

    response = await axios.post(`${API_BASE_URL}/certificate`, certificateData, { headers });
    expect(response.status).toBe(200);
    expect(response.data.certificate.id).toBeDefined();
    expect(response.data.qrCode).toBeDefined();
  }, 30000); // 30 second timeout for full workflow
});
```

---

## ⚡ Performance Tests

### **Load Testing**

```javascript
// tests/performance/load.test.js
const axios = require('axios');

describe('Performance Tests', () => {
  const API_BASE_URL = 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev';
  let authToken;

  beforeAll(async () => {
    // Get auth token
    const AWS = require('aws-sdk');
    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
    
    const authResult = await cognito.adminInitiateAuth({
      UserPoolId: 'us-east-1_pesPWWfoF',
      ClientId: '6lm8qg1seqc7o05tkp03ecv4v9',
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: 'testuser',
        PASSWORD: 'MyPassword123!'
      }
    }).promise();

    authToken = authResult.AuthenticationResult.IdToken;
  });

  test('API response time under load', async () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const promises = [];
    const startTime = Date.now();

    // Send 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(
        axios.get(`${API_BASE_URL}/optimizations`, { headers })
      );
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Average response time should be under 2 seconds
    const averageTime = totalTime / responses.length;
    expect(averageTime).toBeLessThan(2000);

    console.log(`Average response time: ${averageTime}ms`);
  }, 30000);

  test('carbon calculation performance', async () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    const carbonData = {
      transportMode: 'truck',
      weight: 1000,
      distance: 500,
      origin: 'New York',
      destination: 'Philadelphia'
    };

    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/calculate-carbon`, carbonData, { headers });
    const endTime = Date.now();

    expect(response.status).toBe(200);
    
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second

    console.log(`Carbon calculation response time: ${responseTime}ms`);
  });
});
```

---

## 🤖 Test Automation

### **Test Scripts Setup**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:performance": "jest --testPathPattern=performance",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### **Jest Configuration**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'backend/src/**/*.js',
    '!src/index.js',
    '!src/reportWebVitals.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};
```

### **Playwright Configuration**

```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://carbonlens-ai.solutionsynth.cloud',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
};
```

---

## 🔄 CI/CD Integration

### **GitHub Actions Workflow**

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        TABLE_NAME: ${{ secrets.TEST_TABLE_NAME }}
        API_BASE_URL: ${{ secrets.TEST_API_URL }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

---

## 📊 Best Practices

### **Test Organization**

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Test Names**: What is being tested and expected outcome
3. **Single Responsibility**: One assertion per test when possible
4. **Test Independence**: Tests should not depend on each other
5. **Mock External Dependencies**: Use mocks for AWS services, APIs

### **Coverage Goals**

```javascript
// Coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./src/components/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "./backend/src/handlers/": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  }
}
```

### **Test Data Management**

```javascript
// tests/fixtures/testData.js
export const mockCarbonCalculation = {
  transportMode: 'truck',
  weight: 1000,
  distance: 500,
  totalEmissions: 31,
  emissionFactor: 0.062
};

export const mockExtractedData = {
  origin: 'New York, NY',
  destination: 'Los Angeles, CA',
  weight: 1000,
  transportMode: 'truck',
  confidence: {
    overall: 0.95,
    origin: 0.98,
    destination: 0.97,
    weight: 0.92
  }
};

export const mockOptimizations = {
  routeOptimization: [
    {
      action: 'Optimize delivery routes using AI-powered route planning',
      emissionReduction: '15-25%',
      difficulty: 'Medium',
      costImpact: 'Savings',
      timeline: '2-4 weeks'
    }
  ],
  summary: {
    totalPotentialReduction: '25-40%',
    quickWins: ['Consolidate shipments', 'Switch to ocean freight'],
    longTermGoals: ['Implement AI route optimization']
  }
};
```

### **Error Handling Tests**

```javascript
// Always test error scenarios
test('handles network errors gracefully', async () => {
  mockAPI.get.mockRejectedValueOnce(new Error('Network Error'));
  
  render(<Dashboard />);
  
  await waitFor(() => {
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
```

---

## 📈 Test Metrics & Reporting

### **Key Metrics to Track**

1. **Test Coverage**: Lines, branches, functions covered
2. **Test Execution Time**: How long tests take to run
3. **Test Reliability**: Flaky test identification
4. **Bug Detection Rate**: Tests catching real issues
5. **Performance Benchmarks**: API response times, load handling

### **Reporting Dashboard**

```javascript
// Generate test report
const generateTestReport = () => {
  return {
    timestamp: new Date().toISOString(),
    coverage: {
      lines: 87.5,
      branches: 82.3,
      functions: 89.1,
      statements: 86.8
    },
    performance: {
      averageApiResponseTime: 245, // ms
      maxConcurrentUsers: 50,
      errorRate: 0.02 // 2%
    },
    testResults: {
      total: 156,
      passed: 152,
      failed: 2,
      skipped: 2,
      executionTime: 45.2 // seconds
    }
  };
};
```

---

*This comprehensive testing guide ensures CarbonLens AI maintains high quality, reliability, and performance across all components. Regular testing helps catch issues early and provides confidence in deployments.*

---

**Last Updated**: December 30, 2024  
**Version**: 1.0.0  
**Application**: CarbonLens AI