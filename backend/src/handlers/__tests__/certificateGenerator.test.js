const { handler } = require('../certificateGenerator');
const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('crypto');
jest.mock('uuid');

describe('Certificate Generator Handler', () => {
  let mockSend;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSend = jest.fn();
    DynamoDBClient.mockImplementation(() => ({
      send: mockSend
    }));
    
    // Mock crypto
    crypto.createHash = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hash')
    }));
    
    // Mock uuid
    uuidv4.mockReturnValue('mocked-uuid');
    
    // Set environment variables
    process.env.TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  test('generates certificate successfully', async () => {
    const mockCalculation = {
      id: { S: 'calc-1' },
      type: { S: 'calculation' },
      totalEmissions: { N: '100.5' },
      breakdown: { 
        M: {
          transport: { N: '80' },
          manufacturing: { N: '15' },
          warehousing: { N: '3.5' },
          lastMile: { N: '2' }
        }
      },
      route: { S: 'Shanghai → Los Angeles' },
      transportMode: { S: 'Ocean + Truck' },
      distance: { N: '12000' },
      weight: { N: '2.5' },
      createdAt: { S: '2024-01-01T10:00:00Z' }
    };

    // Mock scan for getting calculation
    mockSend.mockResolvedValueOnce({
      Items: [mockCalculation]
    });

    // Mock put for saving certificate
    mockSend.mockResolvedValueOnce({});

    const event = {
      httpMethod: 'POST',
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: JSON.stringify({
        calculationId: 'latest',
        productInfo: {
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Electronics'
        },
        companyInfo: {
          name: 'Test Company',
          address: 'Test Address',
          contact: 'test@company.com'
        }
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.certificateId).toBe('mocked-uuid');
    expect(body.certificate).toMatchObject({
      id: 'mocked-uuid',
      version: '1.0',
      standard: 'GHG Protocol',
      product: {
        name: 'Test Product',
        sku: 'TEST-001',
        category: 'Electronics'
      },
      company: {
        name: 'Test Company',
        address: 'Test Address',
        contact: 'test@company.com'
      }
    });
  });

  test('retrieves certificate by ID successfully', async () => {
    const mockCertificate = {
      id: { S: 'cert-123' },
      type: { S: 'certificate' },
      version: { S: '1.0' },
      standard: { S: 'GHG Protocol' }
    };

    mockSend.mockResolvedValueOnce({
      Item: mockCertificate
    });

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        id: 'cert-123'
      },
      headers: {}
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.verified).toBe(true);
    expect(body.message).toBe('Certificate verified successfully');
    expect(body.certificate).toBeDefined();
  });

  test('returns 404 when certificate not found', async () => {
    mockSend.mockResolvedValueOnce({
      Item: undefined
    });

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        id: 'non-existent'
      },
      headers: {}
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate/retrieve certificate');
    expect(body.details).toBe('Certificate not found');
  });

  test('returns error when certificate ID is missing', async () => {
    const event = {
      httpMethod: 'GET',
      pathParameters: null,
      headers: {}
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate/retrieve certificate');
    expect(body.details).toBe('Certificate ID is required');
  });

  test('returns error when no calculations found', async () => {
    mockSend.mockResolvedValueOnce({
      Items: []
    });

    const event = {
      httpMethod: 'POST',
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: JSON.stringify({
        calculationId: 'latest',
        productInfo: {
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Electronics'
        },
        companyInfo: {
          name: 'Test Company',
          address: 'Test Address',
          contact: 'test@company.com'
        }
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate/retrieve certificate');
    expect(body.details).toBe('No calculations found for this user. Please upload and analyze a document first.');
  });

  test('handles DynamoDB error gracefully', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const event = {
      httpMethod: 'POST',
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: JSON.stringify({
        calculationId: 'latest',
        productInfo: {
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Electronics'
        },
        companyInfo: {
          name: 'Test Company',
          address: 'Test Address',
          contact: 'test@company.com'
        }
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate/retrieve certificate');
    expect(body.details).toBe('DynamoDB error');
  });

  test('handles invalid JSON in request body', async () => {
    const event = {
      httpMethod: 'POST',
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: 'invalid json'
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate/retrieve certificate');
  });

  test('uses anonymous user when no email provided', async () => {
    const mockCalculation = {
      id: { S: 'calc-1' },
      type: { S: 'calculation' },
      totalEmissions: { N: '100.5' },
      breakdown: { 
        M: {
          transport: { N: '80' },
          manufacturing: { N: '15' },
          warehousing: { N: '3.5' },
          lastMile: { N: '2' }
        }
      }
    };

    mockSend.mockResolvedValueOnce({
      Items: [mockCalculation]
    });

    mockSend.mockResolvedValueOnce({});

    const event = {
      httpMethod: 'POST',
      headers: {},
      body: JSON.stringify({
        calculationId: 'latest',
        productInfo: {
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Electronics'
        },
        companyInfo: {
          name: 'Test Company',
          address: 'Test Address',
          contact: 'test@company.com'
        }
      })
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    // Should still work with anonymous user
  });

  test('includes CORS headers in response', async () => {
    const mockCalculation = {
      id: { S: 'calc-1' },
      type: { S: 'calculation' },
      totalEmissions: { N: '100.5' },
      breakdown: { M: {} }
    };

    mockSend.mockResolvedValueOnce({
      Items: [mockCalculation]
    });

    mockSend.mockResolvedValueOnce({});

    const event = {
      httpMethod: 'POST',
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: JSON.stringify({
        calculationId: 'latest',
        productInfo: { name: 'Test', sku: 'TEST', category: 'Test' },
        companyInfo: { name: 'Test', address: 'Test', contact: 'test@test.com' }
      })
    };

    const result = await handler(event);

    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    });
  });
});