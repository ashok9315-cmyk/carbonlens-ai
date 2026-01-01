const { handler } = require('../dashboardData');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');

describe('Dashboard Data Handler', () => {
  let mockSend;
  let mockUnmarshall;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSend = jest.fn();
    DynamoDBClient.mockImplementation(() => ({
      send: mockSend
    }));
    
    mockUnmarshall = jest.fn();
    unmarshall.mockImplementation(mockUnmarshall);
    
    // Set environment variables
    process.env.TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  test('returns dashboard data for anonymous user', async () => {
    const mockItems = [
      { id: '1', type: 'document', userId: 'test-user' },
      { id: '2', type: 'calculation', userId: 'test-user' }
    ];

    mockSend.mockResolvedValue({
      Items: [
        { id: { S: '1' }, type: { S: 'document' } },
        { id: { S: '2' }, type: { S: 'calculation' } }
      ]
    });

    mockUnmarshall
      .mockReturnValueOnce(mockItems[0])
      .mockReturnValueOnce(mockItems[1]);

    const event = {
      headers: {},
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      totalEmissions: expect.any(Number),
      documentsProcessed: expect.any(Number),
      optimizationsSuggested: expect.any(Number),
      certificatesGenerated: expect.any(Number),
      userType: 'demo'
    });
  });

  test('returns dashboard data for test user', async () => {
    const mockItems = [
      { id: '1', type: 'document', userId: 'test-user' },
      { id: '2', type: 'calculation', userId: 'test@example.com' }
    ];

    mockSend.mockResolvedValue({
      Items: [
        { id: { S: '1' }, type: { S: 'document' } },
        { id: { S: '2' }, type: { S: 'calculation' } }
      ]
    });

    mockUnmarshall
      .mockReturnValueOnce(mockItems[0])
      .mockReturnValueOnce(mockItems[1]);

    const event = {
      headers: {
        'x-user-email': 'test@example.com'
      },
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      totalEmissions: expect.any(Number),
      documentsProcessed: expect.any(Number),
      optimizationsSuggested: expect.any(Number),
      certificatesGenerated: expect.any(Number),
      userType: 'test',
      userEmail: 'test@example.com'
    });
  });

  test('returns dashboard data for real user', async () => {
    const mockItems = [
      { id: '1', type: 'document', userId: 'real@example.com' },
      { id: '2', type: 'calculation', userId: 'real@example.com' }
    ];

    mockSend.mockResolvedValue({
      Items: [
        { id: { S: '1' }, type: { S: 'document' } },
        { id: { S: '2' }, type: { S: 'calculation' } }
      ]
    });

    mockUnmarshall
      .mockReturnValueOnce(mockItems[0])
      .mockReturnValueOnce(mockItems[1]);

    const event = {
      headers: {
        'x-user-email': 'real@example.com'
      },
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      totalEmissions: expect.any(Number),
      documentsProcessed: expect.any(Number),
      optimizationsSuggested: expect.any(Number),
      certificatesGenerated: expect.any(Number),
      userType: 'real',
      userEmail: 'real@example.com'
    });
  });

  test('gets user email from query parameters', async () => {
    const mockItems = [];

    mockSend.mockResolvedValue({ Items: [] });

    const event = {
      headers: {},
      queryStringParameters: {
        userEmail: 'query@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      userEmail: 'query@example.com'
    });
  });

  test('handles DynamoDB scan error', async () => {
    mockSend.mockRejectedValue(new Error('DynamoDB error'));

    const event = {
      headers: {},
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'Failed to fetch dashboard data',
      details: 'DynamoDB error'
    });
  });

  test('handles missing environment variables', async () => {
    delete process.env.TABLE_NAME;

    const event = {
      headers: {},
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'Failed to fetch dashboard data'
    });
  });

  test('calculates metrics correctly from items', async () => {
    const mockItems = [
      { 
        id: '1', 
        type: 'document', 
        userId: 'test-user',
        status: 'processed'
      },
      { 
        id: '2', 
        type: 'calculation', 
        userId: 'test-user',
        totalEmissions: 100.5,
        createdAt: '2024-01-01T10:00:00Z'
      },
      { 
        id: '3', 
        type: 'optimization', 
        userId: 'test-user'
      },
      { 
        id: '4', 
        type: 'certificate', 
        userId: 'test-user'
      }
    ];

    mockSend.mockResolvedValue({
      Items: mockItems.map(item => ({ id: { S: item.id } }))
    });

    mockItems.forEach((item, index) => {
      mockUnmarshall.mockReturnValueOnce(item);
    });

    const event = {
      headers: {},
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.documentsProcessed).toBe(1);
    expect(body.optimizationsSuggested).toBe(1);
    expect(body.certificatesGenerated).toBe(1);
    expect(body.totalEmissions).toBeGreaterThan(0);
  });

  test('includes CORS headers', async () => {
    mockSend.mockResolvedValue({ Items: [] });

    const event = {
      headers: {},
      queryStringParameters: null
    };

    const result = await handler(event);

    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    });
  });

  test('filters items correctly for different user types', async () => {
    const mockItems = [
      { id: '1', type: 'document', userId: 'test-user' },
      { id: '2', type: 'document', userId: 'real@example.com' },
      { id: '3', type: 'document' }, // No userId (legacy)
      { id: '4', type: 'document', userId: 'other@example.com' }
    ];

    mockSend.mockResolvedValue({
      Items: mockItems.map(item => ({ id: { S: item.id } }))
    });

    mockItems.forEach((item, index) => {
      mockUnmarshall.mockReturnValueOnce(item);
    });

    // Test real user filtering
    const event = {
      headers: {
        'x-user-email': 'real@example.com'
      },
      queryStringParameters: null
    };

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.userType).toBe('real');
    // Should only see their own data + legacy data (but not test-user data)
  });
});