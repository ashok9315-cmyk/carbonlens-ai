import React from 'react';
import { render, screen } from '@testing-library/react';
import EnvironmentBanner from '../EnvironmentBanner';

// Mock aws-config
jest.mock('../../aws-config', () => ({
  environmentInfo: {
    current: 'dev',
    config: {
      name: 'Development',
      domain: 'dev-carbonlens-ai.solutionsynth.cloud'
    }
  },
  featureFlags: {
    showEnvironmentBanner: true,
    debugMode: false
  }
}));

describe('EnvironmentBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders development environment banner', () => {
    render(<EnvironmentBanner />);
    
    expect(screen.getByText('🔧')).toBeInTheDocument();
    expect(screen.getByText('Development Environment')).toBeInTheDocument();
    expect(screen.getByText('dev-carbonlens-ai.solutionsynth.cloud')).toBeInTheDocument();
  });

  test('shows debug mode when enabled', () => {
    // Mock with debug mode enabled
    jest.doMock('../../aws-config', () => ({
      environmentInfo: {
        current: 'dev',
        config: {
          name: 'Development',
          domain: 'dev-carbonlens-ai.solutionsynth.cloud'
        }
      },
      featureFlags: {
        showEnvironmentBanner: true,
        debugMode: true
      }
    }));

    // Re-import component to get updated mock
    const EnvironmentBannerWithDebug = require('../EnvironmentBanner').default;
    render(<EnvironmentBannerWithDebug />);
    
    expect(screen.getByText('Debug Mode')).toBeInTheDocument();
  });

  test('renders staging environment banner', () => {
    // Mock staging environment
    jest.doMock('../../aws-config', () => ({
      environmentInfo: {
        current: 'staging',
        config: {
          name: 'Staging',
          domain: 'staging-carbonlens-ai.solutionsynth.cloud'
        }
      },
      featureFlags: {
        showEnvironmentBanner: true,
        debugMode: false
      }
    }));

    const EnvironmentBannerStaging = require('../EnvironmentBanner').default;
    render(<EnvironmentBannerStaging />);
    
    expect(screen.getByText('🧪')).toBeInTheDocument();
    expect(screen.getByText('Staging Environment')).toBeInTheDocument();
  });

  test('renders production environment banner', () => {
    // Mock production environment
    jest.doMock('../../aws-config', () => ({
      environmentInfo: {
        current: 'prod',
        config: {
          name: 'Production',
          domain: 'carbonlens-ai.solutionsynth.cloud'
        }
      },
      featureFlags: {
        showEnvironmentBanner: true,
        debugMode: false
      }
    }));

    const EnvironmentBannerProd = require('../EnvironmentBanner').default;
    render(<EnvironmentBannerProd />);
    
    expect(screen.getByText('🚀')).toBeInTheDocument();
    expect(screen.getByText('Production Environment')).toBeInTheDocument();
  });

  test('does not render when showEnvironmentBanner is false', () => {
    // Mock with banner disabled
    jest.doMock('../../aws-config', () => ({
      environmentInfo: {
        current: 'dev',
        config: {
          name: 'Development',
          domain: 'dev-carbonlens-ai.solutionsynth.cloud'
        }
      },
      featureFlags: {
        showEnvironmentBanner: false,
        debugMode: false
      }
    }));

    const EnvironmentBannerHidden = require('../EnvironmentBanner').default;
    const { container } = render(<EnvironmentBannerHidden />);
    
    expect(container.firstChild).toBeNull();
  });

  test('applies correct CSS classes for development', () => {
    const { container } = render(<EnvironmentBanner />);
    
    const banner = container.firstChild;
    expect(banner).toHaveClass('bg-blue-600');
    expect(banner).toHaveClass('text-white');
    expect(banner).toHaveClass('px-4');
    expect(banner).toHaveClass('py-2');
    expect(banner).toHaveClass('text-sm');
    expect(banner).toHaveClass('text-center');
  });

  test('renders with correct structure', () => {
    render(<EnvironmentBanner />);
    
    // Check for the flex container
    const flexContainer = screen.getByText('Development Environment').closest('div');
    expect(flexContainer).toHaveClass('flex');
    expect(flexContainer).toHaveClass('items-center');
    expect(flexContainer).toHaveClass('justify-center');
    expect(flexContainer).toHaveClass('space-x-2');
  });

  test('handles unknown environment gracefully', () => {
    // Mock unknown environment
    jest.doMock('../../aws-config', () => ({
      environmentInfo: {
        current: 'unknown',
        config: {
          name: 'Unknown',
          domain: 'unknown.example.com'
        }
      },
      featureFlags: {
        showEnvironmentBanner: true,
        debugMode: false
      }
    }));

    const EnvironmentBannerUnknown = require('../EnvironmentBanner').default;
    render(<EnvironmentBannerUnknown />);
    
    expect(screen.getByText('🚀')).toBeInTheDocument(); // Default icon
    expect(screen.getByText('Unknown Environment')).toBeInTheDocument();
  });
});