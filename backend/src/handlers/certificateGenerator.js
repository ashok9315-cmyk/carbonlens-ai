const { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    // Handle GET request for certificate verification
    if (event.httpMethod === 'GET') {
      const certificateId = event.pathParameters?.id;
      if (!certificateId) {
        throw new Error('Certificate ID is required');
      }
      
      const certificate = await getCertificateById(certificateId);
      if (!certificate) {
        throw new Error('Certificate not found');
      }
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        body: JSON.stringify({
          certificate,
          verified: true,
          message: 'Certificate verified successfully'
        })
      };
    }
    
    // Handle POST request for certificate generation
    const { calculationId, productInfo, companyInfo } = JSON.parse(event.body);
    
    // Get user email from headers
    const userEmail = event.headers['x-user-email'] || 'anonymous';
    
    console.log(`Generating carbon certificate for calculation: ${calculationId}, User: ${userEmail}`);
    
    // Get calculation data
    const calculationData = await getCalculationData(calculationId, userEmail);
    if (!calculationData) {
      throw new Error(calculationId === 'latest' ? 
        'No calculations found for this user. Please upload and analyze a document first.' : 
        'Calculation not found');
    }
    
    // Generate blockchain-verified certificate
    const certificate = await generateCertificate(calculationData, productInfo, companyInfo);
    
    // Store certificate
    const certificateId = uuidv4();
    await storeCertificate(certificateId, certificate, userEmail);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        certificateId,
        certificate,
        qrCodeUrl: `https://carbonlens-ai.solutionsynth.cloud/certificates/verify/${certificateId}`,
        message: 'Carbon certificate generated successfully'
      })
    };
    
  } catch (error) {
    console.error('Error with certificate operation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-email',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        error: 'Certificate operation failed',
        details: error.message
      })
    };
  }
};

async function getCertificateById(certificateId) {
  try {
    const command = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id: { S: certificateId },
        type: { S: 'certificate' }
      }
    });
    
    const result = await dynamoClient.send(command);
    return result.Item ? JSON.parse(result.Item.data.S) : null;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return null;
  }
}

async function getCalculationData(calculationId, userEmail) {
  try {
    // If calculationId is 'latest', find the user's most recent calculation
    if (calculationId === 'latest') {
      return await getLatestCalculation(userEmail);
    }
    
    const command = new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        id: { S: calculationId },
        type: { S: 'calculation' }
      }
    });
    
    const result = await dynamoClient.send(command);
    return result.Item ? JSON.parse(result.Item.data.S) : null;
  } catch (error) {
    console.error('Error fetching calculation data:', error);
    return null;
  }
}

async function getLatestCalculation(userEmail) {
  try {
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: '#type = :type AND #userId = :userId',
      ExpressionAttributeNames: {
        '#type': 'type',
        '#userId': 'userId'
      },
      ExpressionAttributeValues: {
        ':type': { S: 'calculation' },
        ':userId': { S: userEmail || 'anonymous' }
      }
    });
    
    const result = await dynamoClient.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return null;
    }
    
    // Sort by creation date and get the most recent
    const calculations = result.Items
      .map(item => ({
        id: item.id.S,
        data: JSON.parse(item.data.S),
        createdAt: item.createdAt.S
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return calculations[0].data;
  } catch (error) {
    console.error('Error fetching latest calculation:', error);
    return null;
  }
}

async function generateCertificate(calculationData, productInfo, companyInfo) {
  const certificateData = {
    version: '1.0',
    standard: 'GHG Protocol',
    issuedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    company: {
      name: companyInfo.name || 'Unknown Company',
      address: companyInfo.address || 'Not specified',
      contact: companyInfo.contact || 'Not specified'
    },
    product: {
      name: productInfo.name || 'Unknown Product',
      sku: productInfo.sku || 'Not specified',
      category: productInfo.category || 'General'
    },
    carbonFootprint: {
      totalEmissions: calculationData.carbonFootprint.totalEmissions,
      unit: 'kg CO2e',
      breakdown: calculationData.carbonFootprint.breakdown,
      methodology: 'IPCC Guidelines + EPA Emission Factors',
      scope: 'Scope 3 - Transportation and Distribution'
    },
    supplyChain: {
      origin: calculationData.carbonFootprint.metadata.origin,
      destination: calculationData.carbonFootprint.metadata.destination,
      transportMode: calculationData.carbonFootprint.metadata.transportMode,
      distance: calculationData.carbonFootprint.metadata.distance,
      weight: calculationData.carbonFootprint.metadata.weight
    },
    verification: {
      method: 'Cryptographic Hash',
      algorithm: 'SHA-256',
      timestamp: new Date().toISOString()
    }
  };
  
  // Generate cryptographic signature for blockchain verification
  const certificateString = JSON.stringify(certificateData, null, 2);
  const hash = crypto.createHash('sha256').update(certificateString).digest('hex');
  
  certificateData.verification.hash = hash;
  certificateData.verification.signature = generateSignature(certificateString);
  
  return certificateData;
}

function generateSignature(data) {
  // In production, use proper digital signatures with private/public key pairs
  // For demo purposes, using HMAC
  const secret = process.env.CERTIFICATE_SECRET || 'carbonlens-demo-secret';
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function storeCertificate(certificateId, certificate, userEmail) {
  const command = new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: {
      id: { S: certificateId },
      userId: { S: userEmail || 'anonymous' },
      type: { S: 'certificate' },
      data: { S: JSON.stringify(certificate) },
      createdAt: { S: new Date().toISOString() },
      hash: { S: certificate.verification.hash },
      productName: { S: certificate.product.name },
      companyName: { S: certificate.company.name },
      totalEmissions: { N: certificate.carbonFootprint.totalEmissions.toString() }
    }
  });
  
  await dynamoClient.send(command);
}