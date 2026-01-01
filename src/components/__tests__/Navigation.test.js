import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Navigation from '../Navigation';

// Mock CSS imports
jest.mock('../Navigation.css', () => ({}));

const renderWithRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('Navigation Component', () => {
  const mockUser = {
    attributes: {
      email: 'test@example.com'
    }
  };

  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation with title and subtitle', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    expect(screen.getByText('CarbonLens AI')).toBeInTheDocument();
    expect(screen.getByText('Intelligent Supply Chain Carbon Tracking')).toBeInTheDocument();
  });

  test('renders all navigation items', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('Carbon Analysis')).toBeInTheDocument();
    expect(screen.getByText('Optimizations')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
  });

  test('displays user email when user is provided', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('handles missing user gracefully', () => {
    renderWithRouter(<Navigation user={null} signOut={mockSignOut} />);
    
    // Should not crash and should still render navigation
    expect(screen.getByText('CarbonLens AI')).toBeInTheDocument();
  });

  test('handles user without email gracefully', () => {
    const userWithoutEmail = { attributes: {} };
    renderWithRouter(<Navigation user={userWithoutEmail} signOut={mockSignOut} />);
    
    expect(screen.getByText('CarbonLens AI')).toBeInTheDocument();
  });

  test('calls signOut when sign out button is clicked', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('highlights active navigation item based on current path', () => {
    renderWithRouter(
      <Navigation user={mockUser} signOut={mockSignOut} />,
      ['/analysis']
    );
    
    const analysisLink = screen.getByText('Carbon Analysis').closest('a');
    expect(analysisLink).toHaveClass('active');
  });

  test('dashboard is active when on root path', () => {
    renderWithRouter(
      <Navigation user={mockUser} signOut={mockSignOut} />,
      ['/']
    );
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
  });

  test('renders navigation icons', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    // Check for main icon
    expect(screen.getByText('🔍')).toBeInTheDocument();
    
    // Check for user icon
    expect(screen.getByText('👤')).toBeInTheDocument();
    
    // Navigation item icons are rendered as part of the text content
    expect(screen.getByText('📊')).toBeInTheDocument(); // Dashboard
    expect(screen.getByText('📄')).toBeInTheDocument(); // Upload Documents
    expect(screen.getByText('🌱')).toBeInTheDocument(); // Carbon Analysis
    expect(screen.getByText('⚡')).toBeInTheDocument(); // Optimizations
    expect(screen.getByText('🏆')).toBeInTheDocument(); // Certificates
  });

  test('navigation links have correct href attributes', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Upload Documents').closest('a')).toHaveAttribute('href', '/upload');
    expect(screen.getByText('Carbon Analysis').closest('a')).toHaveAttribute('href', '/analysis');
    expect(screen.getByText('Optimizations').closest('a')).toHaveAttribute('href', '/optimizations');
    expect(screen.getByText('Certificates').closest('a')).toHaveAttribute('href', '/certificates');
  });

  test('renders sign out button', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
    expect(signOutButton).toBeInTheDocument();
    expect(signOutButton).toHaveClass('sign-out-btn');
  });

  test('navigation structure is correct', () => {
    renderWithRouter(<Navigation user={mockUser} signOut={mockSignOut} />);
    
    // Check main navigation container
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('navigation');
    
    // Check navigation menu
    const navMenu = screen.getByRole('list');
    expect(navMenu).toHaveClass('nav-menu');
    
    // Check all navigation items are list items
    const navItems = screen.getAllByRole('listitem');
    expect(navItems).toHaveLength(5);
    
    navItems.forEach(item => {
      expect(item).toHaveClass('nav-item');
    });
  });
});