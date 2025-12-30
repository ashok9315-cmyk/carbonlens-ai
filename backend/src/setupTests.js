// Mock AWS SDK v3
jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        Item: {
          id: { S: 'test-doc-id' },
          data: { S: JSON.stringify({
            origin: 'New York',
            destination: 'Los Angeles',
            weight: 1000,
            transportMode: 'truck'
          })}
        }
      })
    })),
    PutItemCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-textract', () => {
  return {
    TextractClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        Blocks: []
      })
    })),
    DetectDocumentTextCommand: jest.fn(),
    AnalyzeDocumentCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          outputText: JSON.stringify({
            summary: "Test AI analysis",
            recommendations: ["Test recommendation"],
            alternatives: [{ mode: "rail", reduction: "60%", feasibility: "medium" }],
            sustainabilityScore: 7,
            confidence: 0.85
          })
        }))
      })
    })),
    InvokeModelCommand: jest.fn()
  };
});

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

// Set up environment variables for tests
process.env.TABLE_NAME = 'test-table';
process.env.DOCUMENTS_BUCKET = 'test-documents-bucket';
process.env.USER_POOL_ID = 'test-user-pool';

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};