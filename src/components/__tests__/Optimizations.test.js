import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import Optimizations from '../Optimizations';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

// Mock CSS imports
jest.mock('../Optimizations.css', () => ({}));

describe('Optimizations Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with title and description', () => {
    render(<Optimizations />);
    
    expect(screen.getByText('Carbon Optimization Recommendations')).toBeInTheDocument();
    expect(screen.getByText('AI-powered suggestions to reduce your supply chain carbon footprint')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    render(<Optimizations />);
    
    expect(screen.getByText('Generating optimization recommendations...')).toBeInTheDocument();
  });

  test('loads demo optimizations when user is not authenticated', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('25-40%')).toBeInTheDocument();
      expect(screen.getByText('Total Potential Reduction')).toBeInTheDocument();
      expect(screen.getByText('Quick Wins')).toBeInTheDocument();
      expect(screen.getByText('Long-term Goals')).toBeInTheDocument();
    });
  });

  test('loads optimizations from API when user is authenticated', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    const mockApiResponse = {
      optimizations: {
        routeOptimization: [
          {
            action: 'Test route optimization',
            emissionReduction: '20-30%',
            difficulty: 'Low',
            costImpact: 'Savings',
            timeline: '2 weeks',
            description: 'Test description for route optimization'
          }
        ],
        transportModeSwitch: [
          {
            action: 'Test transport mode switch',
            emissionReduction: '50-60%',
            difficulty: 'Medium',
            costImpact: 'Neutral',
            timeline: '4 weeks',
            description: 'Test description for transport mode switch'
          }
        ],
        summary: {
          totalPotentialReduction: '30-50%',
          quickWins: ['Test quick win 1', 'Test quick win 2'],
          longTermGoals: ['Test long term goal 1', 'Test long term goal 2']
        }
      }
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue(mockApiResponse);

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('30-50%')).toBeInTheDocument();
      expect(screen.getByText('Test route optimization')).toBeInTheDocument();
      expect(screen.getByText('Test transport mode switch')).toBeInTheDocument();
    });

    expect(API.get).toHaveBeenCalledWith('carbonlens-api', '/optimizations', {
      headers: {
        'x-user-email': 'test@example.com'
      },
      queryStringParameters: {
        optimizationType: 'all'
      }
    });
  });

  test('falls back to demo data when API call fails', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockRejectedValue(new Error('API Error'));

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('25-40%')).toBeInTheDocument();
      expect(screen.getByText('Consolidate shipments')).toBeInTheDocument();
      expect(screen.getByText('Switch to ocean freight')).toBeInTheDocument();
    });
  });

  test('displays optimization summary correctly', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('25-40%')).toBeInTheDocument();
      expect(screen.getByText('Total Potential Reduction')).toBeInTheDocument();
      
      // Check quick wins
      expect(screen.getByText('Consolidate shipments')).toBeInTheDocument();
      expect(screen.getByText('Switch to ocean freight')).toBeInTheDocument();
      expect(screen.getByText('Optimize delivery timing')).toBeInTheDocument();
      
      // Check long-term goals
      expect(screen.getByText('Implement AI route optimization')).toBeInTheDocument();
      expect(screen.getByText('Establish rail transport partnerships')).toBeInTheDocument();
      expect(screen.getByText('Develop sustainable supplier network')).toBeInTheDocument();
    });
  });

  test('filters optimizations by category', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('All Recommendations')).toBeInTheDocument();
    });

    // Click on Route Optimization filter
    fireEvent.click(screen.getByText('Route Optimization'));

    // Should still show route optimization recommendations
    expect(screen.getByText('Optimize delivery routes using AI-powered route planning')).toBeInTheDocument();
    expect(screen.getByText('Consolidate shipments to reduce number of trips')).toBeInTheDocument();
  });

  test('displays recommendation cards with correct information', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      // Check first recommendation
      expect(screen.getByText('Optimize delivery routes using AI-powered route planning')).toBeInTheDocument();
      expect(screen.getByText('15-25% reduction')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
      expect(screen.getByText('2-4 weeks')).toBeInTheDocument();
    });
  });

  test('shows different difficulty colors', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      // Check that difficulty levels are displayed
      const lowDifficulty = screen.getAllByText('Low');
      const mediumDifficulty = screen.getAllByText('Medium');
      const highDifficulty = screen.getAllByText('High');
      
      expect(lowDifficulty.length).toBeGreaterThan(0);
      expect(mediumDifficulty.length).toBeGreaterThan(0);
      expect(highDifficulty.length).toBeGreaterThan(0);
    });
  });

  test('shows different cost impact indicators', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      // Check that cost impact levels are displayed
      const savings = screen.getAllByText('Savings');
      const neutral = screen.getAllByText('Neutral');
      const cost = screen.getAllByText('Cost');
      
      expect(savings.length).toBeGreaterThan(0);
      expect(neutral.length).toBeGreaterThan(0);
      expect(cost.length).toBeGreaterThan(0);
    });
  });

  test('filters work correctly for all categories', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Optimizations />);

    await waitFor(() => {
      expect(screen.getByText('All Recommendations')).toBeInTheDocument();
    });

    // Test Transport Mode filter
    fireEvent.click(screen.getByText('Transport Mode'));
    expect(screen.getByText('Switch from air freight to ocean freight for non-urgent shipments')).toBeInTheDocument();

    // Test Consolidation filter
    fireEvent.click(screen.getByText('Consolidation'));
    expect(screen.getByText('Implement cross-docking to reduce warehouse storage time')).toBeInTheDocument();

    // Test Timing filter
    fireEvent.click(screen.getByText('Timing'));
    expect(screen.getByText('Schedule shipments during off-peak hours to avoid traffic congestion')).toBeInTheDocument();

    // Test back to All Recommendations
    fireEvent.click(screen.getByText('All Recommendations'));
    expect(screen.getByText('Optimize delivery routes using AI-powered route planning')).toBeInTheDocument();
  });

  test('handles empty optimizations data gracefully', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue({ optimizations: null });

    render(<Optimizations />);

    await waitFor(() => {
      // Should fall back to demo data
      expect(screen.getByText('25-40%')).toBeInTheDocument();
    });
  });
});