import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import CarbonAnalysis from '../CarbonAnalysis';

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
jest.mock('../CarbonAnalysis.css', () => ({}));

describe('CarbonAnalysis Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with title and description', () => {
    render(<CarbonAnalysis />);
    
    expect(screen.getByText('Carbon Footprint Analysis')).toBeInTheDocument();
    expect(screen.getByText('Detailed analysis of supply chain carbon emissions')).toBeInTheDocument();
    expect(screen.getByText('Recent Calculations')).toBeInTheDocument();
  });

  test('loads demo calculations when user is not authenticated', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
      expect(screen.getByText('Smartphone')).toBeInTheDocument();
      expect(screen.getByText('45.2 kg CO₂e')).toBeInTheDocument();
      expect(screen.getByText('12.8 kg CO₂e')).toBeInTheDocument();
    });
  });

  test('loads calculations from API when user is authenticated', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    const mockApiResponse = {
      calculations: [
        {
          id: 'calc-1',
          documentId: 'doc-1',
          productName: 'Test Product',
          totalEmissions: 25.5,
          breakdown: {
            transport: 20.0,
            manufacturing: 3.0,
            warehousing: 1.5,
            lastMile: 1.0
          },
          route: 'Test Route',
          transportMode: 'Test Mode',
          calculatedAt: '2024-01-01T10:00:00Z'
        }
      ]
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue(mockApiResponse);

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('25.5 kg CO₂e')).toBeInTheDocument();
      expect(screen.getByText('Test Route')).toBeInTheDocument();
      expect(screen.getByText('Test Mode')).toBeInTheDocument();
    });

    expect(API.get).toHaveBeenCalledWith('carbonlens-api', '/dashboard', {
      headers: {
        'x-user-email': 'test@example.com'
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

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
      expect(screen.getByText('Smartphone')).toBeInTheDocument();
    });
  });

  test('selects calculation when clicked', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop calculation
    fireEvent.click(screen.getByText('Laptop Computer'));

    // Check if detailed analysis is shown
    await waitFor(() => {
      expect(screen.getByText('Detailed Analysis: Laptop Computer')).toBeInTheDocument();
      expect(screen.getByText('45.2 kg CO₂e')).toBeInTheDocument();
      expect(screen.getByText('Total Carbon Footprint')).toBeInTheDocument();
    });
  });

  test('displays emissions breakdown for selected calculation', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop calculation
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(screen.getByText('Emissions Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing')).toBeInTheDocument();
      expect(screen.getByText('Warehousing')).toBeInTheDocument();
      expect(screen.getByText('Lastmile')).toBeInTheDocument();
    });
  });

  test('displays route information for selected calculation', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop calculation
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(screen.getByText('Route Information')).toBeInTheDocument();
      expect(screen.getByText('Shanghai → Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('Ocean + Truck')).toBeInTheDocument();
    });
  });

  test('shows no selection message when no calculation is selected', () => {
    render(<CarbonAnalysis />);

    expect(screen.getByText('Select a calculation to view details')).toBeInTheDocument();
    expect(screen.getByText('Choose a calculation from the list to see detailed carbon footprint analysis')).toBeInTheDocument();
  });

  test('auto-selects first calculation when available from API', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    const mockApiResponse = {
      calculations: [
        {
          id: 'calc-1',
          documentId: 'doc-1',
          productName: 'Auto Selected Product',
          totalEmissions: 30.0,
          breakdown: {
            transport: 25.0,
            manufacturing: 3.0,
            warehousing: 1.0,
            lastMile: 1.0
          },
          route: 'Auto Route',
          transportMode: 'Auto Mode',
          calculatedAt: '2024-01-01T10:00:00Z'
        }
      ]
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue(mockApiResponse);

    render(<CarbonAnalysis />);

    await waitFor(() => {
      expect(screen.getByText('Detailed Analysis: Auto Selected Product')).toBeInTheDocument();
    });
  });
});