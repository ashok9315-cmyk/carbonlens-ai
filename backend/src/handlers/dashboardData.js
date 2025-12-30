const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Fetching dashboard data...');
    
    // Get user identification from headers or query params
    const userEmail = event.headers['x-user-email'] || event.queryStringParameters?.userEmail;
    const isTestUser = userEmail && (
      userEmail.includes('test') || 
      userEmail.includes('demo') || 
      userEmail === 'test@example.com'
    );
    
    console.log(`Dashboard request for user: ${userEmail}, isTestUser: ${isTestUser}`);
    
    // Fetch all records from DynamoDB
    const scanCommand = new ScanCommand({
      TableName: process.env.TABLE_NAME
    });
    
    const result = await dynamoClient.send(scanCommand);
    let items = result.Items.map(item => unmarshall(item));
    
    console.log(`Total items in database: ${items.length}`);
    console.log(`Items by userId:`, items.reduce((acc, item) => {
      const userId = item.userId || 'no-userId';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {}));
    
    // Filter data based on user type
    if (userEmail && !isTestUser) {
      // Real users see only their own data (exclude test data)
      items = items.filter(item => {
        // Include items that have no userId (legacy data) OR items that belong to this user
        // BUT exclude items that belong to test-user
        return (
          (!item.userId && item.userId !== 'test-user') || 
          item.userId === userEmail
        );
      });
      console.log(`Filtered to ${items.length} items for real user: ${userEmail}`);
    } else if (isTestUser) {
      // Test users see test data + their own data
      items = items.filter(item => 
        !item.userId || 
        item.userId === 'test-user' || 
        item.userId === userEmail
      );
      console.log(`Filtered to ${items.length} items for test user: ${userEmail}`);
    } else {
      // Demo/anonymous users see only test data
      items = items.filter(item => 
        !item.userId || item.userId === 'test-user'
      );
      console.log(`Showing test data for demo visitor`);
    }
    
    // Process the filtered data to generate dashboard metrics
    const dashboardData = await processDashboardData(items, userEmail, isTestUser);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      },
      body: JSON.stringify(dashboardData)
    };
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      },
      body: JSON.stringify({
        error: 'Failed to fetch dashboard data',
        details: error.message
      })
    };
  }
};

async function processDashboardData(items, userEmail, isTestUser) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  // Separate different types of records
  const documents = items.filter(item => item.type === 'document-processing');
  const calculations = items.filter(item => item.type === 'calculation');
  const certificates = items.filter(item => item.type === 'certificate');
  const optimizations = items.filter(item => item.type === 'optimization');
  
  // Calculate total emissions
  let totalEmissions = 0;
  const emissionsByMode = {
    truck: 0,
    air: 0,
    ocean: 0,
    rail: 0,
    ship: 0,
    ground: 0
  };
  
  calculations.forEach(calc => {
    try {
      const data = typeof calc.data === 'string' ? JSON.parse(calc.data) : calc.data;
      if (data.carbonFootprint && data.carbonFootprint.totalEmissions) {
        totalEmissions += data.carbonFootprint.totalEmissions;
        
        // Track emissions by transport mode
        const mode = data.carbonFootprint.metadata?.transportMode?.toLowerCase() || 'truck';
        if (emissionsByMode.hasOwnProperty(mode)) {
          emissionsByMode[mode] += data.carbonFootprint.totalEmissions;
        } else if (mode.includes('truck') || mode.includes('ground')) {
          emissionsByMode.truck += data.carbonFootprint.totalEmissions;
        } else if (mode.includes('air') || mode.includes('flight')) {
          emissionsByMode.air += data.carbonFootprint.totalEmissions;
        } else if (mode.includes('ship') || mode.includes('ocean') || mode.includes('sea')) {
          emissionsByMode.ocean += data.carbonFootprint.totalEmissions;
        } else if (mode.includes('rail') || mode.includes('train')) {
          emissionsByMode.rail += data.carbonFootprint.totalEmissions;
        } else {
          emissionsByMode.truck += data.carbonFootprint.totalEmissions; // Default
        }
      }
    } catch (error) {
      console.error('Error processing calculation data:', error);
    }
  });
  
  // Generate emissions trend for last 6 months
  const emissionsTrend = generateEmissionsTrend(calculations, sixMonthsAgo);
  
  // Convert emissions by mode to chart format
  const emissionsByModeChart = Object.entries(emissionsByMode)
    .filter(([mode, value]) => value > 0)
    .map(([mode, value]) => ({
      name: mode.charAt(0).toUpperCase() + mode.slice(1),
      value: Math.round((value / totalEmissions) * 100) || 0,
      color: getModeColor(mode)
    }));
  
  // Generate recent activities
  const recentActivities = generateRecentActivities(items);
  
  // Calculate previous month data for comparison
  const previousMonthData = calculatePreviousMonthData(items);
  
  return {
    totalEmissions: Math.round(totalEmissions * 100) / 100,
    documentsProcessed: documents.length,
    optimizationsSuggested: optimizations.length,
    certificatesGenerated: certificates.length,
    emissionsTrend,
    emissionsByMode: emissionsByModeChart,
    recentActivities,
    previousMonth: previousMonthData,
    lastUpdated: new Date().toISOString(),
    userType: isTestUser ? 'test' : (userEmail ? 'real' : 'demo'),
    userEmail: userEmail || 'anonymous',
    // Include actual data for frontend components
    certificates: certificates.map(cert => {
      try {
        const data = typeof cert.data === 'string' ? JSON.parse(cert.data) : cert.data;
        return {
          id: cert.id,
          ...data,
          createdAt: cert.createdAt
        };
      } catch (error) {
        console.error('Error parsing certificate data:', error);
        return null;
      }
    }).filter(cert => cert !== null),
    calculations: calculations.map(calc => {
      try {
        const data = typeof calc.data === 'string' ? JSON.parse(calc.data) : calc.data;
        return {
          id: calc.id,
          documentId: calc.documentId || 'unknown',
          productName: data.productName || 'Unknown Product',
          totalEmissions: data.carbonFootprint?.totalEmissions || 0,
          breakdown: data.carbonFootprint?.breakdown || {},
          route: `${data.carbonFootprint?.metadata?.origin || 'Unknown'} → ${data.carbonFootprint?.metadata?.destination || 'Unknown'}`,
          transportMode: data.carbonFootprint?.metadata?.transportMode || 'Unknown',
          calculatedAt: calc.createdAt || calc.calculatedAt || new Date().toISOString()
        };
      } catch (error) {
        console.error('Error parsing calculation data:', error);
        return null;
      }
    }).filter(calc => calc !== null)
  };
}

function generateEmissionsTrend(calculations, startDate) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trend = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    let monthEmissions = 0;
    calculations.forEach(calc => {
      const calcDate = new Date(calc.createdAt || calc.calculatedAt);
      if (calcDate >= monthStart && calcDate <= monthEnd) {
        try {
          const data = typeof calc.data === 'string' ? JSON.parse(calc.data) : calc.data;
          if (data.carbonFootprint && data.carbonFootprint.totalEmissions) {
            monthEmissions += data.carbonFootprint.totalEmissions;
          }
        } catch (error) {
          console.error('Error processing trend data:', error);
        }
      }
    });
    
    trend.push({
      month: monthNames[date.getMonth()],
      emissions: Math.round(monthEmissions * 100) / 100
    });
  }
  
  return trend;
}

function getModeColor(mode) {
  const colors = {
    truck: '#FF6B6B',
    air: '#4ECDC4',
    ocean: '#45B7D1',
    rail: '#96CEB4',
    ship: '#45B7D1',
    ground: '#FF6B6B'
  };
  return colors[mode] || '#95A5A6';
}

function generateRecentActivities(items) {
  const activities = [];
  
  // Sort items by creation date (most recent first)
  const sortedItems = items
    .filter(item => item.createdAt || item.processedAt)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.processedAt);
      const dateB = new Date(b.createdAt || b.processedAt);
      return dateB - dateA;
    })
    .slice(0, 10); // Get last 10 activities
  
  sortedItems.forEach((item, index) => {
    const timestamp = new Date(item.createdAt || item.processedAt);
    const timeAgo = getTimeAgo(timestamp);
    
    let description = '';
    let type = 'document';
    
    switch (item.type) {
      case 'document-processing':
        description = `Processed ${item.documentType || 'document'}: ${item.fileName || 'Unknown file'}`;
        type = 'document';
        break;
      case 'calculation':
        description = `Calculated carbon footprint for document`;
        type = 'calculation';
        break;
      case 'optimization':
        description = `Generated optimization recommendations`;
        type = 'optimization';
        break;
      case 'certificate':
        description = `Generated carbon certificate`;
        type = 'certificate';
        break;
      default:
        description = `Processed ${item.type || 'item'}`;
    }
    
    activities.push({
      id: index + 1,
      type,
      description,
      timestamp: timeAgo
    });
  });
  
  return activities;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function calculatePreviousMonthData(items) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const currentMonthItems = items.filter(item => {
    const itemDate = new Date(item.createdAt || item.processedAt);
    return itemDate >= currentMonthStart;
  });
  
  const previousMonthItems = items.filter(item => {
    const itemDate = new Date(item.createdAt || item.processedAt);
    return itemDate >= previousMonthStart && itemDate <= previousMonthEnd;
  });
  
  return {
    documents: {
      current: currentMonthItems.filter(item => item.type === 'document-processing').length,
      previous: previousMonthItems.filter(item => item.type === 'document-processing').length
    },
    calculations: {
      current: currentMonthItems.filter(item => item.type === 'calculation').length,
      previous: previousMonthItems.filter(item => item.type === 'calculation').length
    }
  };
}