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

const BASE_URL = __ENV.API_BASE_URL || 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev';

export default function () {
  // Test dashboard endpoint
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

  // Test optimizations endpoint
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
  const processDocumentPayload = JSON.stringify({
    documentType: 'invoice',
    testData: true
  });

  const processDocumentResponse = http.post(`${BASE_URL}/process-document`, processDocumentPayload, {
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
  const calculateCarbonPayload = JSON.stringify({
    transportMode: 'truck',
    distance: 100,
    weight: 1000
  });

  const calculateCarbonResponse = http.post(`${BASE_URL}/calculate-carbon`, calculateCarbonPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const calculateCarbonCheck = check(calculateCarbonResponse, {
    'calculate-carbon status is 200, 400, or 403': (r) => [200, 400, 403].includes(r.status),
    'calculate-carbon response time < 3s': (r) => r.timings.duration < 3000,
  });

  errorRate.add(!calculateCarbonCheck);

  // Sleep between requests
  sleep(1);
}

export function handleSummary(data) {
  return {
    'api-performance-summary.json': JSON.stringify(data, null, 2),
  };
}