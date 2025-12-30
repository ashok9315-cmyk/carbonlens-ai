const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const { calculationId, optimizationType = 'all' } = event.queryStringParameters || {};
    
    // Get user email from headers
    const userEmail = event.headers['x-user-email'] || 'anonymous';
    
    console.log(`Generating optimizations for calculation: ${calculationId}, User: ${userEmail}`);
    
    // Get recent calculations for analysis (filtered by user)
    const recentCalculations = await getRecentCalculations(userEmail);
    
    // Generate optimization recommendations
    const optimizations = await generateOptimizations(recentCalculations, optimizationType);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        optimizations,
        generatedAt: new Date().toISOString(),
        userEmail,
        message: 'Optimization recommendations generated successfully'
      })
    };
    
  } catch (error) {
    console.error('Error generating optimizations:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        error: 'Failed to generate optimizations',
        details: error.message
      })
    };
  }
};

async function getRecentCalculations(userEmail) {
  try {
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: '#type = :type AND (userId = :userId OR (userId = :testUser AND :isTestUser = :true))',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':type': { S: 'calculation' },
        ':userId': { S: userEmail || 'anonymous' },
        ':testUser': { S: 'test-user' },
        ':isTestUser': { S: isTestUser(userEmail) ? 'true' : 'false' },
        ':true': { S: 'true' }
      },
      Limit: 10
    });
    
    const result = await dynamoClient.send(command);
    return result.Items.map(item => JSON.parse(item.data.S));
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return [];
  }
}

function isTestUser(email) {
  // Define test users who should see test data
  const testUsers = ['test@example.com', 'demo@carbonlens.ai'];
  return testUsers.includes(email);
}

async function generateOptimizations(calculations, optimizationType) {
  try {
    const prompt = `As a supply chain carbon optimization expert, analyze these recent carbon footprint calculations and provide actionable optimization recommendations:

    Recent Calculations: ${JSON.stringify(calculations.slice(0, 3), null, 2)}
    
    Optimization Focus: ${optimizationType}
    
    Please provide detailed recommendations in the following categories:
    1. Route Optimization - Alternative routes with lower emissions
    2. Transport Mode Switching - More sustainable transport options
    3. Consolidation Opportunities - Combining shipments for efficiency
    4. Timing Optimization - Better scheduling for reduced emissions
    5. Cost-Benefit Analysis - Financial impact of each recommendation
    
    For each recommendation, include:
    - Specific action to take
    - Expected emission reduction (%)
    - Implementation difficulty (Low/Medium/High)
    - Cost impact (Savings/Neutral/Cost)
    - Timeline for implementation
    
    Respond in JSON format with structure:
    {
      "routeOptimization": [...],
      "transportModeSwitch": [...],
      "consolidation": [...],
      "timing": [...],
      "summary": {
        "totalPotentialReduction": "X%",
        "quickWins": [...],
        "longTermGoals": [...]
      }
    }`;
    
    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-lite-v1:0',
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 2000,
          temperature: 0.7
        }
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });
    
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    try {
      return JSON.parse(responseBody.outputText);
    } catch (parseError) {
      // Fallback optimization recommendations
      return generateFallbackOptimizations();
    }
    
  } catch (error) {
    console.error('Error generating AI optimizations:', error);
    return generateFallbackOptimizations();
  }
}

function generateFallbackOptimizations() {
  return {
    routeOptimization: [
      {
        action: "Optimize delivery routes using AI-powered route planning",
        emissionReduction: "15-25%",
        difficulty: "Medium",
        costImpact: "Savings",
        timeline: "2-4 weeks",
        description: "Implement dynamic route optimization to reduce total distance traveled"
      }
    ],
    transportModeSwitch: [
      {
        action: "Switch from air freight to ocean freight for non-urgent shipments",
        emissionReduction: "80-90%",
        difficulty: "Low",
        costImpact: "Savings",
        timeline: "1-2 weeks",
        description: "Ocean freight produces significantly lower emissions than air transport"
      },
      {
        action: "Use rail transport for long-distance domestic shipments",
        emissionReduction: "60-70%",
        difficulty: "Medium",
        costImpact: "Neutral",
        timeline: "4-6 weeks",
        description: "Rail transport is more efficient for heavy, long-distance shipments"
      }
    ],
    consolidation: [
      {
        action: "Consolidate multiple small shipments into fewer larger ones",
        emissionReduction: "20-30%",
        difficulty: "Low",
        costImpact: "Savings",
        timeline: "1-2 weeks",
        description: "Reduce per-unit emissions through better load utilization"
      }
    ],
    timing: [
      {
        action: "Schedule shipments during off-peak hours to avoid traffic congestion",
        emissionReduction: "10-15%",
        difficulty: "Low",
        costImpact: "Neutral",
        timeline: "1 week",
        description: "Reduce fuel consumption by avoiding traffic delays"
      }
    ],
    summary: {
      totalPotentialReduction: "25-40%",
      quickWins: [
        "Consolidate shipments",
        "Switch to ocean freight",
        "Optimize delivery timing"
      ],
      longTermGoals: [
        "Implement AI route optimization",
        "Establish rail transport partnerships",
        "Develop sustainable supplier network"
      ]
    }
  };
}