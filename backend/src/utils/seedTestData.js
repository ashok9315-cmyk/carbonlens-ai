const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Sample test data for realistic dashboard
const testData = {
  documents: [
    {
      fileName: 'invoice_001.pdf',
      documentType: 'invoice',
      extractedData: {
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        transportMode: 'truck',
        weight: 1500,
        distance: 2445,
        carrier: 'FedEx'
      },
      confidence: { overall: 0.92, origin: 0.95, destination: 0.90, weight: 0.88, transportMode: 0.85 }
    },
    {
      fileName: 'shipping_manifest_002.pdf',
      documentType: 'shipping_manifest',
      extractedData: {
        origin: 'Chicago, IL',
        destination: 'Miami, FL',
        transportMode: 'air',
        weight: 850,
        distance: 1188,
        carrier: 'UPS'
      },
      confidence: { overall: 0.87, origin: 0.92, destination: 0.85, weight: 0.83, transportMode: 0.90 }
    },
    {
      fileName: 'bill_of_lading_003.pdf',
      documentType: 'bill_of_lading',
      extractedData: {
        origin: 'Seattle, WA',
        destination: 'Portland, OR',
        transportMode: 'rail',
        weight: 2200,
        distance: 173,
        carrier: 'BNSF Railway'
      },
      confidence: { overall: 0.94, origin: 0.96, destination: 0.93, weight: 0.91, transportMode: 0.95 }
    },
    {
      fileName: 'customs_declaration_004.pdf',
      documentType: 'customs_declaration',
      extractedData: {
        origin: 'Long Beach, CA',
        destination: 'Phoenix, AZ',
        transportMode: 'truck',
        weight: 1800,
        distance: 357,
        carrier: 'Schneider'
      },
      confidence: { overall: 0.89, origin: 0.91, destination: 0.88, weight: 0.86, transportMode: 0.92 }
    },
    {
      fileName: 'invoice_005.pdf',
      documentType: 'invoice',
      extractedData: {
        origin: 'Houston, TX',
        destination: 'Atlanta, GA',
        transportMode: 'truck',
        weight: 1200,
        distance: 789,
        carrier: 'J.B. Hunt'
      },
      confidence: { overall: 0.91, origin: 0.93, destination: 0.89, weight: 0.90, transportMode: 0.88 }
    },
    {
      fileName: 'shipping_label_006.png',
      documentType: 'shipping_label',
      extractedData: {
        origin: 'Boston, MA',
        destination: 'Washington, DC',
        transportMode: 'air',
        weight: 45,
        distance: 393,
        carrier: 'DHL'
      },
      confidence: { overall: 0.85, origin: 0.87, destination: 0.84, weight: 0.82, transportMode: 0.89 }
    },
    {
      fileName: 'manifest_007.pdf',
      documentType: 'shipping_manifest',
      extractedData: {
        origin: 'Denver, CO',
        destination: 'Salt Lake City, UT',
        transportMode: 'truck',
        weight: 950,
        distance: 525,
        carrier: 'Swift Transportation'
      },
      confidence: { overall: 0.88, origin: 0.90, destination: 0.86, weight: 0.87, transportMode: 0.91 }
    },
    {
      fileName: 'ocean_bill_008.pdf',
      documentType: 'bill_of_lading',
      extractedData: {
        origin: 'Oakland, CA',
        destination: 'Honolulu, HI',
        transportMode: 'ship',
        weight: 15000,
        distance: 2397,
        carrier: 'Matson Navigation'
      },
      confidence: { overall: 0.93, origin: 0.95, destination: 0.92, weight: 0.94, transportMode: 0.96 }
    }
  ],
  
  carbonCalculations: [
    { transportMode: 'truck', weight: 1500, distance: 2445, totalEmissions: 227.48 },
    { transportMode: 'air', weight: 850, distance: 1188, totalEmissions: 765.32 },
    { transportMode: 'rail', weight: 2200, distance: 173, totalEmissions: 10.45 },
    { transportMode: 'truck', weight: 1800, distance: 357, totalEmissions: 39.74 },
    { transportMode: 'truck', weight: 1200, distance: 789, totalEmissions: 58.67 },
    { transportMode: 'air', weight: 45, distance: 393, totalEmissions: 10.65 },
    { transportMode: 'truck', weight: 950, distance: 525, totalEmissions: 30.89 },
    { transportMode: 'ship', weight: 15000, distance: 2397, totalEmissions: 287.64 }
  ]
};

// Generate dates over the last 6 months
function generateRandomDate(monthsAgo) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime);
}

// Calculate carbon footprint breakdown
function calculateCarbonBreakdown(totalEmissions) {
  const transport = Math.round(totalEmissions * 0.769 * 100) / 100; // 76.9%
  const manufacturing = Math.round(totalEmissions * 0.077 * 100) / 100; // 7.7%
  const warehousing = Math.round(totalEmissions * 0.038 * 100) / 100; // 3.8%
  const lastMile = Math.round(totalEmissions * 0.115 * 100) / 100; // 11.5%
  
  return { transport, manufacturing, warehousing, lastMile };
}

// Generate AI insights based on emissions and transport mode
function generateAIInsights(carbonFootprint) {
  const { totalEmissions, metadata } = carbonFootprint;
  const { transportMode, weight, distance } = metadata;
  
  let sustainabilityScore = 7; // Default
  let insights = [];
  let recommendations = [];
  
  // Calculate sustainability score based on emissions per kg per km
  const emissionIntensity = totalEmissions / (weight * distance / 1000);
  
  if (emissionIntensity < 0.02) sustainabilityScore = 9;
  else if (emissionIntensity < 0.05) sustainabilityScore = 8;
  else if (emissionIntensity < 0.1) sustainabilityScore = 7;
  else if (emissionIntensity < 0.2) sustainabilityScore = 6;
  else if (emissionIntensity < 0.5) sustainabilityScore = 5;
  else sustainabilityScore = 4;
  
  // Generate insights based on transport mode
  switch (transportMode) {
    case 'air':
      insights.push('Air transport has high emissions but fastest delivery');
      recommendations.push('Consider ground transport for 70% emission reduction');
      recommendations.push('Consolidate shipments to improve efficiency');
      break;
    case 'truck':
      insights.push('Road transport offers flexibility with moderate emissions');
      recommendations.push('Optimize route planning to reduce distance');
      recommendations.push('Consider rail transport for long distances');
      break;
    case 'rail':
      insights.push('Rail transport is highly efficient for heavy cargo');
      recommendations.push('Excellent choice for sustainability');
      break;
    case 'ship':
      insights.push('Ocean freight has lowest emissions per ton-km');
      recommendations.push('Most sustainable option for international shipping');
      break;
  }
  
  // Add weight-based insights
  if (weight > 10000) {
    insights.push('Heavy cargo shipment - emissions scale with weight');
  } else if (weight < 100) {
    insights.push('Light package - consider consolidation opportunities');
  }
  
  // Add distance-based insights
  if (distance > 2000) {
    insights.push('Long-distance shipment increases carbon footprint');
    recommendations.push('Evaluate regional sourcing alternatives');
  }
  
  return {
    insights: insights.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    benchmarks: `${emissionIntensity < 0.1 ? 'Below' : 'Above'} industry average for ${transportMode} transport`,
    sustainabilityScore
  };
}

async function seedTestData() {
  console.log('🌱 Starting to seed test data...');
  
  const tableName = process.env.TABLE_NAME || 'carbonlens-ai-dev';
  const testUserId = 'test-user'; // Special identifier for test data
  let totalRecords = 0;
  
  try {
    // Create document processing records and corresponding calculations
    for (let i = 0; i < testData.documents.length; i++) {
      const doc = testData.documents[i];
      const calc = testData.carbonCalculations[i];
      
      // Generate IDs
      const documentId = uuidv4();
      const calculationId = uuidv4();
      
      // Generate dates (spread over last 6 months)
      const monthsAgo = Math.floor(Math.random() * 6);
      const processedDate = generateRandomDate(monthsAgo);
      const calculatedDate = new Date(processedDate.getTime() + 30000); // 30 seconds later
      
      // 1. Store document processing record
      const documentRecord = {
        TableName: tableName,
        Item: {
          id: { S: documentId },
          userId: { S: testUserId }, // Mark as test data
          type: { S: 'document-processing' },
          documentType: { S: doc.documentType },
          fileName: { S: doc.fileName },
          extractedData: { S: JSON.stringify(doc.extractedData) },
          confidence: { S: JSON.stringify(doc.confidence) },
          processedAt: { S: processedDate.toISOString() },
          createdAt: { S: processedDate.toISOString() }
        }
      };
      
      await dynamoClient.send(new PutItemCommand(documentRecord));
      totalRecords++;
      
      // 2. Calculate carbon footprint
      const carbonFootprint = {
        totalEmissions: calc.totalEmissions,
        breakdown: calculateCarbonBreakdown(calc.totalEmissions),
        metadata: {
          transportMode: calc.transportMode,
          weight: calc.weight,
          distance: calc.distance,
          emissionFactor: getEmissionFactor(calc.transportMode),
          origin: doc.extractedData.origin,
          destination: doc.extractedData.destination
        }
      };
      
      // 3. Generate AI insights
      const aiInsights = generateAIInsights(carbonFootprint);
      
      // 4. Store calculation record
      const calculationRecord = {
        TableName: tableName,
        Item: {
          id: { S: calculationId },
          userId: { S: testUserId }, // Mark as test data
          type: { S: 'calculation' },
          data: { S: JSON.stringify({
            documentId,
            carbonFootprint,
            aiInsights,
            calculatedAt: calculatedDate.toISOString()
          }) },
          createdAt: { S: calculatedDate.toISOString() }
        }
      };
      
      await dynamoClient.send(new PutItemCommand(calculationRecord));
      totalRecords++;
      
      // 5. Randomly generate some certificates (50% chance)
      if (Math.random() > 0.5) {
        const certificateId = uuidv4();
        const certificateDate = new Date(calculatedDate.getTime() + 60000); // 1 minute later
        
        const certificateRecord = {
          TableName: tableName,
          Item: {
            id: { S: certificateId },
            userId: { S: testUserId }, // Mark as test data
            type: { S: 'certificate' },
            data: { S: JSON.stringify({
              certificateNumber: `CERT-2025-${String(i + 1).padStart(6, '0')}`,
              calculationId,
              emissions: calc.totalEmissions,
              verificationHash: `sha256-${Math.random().toString(36).substring(2, 15)}`,
              issuedAt: certificateDate.toISOString()
            }) },
            createdAt: { S: certificateDate.toISOString() }
          }
        };
        
        await dynamoClient.send(new PutItemCommand(certificateRecord));
        totalRecords++;
      }
      
      // 6. Generate optimization records for high-emission shipments
      if (calc.totalEmissions > 100) {
        const optimizationId = uuidv4();
        const optimizationDate = new Date(calculatedDate.getTime() + 120000); // 2 minutes later
        
        const optimizationRecord = {
          TableName: tableName,
          Item: {
            id: { S: optimizationId },
            userId: { S: testUserId }, // Mark as test data
            type: { S: 'optimization' },
            data: { S: JSON.stringify({
              calculationId,
              recommendations: [
                {
                  type: 'transport_mode',
                  current: calc.transportMode,
                  suggested: calc.transportMode === 'air' ? 'rail' : 'rail',
                  emissionReduction: calc.transportMode === 'air' ? 85 : 65,
                  costImpact: 'neutral'
                },
                {
                  type: 'route_optimization',
                  description: 'Optimize delivery route',
                  emissionReduction: 15,
                  costImpact: 'positive'
                }
              ],
              generatedAt: optimizationDate.toISOString()
            }) },
            createdAt: { S: optimizationDate.toISOString() }
          }
        };
        
        await dynamoClient.send(new PutItemCommand(optimizationRecord));
        totalRecords++;
      }
      
      console.log(`✅ Created records for ${doc.fileName}`);
    }
    
    console.log(`🎉 Successfully seeded ${totalRecords} test records!`);
    console.log(`📊 Dashboard should now show:`);
    console.log(`   - ${testData.documents.length} documents processed`);
    console.log(`   - ${testData.carbonCalculations.reduce((sum, calc) => sum + calc.totalEmissions, 0).toFixed(2)} kg CO₂e total emissions`);
    console.log(`   - Multiple transport modes and routes`);
    console.log(`   - 6-month trend data`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

function getEmissionFactor(transportMode) {
  const factors = {
    truck: 0.062,
    rail: 0.022,
    ship: 0.008,
    air: 0.602
  };
  return factors[transportMode] || 0.062;
}

// Export for use as a module or run directly
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('✨ Test data seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to seed test data:', error);
      process.exit(1);
    });
}

module.exports = { seedTestData };