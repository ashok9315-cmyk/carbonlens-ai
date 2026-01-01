import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { API } from 'aws-amplify';
import DocumentUpload from '../DocumentUpload';

jest.mock('aws-amplify');
const mockAPI = API;

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area', () => {
    render(<DocumentUpload />);
    
    expect(screen.getByText(/drag & drop your documents here/i)).toBeInTheDocument();
    expect(screen.getByText(/or browse files/i)).toBeInTheDocument();
  });

  test('accepts file drop', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    const fileInput = screen.getByLabelText(/browse files/i);
    await user.upload(fileInput, file);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  test('validates file type - accepts PDF', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const validFile = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, validFile);

    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
  });

  test('validates file type - accepts PNG', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const validFile = new File(['png content'], 'document.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, validFile);

    expect(screen.getByText('document.png')).toBeInTheDocument();
    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
  });

  test('validates file type - rejects invalid types', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, invalidFile);

    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  test('validates file size - rejects files over 10MB', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);

    // Create a large file (over 10MB)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
    
    // Mock the file size
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });
    
    const fileInput = screen.getByLabelText(/browse files/i);
    await user.upload(fileInput, largeFile);

    expect(screen.getByText(/file size too large/i)).toBeInTheDocument();
  });

  test('processes document successfully', async () => {
    mockAPI.post.mockResolvedValueOnce({
      data: {
        extractedData: {
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 1000,
          transportMode: 'truck',
          distance: 2445
        },
        confidence: {
          overall: 0.95,
          origin: 0.98,
          destination: 0.97,
          weight: 0.92
        },
        processingTime: 15.2
      }
    });

    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, file);
    
    const processButton = screen.getByRole('button', { name: /process document/i });
    fireEvent.click(processButton);

    // Check loading state
    expect(screen.getByText(/processing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('New York, NY')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles, CA')).toBeInTheDocument();
      expect(screen.getByText('1,000 kg')).toBeInTheDocument();
      expect(screen.getByText('truck')).toBeInTheDocument();
    });

    // Check confidence scores
    expect(screen.getByText('95%')).toBeInTheDocument(); // Overall confidence
  });

  test('handles document processing error', async () => {
    mockAPI.post.mockRejectedValueOnce(new Error('Processing failed'));

    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, file);
    
    const processButton = screen.getByRole('button', { name: /process document/i });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
    });
  });

  test('allows editing extracted data', async () => {
    mockAPI.post.mockResolvedValueOnce({
      data: {
        extractedData: {
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 1000,
          transportMode: 'truck'
        },
        confidence: { overall: 0.95 }
      }
    });

    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, file);
    
    const processButton = screen.getByRole('button', { name: /process document/i });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('New York, NY')).toBeInTheDocument();
    });

    // Edit the origin
    const originInput = screen.getByDisplayValue('New York, NY');
    await user.clear(originInput);
    await user.type(originInput, 'Boston, MA');

    expect(screen.getByDisplayValue('Boston, MA')).toBeInTheDocument();
  });

  test('proceeds to carbon calculation', async () => {
    mockAPI.post.mockResolvedValueOnce({
      data: {
        extractedData: {
          origin: 'New York, NY',
          destination: 'Los Angeles, CA',
          weight: 1000,
          transportMode: 'truck'
        },
        confidence: { overall: 0.95 }
      }
    });

    const mockOnProceed = jest.fn();
    
    const user = userEvent.setup();
    render(<DocumentUpload onProceed={mockOnProceed} />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, file);
    
    const processButton = screen.getByRole('button', { name: /process document/i });
    fireEvent.click(processButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /calculate carbon footprint/i })).toBeInTheDocument();
    });

    const proceedButton = screen.getByRole('button', { name: /calculate carbon footprint/i });
    fireEvent.click(proceedButton);

    expect(mockOnProceed).toHaveBeenCalledWith({
      origin: 'New York, NY',
      destination: 'Los Angeles, CA',
      weight: 1000,
      transportMode: 'truck'
    });
  });

  test('displays processing progress', async () => {
    // Mock a delayed response
    mockAPI.post.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: {
            extractedData: { origin: 'Test', destination: 'Test' },
            confidence: { overall: 0.9 }
          }
        }), 100)
      )
    );

    const user = userEvent.setup();
    render(<DocumentUpload />);

    const file = new File(['pdf content'], 'invoice.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/browse files/i);

    await user.upload(fileInput, file);
    
    const processButton = screen.getByRole('button', { name: /process document/i });
    fireEvent.click(processButton);

    // Should show processing state
    expect(screen.getByText(/processing document/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/processing document/i)).not.toBeInTheDocument();
    });
  });
});