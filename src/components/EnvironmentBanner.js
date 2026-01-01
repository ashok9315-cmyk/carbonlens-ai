import React from 'react';
import { environmentInfo, featureFlags } from '../aws-config';

const EnvironmentBanner = () => {
  // Don't show banner in production
  if (!featureFlags.showEnvironmentBanner) {
    return null;
  }

  const getBannerColor = () => {
    switch (environmentInfo.current) {
      case 'dev':
        return 'bg-blue-600';
      case 'staging':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getEnvironmentIcon = () => {
    switch (environmentInfo.current) {
      case 'dev':
        return '🔧';
      case 'staging':
        return '🧪';
      default:
        return '🚀';
    }
  };

  return (
    <div className={`${getBannerColor()} text-white px-4 py-2 text-sm text-center`}>
      <div className="flex items-center justify-center space-x-2">
        <span>{getEnvironmentIcon()}</span>
        <span className="font-medium">
          {environmentInfo.config.name} Environment
        </span>
        <span>•</span>
        <span className="opacity-75">
          {environmentInfo.config.domain}
        </span>
        {featureFlags.debugMode && (
          <>
            <span>•</span>
            <span className="opacity-75">Debug Mode</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EnvironmentBanner;