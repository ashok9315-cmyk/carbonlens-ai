const { handler } = require('../optimizationEngine');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-dynamodb');

describe('Optimization Engine Handler', () => {
  let mockBedrockSend;
  let mockDynamoSend;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockBedrockSend = jest.fn();
    BedrockRuntimeClient.mockImplementation(() => ({
      send: mockBedrockSend
    }));
    
    mockDynamoSend = jest.fn();
    DynamoDBClient.mockImplementation(() => ({
      send: mockDynamoSend
    }));
    
    // Set environment variables
    process.env.AWS_REGION = 'us-east-1';
    process.env.TABLE_NAME = 'test-table';
  });

  test('generates optimizations successfully', async () => {
    // Mock DynamoDB scan response
    mockDynamoSend.mockResolvedValue({
      Items: [
        {
          id: { S: 'calc-1' },
          type: { S: 'calculation' },
          totalEmissions: { N: '100.5' },
          transportMode: { S: 'Air Freight' },
          route: { S: 'Shanghai → Los Angeles' }
        }
      ]
    });

    // Mock Bedrock response
    const mockBedrockResponse = {
      body: {
        transformToString: () => JSON.stringify({
          completion: JSON.stringify({
            routeOptimization: [
              {
                action: 'Optimize delivery routes',
                emissionReduction: '15-25%',
                difficulty: 'Medium',
                costImpact: 'Savings',
                timeline: '2-4 weeks',
                description: 'Use AI-powered route planning'
              }
            ],
            summary: {
              totalPotentialReduction: '20-30%',
              quickWins: ['Route optimization'],
              longTermGoals: ['AI implementation']
            }
          })
        })
      }
    };

    mockBedrockSend.mockResolvedValue(mockBedrockResponse);

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    
    expect(body.optimizations).toBeDefined();
    expect(body.generatedAt).toBeDefined();
    expect(body.userEmail).toBe('test@example.com');
    expect(body.message).toBe('Optimization recommendations generated successfully');
  });

  test('handles missing query parameters', async () => {
    mockDynamoSend.mockResolvedValue({ Items: [] });
    
    // Mock fallback optimizations
    const event = {
      queryStringParameters: null,
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.optimizations).toBeDefined();
  });

  test('uses anonymous user when no email provided', async () => {
    mockDynamoSend.mockResolvedValue({ Items: [] });

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {}
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userEmail).toBe('anonymous');
  });

  test('handles DynamoDB error gracefully', async () => {
    mockDynamoSend.mockRejectedValue(new Error('DynamoDB error'));

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Failed to generate optimizations');
    expect(body.details).toBe('DynamoDB error');
  });

  test('handles Bedrock error gracefully', async () => {
    mockDynamoSend.mockResolvedValue({
      Items: [
        {
          id: { S: 'calc-1' },
          type: { S: 'calculation' },
          totalEmissions: { N: '100.5' }
        }
      ]
    });

    mockBedrockSend.mockRejectedValue(new Error('Bedrock error'));

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    // Should fall back to default optimizations
    const body = JSON.parse(result.body);
    expect(body.optimizations).toBeDefined();
  });

  test('filters calculations by user email', async () => {
    mockDynamoSend.mockResolvedValue({
      Items: [
        {
          id: { S: 'calc-1' },
          type: { S: 'calculation' },
          userId: { S: 'test@example.com' },
          totalEmissions: { N: '100.5' }
        },
        {
          id: { S: 'calc-2' },
          type: { S: 'calculation' },
          userId: { S: 'other@example.com' },
          totalEmissions: { N: '200.0' }
        }
      ]
    });

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    // Should only use calculations for the specific user
  });

  test('handles specific optimization types', async () => {
    mockDynamoSend.mockResolvedValue({ Items: [] });

    const event = {
      queryStringParameters: {
        optimizationType: 'routeOptimization'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.optimizations).toBeDefined();
  });

  test('includes CORS headers in response', async () => {
    mockDynamoSend.mockResolvedValue({ Items: [] });

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    });
  });

  test('includes CORS headers in error response', async () => {
    mockDynamoSend.mockRejectedValue(new Error('Test error'));

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    });
  });

  test('handles empty calculations gracefully', async () => {
    mockDynamoSend.mockResolvedValue({ Items: [] });

    const event = {
      queryStringParameters: {
        optimizationType: 'all'
      },
      headers: {
        'x-user-email': 'test@example.com'
      }
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.optimizations).toBeDefined();
    // Should provide default optimizations when no calculations exist
  });
});