import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { API, Auth } from 'aws-amplify';
import QRCode from 'qrcode';
import Certificates from '../Certificates';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  API: {
    get: jest.fn(),
    post: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

// Mock CSS imports
jest.mock('../Certificates.css', () => ({}));

describe('Certificates Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with title and description', () => {
    render(<Certificates />);
    
    expect(screen.getByText('Carbon Certificates')).toBeInTheDocument();
    expect(screen.getByText('Blockchain-verified carbon footprint certificates for transparency and compliance')).toBeInTheDocument();
    expect(screen.getByText('Generate New Certificate')).toBeInTheDocument();
    expect(screen.getByText('Your Certificates')).toBeInTheDocument();
  });

  test('loads demo certificates when user is not authenticated', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
      expect(screen.getByText('Smartphone')).toBeInTheDocument();
      expect(screen.getByText('EcoTech Solutions')).toBeInTheDocument();
      expect(screen.getByText('Mobile Innovations Inc')).toBeInTheDocument();
    });
  });

  test('loads certificates from API when user is authenticated', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    const mockApiResponse = {
      certificates: [
        {
          id: 'cert-test-1',
          version: '1.0',
          standard: 'GHG Protocol',
          issuedAt: '2024-01-01T10:00:00Z',
          validUntil: '2025-01-01T10:00:00Z',
          company: {
            name: 'Test Company',
            address: 'Test Address',
            contact: 'test@company.com'
          },
          product: {
            name: 'Test Product',
            sku: 'TEST-001',
            category: 'Test Category'
          },
          carbonFootprint: {
            totalEmissions: 15.5,
            unit: 'kg CO2e',
            breakdown: {
              transport: 10.0,
              manufacturing: 3.0,
              warehousing: 1.5,
              lastMile: 1.0
            },
            methodology: 'Test Methodology',
            scope: 'Test Scope'
          },
          supplyChain: {
            origin: 'Test Origin',
            destination: 'Test Destination',
            transportMode: 'Test Mode',
            distance: 1000,
            weight: 1.0
          },
          verification: {
            method: 'Test Method',
            algorithm: 'SHA-256',
            timestamp: '2024-01-01T10:00:00Z',
            hash: 'testhash123',
            signature: 'testsig123'
          }
        }
      ]
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue(mockApiResponse);

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('15.5 kg CO2e')).toBeInTheDocument();
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

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
      expect(screen.getByText('Smartphone')).toBeInTheDocument();
    });
  });

  test('selects certificate when clicked and displays details', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockqrcode');

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop certificate
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(screen.getByText('Carbon Footprint Certificate')).toBeInTheDocument();
      expect(screen.getByText('✓ Verified')).toBeInTheDocument();
      expect(screen.getByText('GHG Protocol')).toBeInTheDocument();
      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText('Product Information')).toBeInTheDocument();
      expect(screen.getByText('Carbon Footprint')).toBeInTheDocument();
      expect(screen.getByText('Supply Chain')).toBeInTheDocument();
      expect(screen.getByText('Verification')).toBeInTheDocument();
    });
  });

  test('generates QR code when certificate is selected', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockqrcode');

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop certificate
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://carbonlens-ai.solutionsynth.cloud/certificates/verify/cert-001',
        expect.any(Object)
      );
    });
  });

  test('handles QR code generation error gracefully', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));
    QRCode.toDataURL.mockRejectedValue(new Error('QR Code Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop certificate
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error generating QR code:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  test('generates new certificate when authenticated user clicks generate button', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue({ certificates: [] });
    API.post.mockResolvedValue({ certificateId: 'new-cert-123' });

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Generate New Certificate')).toBeInTheDocument();
    });

    // Click generate button
    fireEvent.click(screen.getByText('Generate New Certificate'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('carbonlens-api', '/certificate', {
        headers: {
          'x-user-email': 'test@example.com'
        },
        body: {
          calculationId: 'latest',
          productInfo: { 
            name: 'New Product', 
            sku: 'NP-001', 
            category: 'General' 
          },
          companyInfo: { 
            name: 'Your Company', 
            address: 'Your Address', 
            contact: 'test@example.com' 
          }
        }
      });
    });
  });

  test('handles certificate generation error', async () => {
    const mockUser = {
      attributes: {
        email: 'test@example.com'
      }
    };

    Auth.currentAuthenticatedUser.mockResolvedValue(mockUser);
    API.get.mockResolvedValue({ certificates: [] });
    API.post.mockRejectedValue(new Error('Generation failed'));

    // Mock alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Generate New Certificate')).toBeInTheDocument();
    });

    // Click generate button
    fireEvent.click(screen.getByText('Generate New Certificate'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to generate certificate. Please try again.');
    });

    alertSpy.mockRestore();
  });

  test('downloads certificate when download button is clicked', async () => {
    Auth.currentAuthenticatedUser.mockRejectedValue(new Error('Not authenticated'));
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,mockqrcode');

    // Mock URL.createObjectURL and document methods
    const mockCreateObjectURL = jest.fn(() => 'mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };

    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    render(<Certificates />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Computer')).toBeInTheDocument();
    });

    // Click on the laptop certificate
    fireEvent.click(screen.getByText('Laptop Computer'));

    await waitFor(() => {
      expect(screen.getByText('Download Certificate')).toBeInTheDocument();
    });

    // Click download button
    fireEvent.click(screen.getByText('Download Certificate'));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  test('shows no selection message when no certificate is selected', () => {
    render(<Certificates />);

    expect(screen.getByText('Select a certificate to view details')).toBeInTheDocument();
    expect(screen.getByText('Choose a certificate from the list to see the full verification document')).toBeInTheDocument();
  });
});