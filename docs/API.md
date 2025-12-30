# CarbonLens AI API Documentation

This document describes the REST API endpoints for CarbonLens AI.

## Base URL

**Production API**: `https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev`

## Authentication

All API endpoints require authentication using AWS Cognito. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### User Pool Configuration
- **User Pool ID**: `us-east-1_pesPWWfoF`
- **Client ID**: `6lm8qg1seqc7o05tkp03ecv4v9`
- **Region**: `us-east-1`

## Endpoints

### Document Processing

#### POST /process-document

Process a logistics document and extract shipping information.

**Request Body:**
```json
{
  "documentUrl": "string",
  "documentType": "invoice|bill_of_lading|shipping_label|logistics_document",
  "fileData": "base64-encoded-file-content",
  "fileName": "string",
  "fileSize": "number"
}
```

**Response:**
```json
{
  "documentId": "uuid",
  "shippingData": {
    "origin": "string",
    "destination": "string",
    "transportMode": "truck|rail|ship|air|ocean|ground|freight",
    "weight": "number (kg)",
    "distance": "number (km)",
    "carrier": "string",
    "entities": []
  },
  "message": "Document processed successfully"
}
```

**Status Codes:**
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 500: Internal Server Error

### Carbon Calculation

#### POST /calculate-carbon

Calculate carbon footprint based on shipping data.

**Request Body:**
```json
{
  "documentId": "uuid",
  "shippingData": {
    "origin": "string",
    "destination": "string",
    "transportMode": "string",
    "weight": "number",
    "distance": "number"
  },
  "additionalData": {
    "manufacturingEmissions": "number (optional)",
    "warehousingEmissions": "number (optional)"
  }
}
```

**Response:**
```json
{
  "calculationId": "uuid",
  "carbonFootprint": {
    "totalEmissions": "number (kg CO2e)",
    "breakdown": {
      "transport": "number",
      "manufacturing": "number",
      "warehousing": "number",
      "lastMile": "number"
    },
    "metadata": {
      "transportMode": "string",
      "weight": "number",
      "distance": "number",
      "emissionFactor": "number",
      "origin": "string",
      "destination": "string"
    }
  },
  "aiInsights": {
    "insights": ["string"],
    "recommendations": ["string"],
    "benchmarks": "string",
    "sustainabilityScore": "number (1-10)"
  },
  "message": "Carbon footprint calculated successfully"
}
```

### Optimization Recommendations

#### GET /optimizations

Get AI-powered optimization recommendations.

**Query Parameters:**
- `calculationId` (optional): Specific calculation to optimize
- `optimizationType` (optional): Type of optimization (route|transport|consolidation|timing|all)

**Response:**
```json
{
  "optimizations": {
    "routeOptimization": [
      {
        "action": "string",
        "emissionReduction": "string",
        "difficulty": "Low|Medium|High",
        "costImpact": "Savings|Neutral|Cost",
        "timeline": "string",
        "description": "string"
      }
    ],
    "transportModeSwitch": [],
    "consolidation": [],
    "timing": [],
    "summary": {
      "totalPotentialReduction": "string",
      "quickWins": ["string"],
      "longTermGoals": ["string"]
    }
  },
  "generatedAt": "ISO 8601 timestamp",
  "message": "Optimization recommendations generated successfully"
}
```

### Certificate Generation

#### POST /certificate

Generate a blockchain-verified carbon certificate.

**Request Body:**
```json
{
  "calculationId": "uuid",
  "productInfo": {
    "name": "string",
    "sku": "string",
    "category": "string"
  },
  "companyInfo": {
    "name": "string",
    "address": "string",
    "contact": "string"
  }
}
```

**Response:**
```json
{
  "certificateId": "uuid",
  "certificate": {
    "version": "1.0",
    "standard": "GHG Protocol",
    "issuedAt": "ISO 8601 timestamp",
    "validUntil": "ISO 8601 timestamp",
    "company": {
      "name": "string",
      "address": "string",
      "contact": "string"
    },
    "product": {
      "name": "string",
      "sku": "string",
      "category": "string"
    },
    "carbonFootprint": {
      "totalEmissions": "number",
      "unit": "kg CO2e",
      "breakdown": {},
      "methodology": "IPCC Guidelines + EPA Emission Factors",
      "scope": "Scope 3 - Transportation and Distribution"
    },
    "supplyChain": {
      "origin": "string",
      "destination": "string",
      "transportMode": "string",
      "distance": "number",
      "weight": "number"
    },
    "verification": {
      "method": "Cryptographic Hash",
      "algorithm": "SHA-256",
      "timestamp": "ISO 8601 timestamp",
      "hash": "string",
      "signature": "string"
    }
  },
  "qrCodeUrl": "https://d246er5uqc4i0e.cloudfront.net/certificates/verify/{certificateId}",
  "message": "Carbon certificate generated successfully"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "timestamp": "ISO 8601 timestamp",
  "requestId": "uuid"
}
```

## Rate Limits

- **Document Processing**: 100 requests per hour per user
- **Carbon Calculation**: 200 requests per hour per user
- **Optimizations**: 50 requests per hour per user
- **Certificates**: 20 requests per hour per user

## Data Models

### Shipping Data
```json
{
  "origin": "string - Origin location",
  "destination": "string - Destination location",
  "transportMode": "string - Mode of transport",
  "weight": "number - Weight in kg",
  "distance": "number - Distance in km",
  "carrier": "string - Shipping carrier",
  "entities": "array - Extracted entities from document"
}
```

### Carbon Footprint
```json
{
  "totalEmissions": "number - Total CO2 emissions in kg",
  "breakdown": {
    "transport": "number - Transport emissions",
    "manufacturing": "number - Manufacturing emissions",
    "warehousing": "number - Warehousing emissions",
    "lastMile": "number - Last mile delivery emissions"
  },
  "metadata": {
    "transportMode": "string",
    "weight": "number",
    "distance": "number",
    "emissionFactor": "number",
    "origin": "string",
    "destination": "string"
  }
}
```

## Emission Factors

The API uses the following emission factors (kg CO2 per ton-km):

- **Truck**: 0.062
- **Rail**: 0.022
- **Ship/Ocean**: 0.008
- **Air**: 0.602
- **Ground/Freight**: 0.062 (default)

## SDK Examples

### JavaScript/Node.js

```javascript
import { API } from 'aws-amplify';

// Process document
const processDocument = async (fileData, fileName) => {
  try {
    const response = await API.post('carbonlens-api', '/process-document', {
      body: {
        documentUrl: `documents/${fileName}`,
        documentType: 'invoice',
        fileData: fileData,
        fileName: fileName,
        fileSize: fileData.length
      }
    });
    return response;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

// Calculate carbon footprint
const calculateCarbon = async (documentId, shippingData) => {
  try {
    const response = await API.post('carbonlens-api', '/calculate-carbon', {
      body: {
        documentId: documentId,
        shippingData: shippingData
      }
    });
    return response;
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    throw error;
  }
};
```

### Python

```python
import requests
import json

class CarbonLensAPI:
    def __init__(self, base_url, auth_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def process_document(self, file_data, file_name, document_type='invoice'):
        url = f'{self.base_url}/process-document'
        payload = {
            'documentUrl': f'documents/{file_name}',
            'documentType': document_type,
            'fileData': file_data,
            'fileName': file_name,
            'fileSize': len(file_data)
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()
    
    def calculate_carbon(self, document_id, shipping_data):
        url = f'{self.base_url}/calculate-carbon'
        payload = {
            'documentId': document_id,
            'shippingData': shipping_data
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        return response.json()
```

## Testing

Use the following test data for API testing:

### Sample Document Processing Request
```json
{
  "documentUrl": "documents/test-invoice.pdf",
  "documentType": "invoice",
  "fileData": "base64-encoded-content",
  "fileName": "test-invoice.pdf",
  "fileSize": 12345
}
```

### Sample Carbon Calculation Request
```json
{
  "documentId": "test-doc-id",
  "shippingData": {
    "origin": "New York, NY",
    "destination": "Los Angeles, CA",
    "transportMode": "truck",
    "weight": 1000,
    "distance": 4500
  }
}
```

## Changelog

### Version 1.0.0
- Initial API release
- Document processing endpoint
- Carbon calculation endpoint
- Optimization recommendations endpoint
- Certificate generation endpoint