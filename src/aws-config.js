import { getCurrentEnvironment } from './config/environment-defaults.js';

// Get current environment configuration
const { name: currentEnv, config: envConfig } = getCurrentEnvironment();

// Create AWS configuration based on current environment
export const awsConfig = {
  Auth: {
    region: envConfig.auth.region,
    userPoolId: envConfig.auth.userPoolId,
    userPoolWebClientId: envConfig.auth.userPoolClientId,
  },
  API: {
    endpoints: [
      {
        name: 'carbonlens-api',
        endpoint: envConfig.api.baseUrl,
        region: envConfig.api.region
      }
    ]
  }
};

// Export environment information for debugging and feature flags
export const environmentInfo = {
  current: currentEnv,
  config: envConfig,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  nodeEnv: process.env.NODE_ENV,
  isProduction: currentEnv === 'prod',
  isDevelopment: currentEnv === 'dev',
  isStaging: currentEnv === 'staging'
};

// Feature flags based on environment
export const featureFlags = {
  debugMode: envConfig.features.debugMode,
  mockData: envConfig.features.mockData,
  analytics: envConfig.features.analytics,
  showEnvironmentBanner: envConfig.features.showEnvironmentBanner
};

// Console logging for non-production environments
if (currentEnv !== 'prod') {
  console.log('🌐 CarbonLens AI Environment:', {
    environment: currentEnv,
    domain: envConfig.domain,
    apiEndpoint: awsConfig.API.endpoints[0].endpoint,
    userPoolId: awsConfig.Auth.userPoolId,
    features: featureFlags
  });
}
