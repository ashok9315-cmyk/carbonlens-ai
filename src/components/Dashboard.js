import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { API, Auth } from 'aws-amplify';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalEmissions: 0,
    documentsProcessed: 0,
    optimizationsSuggested: 0,
    certificatesGenerated: 0,
    emissionsTrend: [],
    emissionsByMode: [],
    recentActivities: [],
    previousMonth: null,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dashboard data for user:', email || 'anonymous');
      
      const response = await API.get('carbonlens-api', '/dashboard', {
        headers: email ? { 'x-user-email': email } : {}
      });
      
      console.log('Dashboard API response:', response);
      console.log('Documents processed from API:', response.documentsProcessed);
      console.log('User email from API:', response.userEmail);
      console.log('User type from API:', response.userType);
      
      setDashboardData(response);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response || error.message);
      setError(`Failed to load dashboard data: ${error.message}`);
      
      // Show error fallback data for debugging
      console.log('API call failed, using error fallback data');
      setDashboardData({
        totalEmissions: 0,
        documentsProcessed: 0,
        optimizationsSuggested: 0,
        certificatesGenerated: 0,
        emissionsTrend: [],
        emissionsByMode: [],
        recentActivities: [],
        previousMonth: { documents: { current: 0, previous: 0 }, calculations: { current: 0, previous: 0 } },
        lastUpdated: new Date().toISOString(),
        userEmail: email || 'error-fallback',
        userType: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeComponent = useCallback(async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const email = user.attributes.email;
      await loadDashboardData(email);
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      // Fallback to demo data for non-authenticated users
      await loadDashboardData(null);
    }
  }, [loadDashboardData]);

  useEffect(() => {
    initializeComponent();
  }, [initializeComponent]);

  const calculatePercentageChange = (current, previous) => {
    console.log('Calculating percentage change:', { current, previous });
    if (!previous || previous === 0) {
      if (current === 0) return null; // Both are 0, no change
      return null; // Previous is 0, can't calculate percentage
    }
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  };

  const getChangeDisplay = (current, previous, label = '') => {
    const change = calculatePercentageChange(current, previous);
    console.log('Change display:', { current, previous, change, label });
    
    if (change === null) {
      if (current === 0 && previous === 0) {
        return <span className="metric-change neutral">No change</span>;
      }
      return <span className="metric-change neutral">{label || 'No previous data'}</span>;
    }
    
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    return (
      <span className={`metric-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
        {isPositive ? '↑' : isNegative ? '↓' : '='} {Math.abs(change)}% from last month
      </span>
    );
  };

  const getActivityIcon = (type) => {
    const icons = {
      document: '📄',
      calculation: '🧮',
      optimization: '⚡',
      certificate: '🏆'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Supply Chain Carbon Dashboard</h1>
          <p>Loading your carbon footprint data...</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Supply Chain Carbon Dashboard</h1>
        <p>Real-time insights into your carbon footprint and optimization opportunities</p>
        <div className="demo-notice">
          <span className="demo-icon">👤</span>
          <strong>Personal Dashboard:</strong> Showing data for {dashboardData.userEmail || 'current user'}. 
          {dashboardData.userType === 'demo' && 'Demo visitors see sample data for demonstration.'}
          {dashboardData.userType === 'test' && 'Test users see sample data plus their own uploads.'}
          {dashboardData.userType === 'real' && 'Real users see only their own data.'}
          <label className="demo-toggle">
            <input 
              type="checkbox" 
              checked={true}
              disabled={true}
            />
            {dashboardData.userType === 'demo' ? 'Sample data' : 'Your personal data only'}
          </label>
        </div>
        {error && <div className="error-message">⚠️ {error}</div>}
        {dashboardData.lastUpdated && (
          <p className="last-updated">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🌱</div>
          <div className="metric-content">
            <h3>Total Emissions</h3>
            <p className="metric-value">
              {dashboardData.totalEmissions > 0 
                ? `${dashboardData.totalEmissions.toLocaleString()} kg CO₂e`
                : 'No data yet'
              }
            </p>
            {dashboardData.previousMonth && (
              getChangeDisplay(
                dashboardData.totalEmissions, 
                dashboardData.previousMonth.emissions
              )
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📄</div>
          <div className="metric-content">
            <h3>Documents Processed</h3>
            <p className="metric-value">{dashboardData.documentsProcessed}</p>
            {dashboardData.previousMonth && (
              getChangeDisplay(
                dashboardData.documentsProcessed,
                dashboardData.previousMonth.documents?.previous || 0
              )
            )}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h3>Optimizations</h3>
            <p className="metric-value">{dashboardData.optimizationsSuggested}</p>
            <span className="metric-change neutral">
              {dashboardData.optimizationsSuggested > 0 ? 'Active recommendations' : 'No optimizations yet'}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🏆</div>
          <div className="metric-content">
            <h3>Certificates</h3>
            <p className="metric-value">{dashboardData.certificatesGenerated}</p>
            <span className="metric-change neutral">
              {dashboardData.certificatesGenerated > 0 ? 'Certificates issued' : 'No certificates yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Emissions Trend (Last 6 Months)</h3>
          {dashboardData.emissionsTrend && dashboardData.emissionsTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.emissionsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} kg CO₂e`, 'Emissions']} />
                <Legend />
                <Line type="monotone" dataKey="emissions" stroke="#3498db" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>No emissions data available yet. Upload and process documents to see trends.</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3>Emissions by Transport Mode</h3>
          {dashboardData.emissionsByMode && dashboardData.emissionsByMode.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.emissionsByMode}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.emissionsByMode.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>No transport mode data available yet. Process documents with carbon calculations to see breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="activities-section">
        <h3>Recent Activities</h3>
        <div className="activities-list">
          {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? (
            dashboardData.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                <div className="activity-content">
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-timestamp">{activity.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <p>No recent activities. Start by uploading documents to see your activity feed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button 
          className="refresh-button" 
          onClick={() => loadDashboardData()}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;