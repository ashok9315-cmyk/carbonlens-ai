const { handler } = require('../carbonCalculator');

describe('Carbon Calculator Handler - Real Data Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  test('calculates carbon footprint with real distance calculation', async () => {
    const event = {
      headers: {
        'x-user-email': 'test@example.com'
      },
      body: JSON.stringify({
        documentId: 'manual-calc',
        shippingData: {
          origin: 'New York',
          destination: 'Los Angeles',
          transportMode: 'truck',
          weight: 1000,
          distance: null // Should calculate real distance
        },
        additionalData: {}
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.carbonFootprint).toBeDefined();
    expect(response.carbonFootprint.totalEmissions).toBeGreaterThan(0);
    expect(response.carbonFootprint.metadata.distance).toBeGreaterThan(3900); // NY to LA is ~3944 km
    expect(response.carbonFootprint.metadata.distance).toBeLessThan(4000);
    expect(response.carbonFootprint.metadata.transportMode).toBe('truck');
    expect(response.carbonFootprint.breakdown).toBeDefined();
    expect(response.aiInsights).toBeDefined();
  });

  test('calculates emissions for different transport modes', async () => {
    const testCases = [
      { mode: 'truck', expectedFactor: 0.062 },
      { mode: 'rail', expectedFactor: 0.022 },
      { mode: 'air', expectedFactor: 0.602 },
      { mode: 'ship', expectedFactor: 0.008 }
    ];

    for (const testCase of testCases) {
      const event = {
        headers: { 'x-user-email': 'test@example.com' },
        body: JSON.stringify({
          documentId: 'manual-calc',
          shippingData: {
            origin: 'Chicago',
            destination: 'Denver',
            transportMode: testCase.mode,
            weight: 1000,
            distance: 1000
          }
        })
      };

      const result = await handler(event);
      const response = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(response.carbonFootprint.metadata.emissionFactor).toBe(testCase.expectedFactor);
    }
  });

  test('handles unknown cities with fallback distance', async () => {
    const event = {
      headers: { 'x-user-email': 'test@example.com' },
      body: JSON.stringify({
        documentId: 'manual-calc',
        shippingData: {
          origin: 'Unknown City A',
          destination: 'Unknown City B',
          transportMode: 'truck',
          weight: 1000
        }
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.carbonFootprint.metadata.distance).toBe(1500); // Fallback regional estimate
  });

  test('includes dynamic breakdown based on transport mode', async () => {
    const event = {
      headers: { 'x-user-email': 'test@example.com' },
      body: JSON.stringify({
        documentId: 'manual-calc',
        shippingData: {
          origin: 'Seattle',
          destination: 'Portland',
          transportMode: 'rail',
          weight: 2000,
          distance: 280
        }
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    
    const breakdown = response.carbonFootprint.breakdown;
    expect(breakdown.transport).toBeGreaterThan(breakdown.manufacturing);
    expect(breakdown.transport).toBeGreaterThan(breakdown.warehousing);
    expect(breakdown.transport).toBeGreaterThan(breakdown.lastMile);
    
    // Rail should have high transport percentage (90%)
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    expect(breakdown.transport / total).toBeCloseTo(0.9, 1);
  });

  test('provides AI insights with recommendations', async () => {
    const event = {
      headers: { 'x-user-email': 'test@example.com' },
      body: JSON.stringify({
        documentId: 'manual-calc',
        shippingData: {
          origin: 'Boston',
          destination: 'Miami',
          transportMode: 'air',
          weight: 500,
          distance: 1500
        }
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.aiInsights).toBeDefined();
    expect(response.aiInsights.summary).toBeDefined();
    expect(response.aiInsights.recommendations).toBeDefined();
    expect(response.aiInsights.sustainabilityScore).toBeDefined();
    expect(response.aiInsights.confidence).toBeDefined();
  });

  test('handles missing headers gracefully', async () => {
    const event = {
      headers: {},
      body: JSON.stringify({
        documentId: 'manual-calc',
        shippingData: {
          origin: 'Dallas',
          destination: 'Houston',
          transportMode: 'truck',
          weight: 1000
        }
      })
    };

    const result = await handler(event);
    const response = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(response.carbonFootprint).toBeDefined();
  });

  test('handles errors gracefully', async () => {
    const event = {
      headers: { 'x-user-email': 'test@example.com' },
      body: 'invalid json'
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).error).toBe('Failed to calculate carbon footprint');
  });
});