import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import Dashboard from '../Dashboard';

// Mock API responses
jest.mock('aws-amplify');
const mockAPI = API;
const mockAuth = Auth;

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Auth.currentAuthenticatedUser to return a user
    mockAuth.currentAuthenticatedUser.mockResolvedValue({
      attributes: { email: 'test@example.com' }
    });
  });

  test('renders dashboard with loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading your carbon footprint data/i)).toBeInTheDocument();
  });

  test('displays metrics after data loads', async () => {
    const mockDashboardData = {
      totalEmissions: 1250.5,
      documentsProcessed: 15,
      optimizationsSuggested: 8,
      certificatesGenerated: 3,
      emissionsTrend: [
        { month: 'Jan', emissions: 1200 },
        { month: 'Feb', emissions: 1100 },
        { month: 'Mar', emissions: 1250 }
      ],
      emissionsByMode: [
        { name: 'Truck', value: 45, emissions: 562.5 },
        { name: 'Air', value: 30, emissions: 375 },
        { name: 'Ocean', value: 25, emissions: 312.5 }
      ],
      recentActivities: [],
      previousMonth: { documents: { current: 15, previous: 10 }, calculations: { current: 8, previous: 5 } },
      lastUpdated: new Date().toISOString(),
      userEmail: 'test@example.com',
      userType: 'real'
    };

    mockAPI.get.mockResolvedValueOnce(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250.5 kg CO₂e')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockAPI.get.mockRejectedValueOnce(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data: API Error/i)).toBeInTheDocument();
    });
  });

  test('refreshes data when refresh button clicked', async () => {
    const mockDashboardData = { 
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizationsSuggested: 5,
      certificatesGenerated: 2,
      emissionsTrend: [],
      emissionsByMode: [],
      recentActivities: [],
      previousMonth: { documents: { current: 10, previous: 8 }, calculations: { current: 5, previous: 3 } },
      lastUpdated: new Date().toISOString(),
      userEmail: 'test@example.com',
      userType: 'real'
    };
    
    mockAPI.get.mockResolvedValue(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000 kg CO₂e')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh data/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockAPI.get).toHaveBeenCalledTimes(2);
    });
  });

  test('displays correct emission trend chart when data available', async () => {
    const mockDashboardData = {
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizationsSuggested: 5,
      certificatesGenerated: 2,
      emissionsTrend: [
        { month: 'Jan', emissions: 1200 },
        { month: 'Feb', emissions: 1100 },
        { month: 'Mar', emissions: 1000 }
      ],
      emissionsByMode: [],
      recentActivities: [],
      previousMonth: { documents: { current: 10, previous: 8 }, calculations: { current: 5, previous: 3 } },
      lastUpdated: new Date().toISOString(),
      userEmail: 'test@example.com',
      userType: 'real'
    };

    mockAPI.get.mockResolvedValueOnce(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Emissions Trend (Last 6 Months)')).toBeInTheDocument();
      // When data is available, charts should render
      const chartContainer = screen.getByText('Emissions Trend (Last 6 Months)').closest('.chart-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  test('displays emissions by transport mode chart when data available', async () => {
    const mockDashboardData = {
      totalEmissions: 1000,
      documentsProcessed: 10,
      optimizationsSuggested: 5,
      certificatesGenerated: 2,
      emissionsTrend: [],
      emissionsByMode: [
        { name: 'Truck', value: 45, emissions: 450 },
        { name: 'Air', value: 30, emissions: 300 },
        { name: 'Ocean', value: 25, emissions: 250 }
      ],
      recentActivities: [],
      previousMonth: { documents: { current: 10, previous: 8 }, calculations: { current: 5, previous: 3 } },
      lastUpdated: new Date().toISOString(),
      userEmail: 'test@example.com',
      userType: 'real'
    };

    mockAPI.get.mockResolvedValueOnce(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Emissions by Transport Mode')).toBeInTheDocument();
      // When data is available, charts should render
      const chartContainer = screen.getByText('Emissions by Transport Mode').closest('.chart-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  test('shows no data message when no emissions data available', async () => {
    const mockDashboardData = {
      totalEmissions: 0,
      documentsProcessed: 0,
      optimizationsSuggested: 0,
      certificatesGenerated: 0,
      emissionsTrend: [],
      emissionsByMode: [],
      recentActivities: [],
      previousMonth: { documents: { current: 0, previous: 0 }, calculations: { current: 0, previous: 0 } },
      lastUpdated: new Date().toISOString(),
      userEmail: 'test@example.com',
      userType: 'real'
    };

    mockAPI.get.mockResolvedValueOnce(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no emissions data available yet/i)).toBeInTheDocument();
      expect(screen.getByText(/no transport mode data available yet/i)).toBeInTheDocument();
    });
  });

  test('handles unauthenticated user gracefully', async () => {
    mockAuth.currentAuthenticatedUser.mockRejectedValueOnce(new Error('Not authenticated'));
    
    const mockDashboardData = {
      totalEmissions: 0,
      documentsProcessed: 0,
      optimizationsSuggested: 0,
      certificatesGenerated: 0,
      emissionsTrend: [],
      emissionsByMode: [],
      recentActivities: [],
      previousMonth: { documents: { current: 0, previous: 0 }, calculations: { current: 0, previous: 0 } },
      lastUpdated: new Date().toISOString(),
      userEmail: null,
      userType: 'demo'
    };

    mockAPI.get.mockResolvedValueOnce(mockDashboardData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/current user/i)).toBeInTheDocument();
    });
  });
});