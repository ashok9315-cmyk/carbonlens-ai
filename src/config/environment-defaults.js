// Default environment configurations for CarbonLens AI
// These are safe placeholder values - real values come from environment variables

export const environmentDefaults = {
  dev: {
    name: 'Development',
    domain: 'dev-carbonlens-ai.solutionsynth.cloud',
    cloudfront: 'placeholder-dev.cloudfront.net',
    api: {
      baseUrl: 'https://placeholder-dev-api.execute-api.us-east-1.amazonaws.com/dev',
      region: 'us-east-1'
    },
    auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_PLACEHOLDER_DEV',
      userPoolClientId: 'placeholder-dev-client-id'
    },
    features: {
      debugMode: true,
      mockData: true,
      analytics: false,
      showEnvironmentBanner: true
    }
  },
  staging: {
    name: 'Staging',
    domain: 'staging-carbonlens-ai.solutionsynth.cloud',
    cloudfront: 'placeholder-staging.cloudfront.net',
    api: {
      baseUrl: 'https://placeholder-staging-api.execute-api.us-east-1.amazonaws.com/staging',
      region: 'us-east-1'
    },
    auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_PLACEHOLDER_STAGING',
      userPoolClientId: 'placeholder-staging-client-id'
    },
    features: {
      debugMode: false,
      mockData: false,
      analytics: true,
      showEnvironmentBanner: true
    }
  },
  prod: {
    name: 'Production',
    domain: 'carbonlens-ai.solutionsynth.cloud',
    cloudfront: 'placeholder-prod.cloudfront.net',
    api: {
      baseUrl: 'https://placeholder-prod-api.execute-api.us-east-1.amazonaws.com/prod',
      region: 'us-east-1'
    },
    auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_PLACEHOLDER_PROD',
      userPoolClientId: 'placeholder-prod-client-id'
    },
    features: {
      debugMode: false,
      mockData: false,
      analytics: true,
      showEnvironmentBanner: false
    }
  }
};

// Environment detection logic
export const detectEnvironment = () => {
  // Check environment variables first (from .env files or build process)
  if (process.env.REACT_APP_ENVIRONMENT) {
    return process.env.REACT_APP_ENVIRONMENT;
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return 'dev';
  }
  
  // Check hostname if in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Development domains
    if (hostname.includes('dev-carbonlens-ai') || 
        hostname === 'localhost' ||
        hostname === '127.0.0.1') {
      return 'dev';
    }
    
    // Staging domains
    if (hostname.includes('staging-carbonlens-ai') || 
        hostname.includes('staging')) {
      return 'staging';
    }
    
    // Production domains
    if (hostname.includes('carbonlens-ai.solutionsynth.cloud')) {
      return 'prod';
    }
    
    // CloudFront domains - detect by pattern rather than hardcoded values
    if (hostname.includes('.cloudfront.net')) {
      // Default to dev for unknown CloudFront domains during development
      return 'dev';
    }
  }
  
  // Default to production
  return 'prod';
};

// Get current environment configuration with environment variable overrides
export const getCurrentEnvironment = () => {
  const envName = detectEnvironment();
  const defaults = environmentDefaults[envName];
  
  // Override with environment variables if available
  const config = {
    ...defaults,
    auth: {
      ...defaults.auth,
      userPoolId: process.env.REACT_APP_USER_POOL_ID || defaults.auth.userPoolId,
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || defaults.auth.userPoolClientId,
    },
    api: {
      ...defaults.api,
      baseUrl: process.env.REACT_APP_API_URL || defaults.api.baseUrl,
    },
    cloudfront: process.env.REACT_APP_CLOUDFRONT_DOMAIN || defaults.cloudfront,
    features: {
      ...defaults.features,
      debugMode: process.env.REACT_APP_DEBUG_MODE === 'true' || defaults.features.debugMode,
      mockData: process.env.REACT_APP_MOCK_DATA === 'true' || defaults.features.mockData,
      analytics: process.env.REACT_APP_ANALYTICS === 'true' || defaults.features.analytics,
      showEnvironmentBanner: process.env.REACT_APP_SHOW_ENV_BANNER === 'true' || defaults.features.showEnvironmentBanner,
    }
  };
  
  return {
    name: envName,
    config: config,
    isProduction: envName === 'prod',
    isDevelopment: envName === 'dev',
    isStaging: envName === 'staging'
  };
};