import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'https://t95vjsi3kc.execute-api.us-east-1.amazonaws.com/prod';

// Test data for different endpoints
const testData = {
  processDocument: {
    documentType: 'invoice',
    testData: true
  },
  calculateCarbon: {
    transportMode: 'truck',
    distance: 100,
    weight: 1000,
    testData: true
  },
  generateCertificate: {
    calculationId: 'test-calculation-id',
    testData: true
  },
  getOptimizations: {
    calculationId: 'test-calculation-id',
    testData: true
  },
  seedTestData: {
    testData: true
  },
  migrateUserData: {
    testData: true
  }
};

export default function () {
  // Test dashboard endpoint (GET)
  const dashboardResponse = http.get(`${BASE_URL}/dashboard`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const dashboardCheck = check(dashboardResponse, {
    'dashboard status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!dashboardCheck);

  // Test optimizations endpoint (GET)
  const optimizationsResponse = http.get(`${BASE_URL}/optimizations`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const optimizationsCheck = check(optimizationsResponse, {
    'optimizations status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'optimizations response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!optimizationsCheck);

  // Test process document endpoint (POST)
  const processDocumentResponse = http.post(`${BASE_URL}/process-document`, 
    JSON.stringify(testData.processDocument), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const processDocumentCheck = check(processDocumentResponse, {
    'process-document status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
    'process-document response time < 5s': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!processDocumentCheck);

  // Test calculate carbon endpoint (POST)
  const calculateCarbonResponse = http.post(`${BASE_URL}/calculate-carbon`, 
    JSON.stringify(testData.calculateCarbon), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const calculateCarbonCheck = check(calculateCarbonResponse, {
    'calculate-carbon status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
    'calculate-carbon response time < 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!calculateCarbonCheck);

  // Test generate certificate endpoint (POST)
  const generateCertificateResponse = http.post(`${BASE_URL}/certificate`, 
    JSON.stringify(testData.generateCertificate), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const generateCertificateCheck = check(generateCertificateResponse, {
    'generate-certificate status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
    'generate-certificate response time < 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!generateCertificateCheck);

  // Test seed test data endpoint (POST) - less frequently
  if (Math.random() < 0.1) { // Only 10% of the time
    const seedTestDataResponse = http.post(`${BASE_URL}/seed-test-data`, 
      JSON.stringify(testData.seedTestData), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const seedTestDataCheck = check(seedTestDataResponse, {
      'seed-test-data status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
      'seed-test-data response time < 10s': (r) => r.timings.duration < 10000,
    });

    errorRate.add(!seedTestDataCheck);
  }

  // Test migrate user data endpoint (POST) - less frequently
  if (Math.random() < 0.05) { // Only 5% of the time
    const migrateUserDataResponse = http.post(`${BASE_URL}/migrate-user-data`, 
      JSON.stringify(testData.migrateUserData), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const migrateUserDataCheck = check(migrateUserDataResponse, {
      'migrate-user-data status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
      'migrate-user-data response time < 5s': (r) => r.timings.duration < 5000,
    });

    errorRate.add(!migrateUserDataCheck);
  }

  // Sleep between requests
  sleep(1);
}

export function handleSummary(data) {
  return {
    'api-performance-summary.json': JSON.stringify(data, null, 2),
  };
}