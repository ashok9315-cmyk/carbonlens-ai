// Test data fixtures for CarbonLens AI tests

export const mockCarbonCalculation = {
  transportMode: 'truck',
  weight: 1000,
  distance: 500,
  origin: 'New York, NY',
  destination: 'Philadelphia, PA',
  totalEmissions: 31,
  emissionFactor: 0.062,
  breakdown: {
    transport: 31,
    manufacturing: 8.5,
    warehousing: 2.1,
    lastMile: 1.8
  }
};

export const mockExtractedData = {
  origin: 'New York, NY',
  destination: 'Los Angeles, CA',
  weight: 1000,
  transportMode: 'truck',
  distance: 2445,
  confidence: {
    overall: 0.95,
    origin: 0.98,
    destination: 0.97,
    weight: 0.92,
    transportMode: 0.89
  },
  processingTime: 15.2
};

export const mockOptimizations = {
  routeOptimization: [
    {
      action: 'Optimize delivery routes using AI-powered route planning',
      emissionReduction: '15-25%',
      difficulty: 'Medium',
      costImpact: 'Savings',
      timeline: '2-4 weeks',
      description: 'Implement dynamic route optimization to reduce total distance traveled'
    }
  ],
  transportModeSwitch: [
    {
      action: 'Switch from air freight to ocean freight for non-urgent shipments',
      emissionReduction: '80-90%',
      difficulty: 'Low',
      costImpact: 'Savings',
      timeline: '1-2 weeks',
      description: 'Ocean freight produces significantly lower emissions than air transport'
    },
    {
      action: 'Use rail transport for long-distance domestic shipments',
      emissionReduction: '60-70%',
      difficulty: 'Medium',
      costImpact: 'Neutral',
      timeline: '4-6 weeks',
      description: 'Rail transport is more efficient for heavy, long-distance shipments'
    }
  ],
  consolidation: [
    {
      action: 'Consolidate multiple small shipments into fewer larger ones',
      emissionReduction: '20-30%',
      difficulty: 'Low',
      costImpact: 'Savings',
      timeline: '1-2 weeks',
      description: 'Reduce per-unit emissions through better load utilization'
    }
  ],
  timing: [
    {
      action: 'Schedule shipments during off-peak hours to avoid traffic congestion',
      emissionReduction: '10-15%',
      difficulty: 'Low',
      costImpact: 'Neutral',
      timeline: '1 week',
      description: 'Reduce fuel consumption by avoiding traffic delays'
    }
  ],
  summary: {
    totalPotentialReduction: '25-40%',
    quickWins: ['Consolidate shipments', 'Switch to ocean freight', 'Optimize delivery timing'],
    longTermGoals: ['Implement AI route optimization', 'Establish rail transport partnerships', 'Develop sustainable supplier network']
  }
};

export const mockCertificate = {
  id: 'cert_1234567890abcdef',
  version: '1.0',
  standard: 'GHG Protocol',
  company: {
    name: 'Test Company Inc.',
    address: '123 Test Street, Test City, TC 12345',
    contact: 'test@company.com'
  },
  product: {
    name: 'Test Product',
    sku: 'TEST-001',
    category: 'Electronics'
  },
  carbonFootprint: {
    totalEmissions: 45.2,
    breakdown: {
      transport: 32.1,
      manufacturing: 8.5,
      warehousing: 2.8,
      lastMile: 1.8
    },
    methodology: 'IPCC Guidelines + EPA Emission Factors'
  },
  verification: {
    method: 'Cryptographic Hash',
    algorithm: 'SHA-256',
    hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    signature: 'sig_1234567890abcdef1234567890abcdef',
    timestamp: '2024-12-29T10:30:00Z'
  },
  qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

export const mockDashboardMetrics = {
  totalEmissions: 1250.5,
  documentsProcessed: 15,
  optimizations: 8,
  certificates: 3,
  emissionsTrend: [
    { month: 'Jan', emissions: 1200 },
    { month: 'Feb', emissions: 1100 },
    { month: 'Mar', emissions: 1250 },
    { month: 'Apr', emissions: 1180 },
    { month: 'May', emissions: 1050 },
    { month: 'Jun', emissions: 980 }
  ],
  emissionsByMode: [
    { name: 'Truck', value: 45, emissions: 562.5 },
    { name: 'Air', value: 30, emissions: 375 },
    { name: 'Ocean', value: 20, emissions: 250 },
    { name: 'Rail', value: 5, emissions: 62.5 }
  ],
  recentActivities: [
    {
      id: 1,
      type: 'document-processed',
      message: 'Invoice INV-001 processed successfully',
      timestamp: '2024-12-29T10:30:00Z'
    },
    {
      id: 2,
      type: 'carbon-calculated',
      message: 'Carbon footprint calculated: 45.2 kg CO₂e',
      timestamp: '2024-12-29T10:25:00Z'
    },
    {
      id: 3,
      type: 'optimization-generated',
      message: 'New optimization recommendations available',
      timestamp: '2024-12-29T10:20:00Z'
    },
    {
      id: 4,
      type: 'certificate-issued',
      message: 'Certificate CERT-001 generated',
      timestamp: '2024-12-29T10:15:00Z'
    }
  ]
};

export const mockTextractResponse = {
  Blocks: [
    {
      BlockType: 'LINE',
      Text: 'SHIPPING INVOICE',
      Confidence: 99.5,
      Id: 'block-1'
    },
    {
      BlockType: 'LINE',
      Text: 'From: New York, NY 10001',
      Confidence: 98.2,
      Id: 'block-2'
    },
    {
      BlockType: 'LINE',
      Text: 'To: Los Angeles, CA 90210',
      Confidence: 97.8,
      Id: 'block-3'
    },
    {
      BlockType: 'LINE',
      Text: 'Weight: 1,500 lbs',
      Confidence: 96.5,
      Id: 'block-4'
    },
    {
      BlockType: 'LINE',
      Text: 'Transport Mode: Ground/Truck',
      Confidence: 94.2,
      Id: 'block-5'
    },
    {
      BlockType: 'LINE',
      Text: 'Distance: 2,445 miles',
      Confidence: 93.8,
      Id: 'block-6'
    }
  ]
};

export const mockComprehendResponse = {
  Entities: [
    {
      Text: 'New York',
      Type: 'LOCATION',
      Score: 0.99,
      BeginOffset: 6,
      EndOffset: 14
    },
    {
      Text: 'Los Angeles',
      Type: 'LOCATION',
      Score: 0.98,
      BeginOffset: 4,
      EndOffset: 15
    },
    {
      Text: '1,500',
      Type: 'QUANTITY',
      Score: 0.96,
      BeginOffset: 8,
      EndOffset: 13
    },
    {
      Text: 'lbs',
      Type: 'OTHER',
      Score: 0.95,
      BeginOffset: 14,
      EndOffset: 17
    }
  ]
};

export const testCredentials = {
  username: 'testuser',
  password: 'MyPassword123!',
  userPoolId: 'us-east-1_YsfqO2eRu',
  clientId: '41rnuf729f7ejfuv8dl727voel'
};

export const apiEndpoints = {
  base: 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev',
  processDocument: '/process-document',
  calculateCarbon: '/calculate-carbon',
  optimizations: '/optimizations',
  certificate: '/certificate'
};

// Helper functions for test data
export const createMockEvent = (body) => ({
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock-jwt-token'
  },
  requestContext: {
    requestId: 'test-request-id',
    stage: 'test'
  }
});

export const createMockContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-aws-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/12/29/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000
});

export const createMockFile = (name, type, size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};