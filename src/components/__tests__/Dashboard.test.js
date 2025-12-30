import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { API } from 'aws-amplify';
import Dashboard from '../Dashboard';

// Mock API responses
jest.mock('aws-amplify');
const mockAPI = API;

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('displays metrics after data loads', async () => {
    const mockMetrics = {
      totalEmissions: 1250.5,
      documentsProcessed: 15,
      optimizations: 8,
      certificates: 3,
      emissionsTrend: [
        { month: 'Jan', emissions: 1200 },
        { month: 'Feb', emissions: 1100 },
        { month: 'Mar', emissions: 1250 }
      ],
      emissionsByMode: [
        { name: 'Truck', value: 45, emissions: 562.5 },
        { name: 'Air', value: 30, emissions: 375 },
        { name: 'Ocean', value: 25, emissions: 312.5 }
      ]
    };

    mockAPI.get.mockResolvedValueOnce({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250.5')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    // Check if charts are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    mockAPI.get.mockRejectedValueOnce(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button clicked', async () => {
    const mockMetrics = { 
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizations: 5,
      certificates: 2,
      emissionsTrend: [],
      emissionsByMode: []
    };
    
    mockAPI.get.mockResolvedValue({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockAPI.get).toHaveBeenCalledTimes(2);
    });
  });

  test('displays correct emission trend chart', async () => {
    const mockMetrics = {
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizations: 5,
      certificates: 2,
      emissionsTrend: [
        { month: 'Jan', emissions: 1200 },
        { month: 'Feb', emissions: 1100 },
        { month: 'Mar', emissions: 1000 }
      ],
      emissionsByMode: []
    };

    mockAPI.get.mockResolvedValueOnce({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByText('Emissions Trend')).toBeInTheDocument();
    });
  });

  test('displays emissions by transport mode chart', async () => {
    const mockMetrics = {
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizations: 5,
      certificates: 2,
      emissionsTrend: [],
      emissionsByMode: [
        { name: 'Truck', value: 45, emissions: 450 },
        { name: 'Air', value: 30, emissions: 300 },
        { name: 'Ocean', value: 25, emissions: 250 }
      ]
    };

    mockAPI.get.mockResolvedValueOnce({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByText('Emissions by Transport Mode')).toBeInTheDocument();
    });
  });
});