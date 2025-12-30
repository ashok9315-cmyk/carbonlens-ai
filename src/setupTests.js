import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  API: {
    post: jest.fn(),
    get: jest.fn(),
  },
  Auth: {
    currentAuthenticatedUser: jest.fn(),
    currentSession: jest.fn(),
  },
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'line-chart' }, children);
  },
  Line: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'line' });
  },
  XAxis: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'x-axis' });
  },
  YAxis: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'y-axis' });
  },
  CartesianGrid: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'cartesian-grid' });
  },
  Tooltip: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'tooltip' });
  },
  Legend: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'legend' });
  },
  ResponsiveContainer: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'responsive-container' }, children);
  },
  PieChart: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'pie-chart' }, children);
  },
  Pie: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'pie' });
  },
  Cell: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'cell' });
  },
  BarChart: ({ children }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'bar-chart' }, children);
  },
  Bar: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'bar' });
  },
}));

// Mock QR Code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
}));

// Global test utilities
global.fetch = jest.fn();

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('React Router')) return;
  originalConsoleWarn(...args);
};