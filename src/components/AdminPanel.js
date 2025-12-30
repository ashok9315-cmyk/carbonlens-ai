import React, { useState } from 'react';
import axios from 'axios';
import { awsConfig } from '../aws-config';
import './AdminPanel.css';

const AdminPanel = () => {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const seedTestData = async () => {
    setSeeding(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `${awsConfig.API.endpoints[0].endpoint}/seed-test-data`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error('Error seeding test data:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>🔧 Admin Panel</h2>
        <p>Administrative tools for CarbonLens AI</p>
      </div>

      <div className="admin-section">
        <h3>📊 Test Data Management</h3>
        <div className="test-data-info">
          <p>Populate the database with realistic sample data for dashboard demonstration:</p>
          <ul>
            <li>8 sample shipping documents (invoices, manifests, bills of lading)</li>
            <li>Carbon footprint calculations with AI insights</li>
            <li>6 months of trend data for charts</li>
            <li>Sample certificates and optimization recommendations</li>
          </ul>
        </div>

        <button
          className="seed-button"
          onClick={seedTestData}
          disabled={seeding}
        >
          {seeding ? (
            <>
              <span className="spinner"></span>
              Seeding Test Data...
            </>
          ) : (
            <>
              <span className="seed-icon">🌱</span>
              Seed Test Data
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
          </div>
        )}

        {result && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {result.message}
            <p className="timestamp">Completed at: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>📈 Dashboard Preview</h3>
        <p>After seeding test data, your dashboard will show:</p>
        <div className="preview-metrics">
          <div className="preview-metric">
            <span className="metric-icon">🌱</span>
            <div>
              <strong>~1,430 kg CO₂e</strong>
              <small>Total Emissions</small>
            </div>
          </div>
          <div className="preview-metric">
            <span className="metric-icon">📄</span>
            <div>
              <strong>8+ Documents</strong>
              <small>Processed</small>
            </div>
          </div>
          <div className="preview-metric">
            <span className="metric-icon">⚡</span>
            <div>
              <strong>3+ Optimizations</strong>
              <small>Suggested</small>
            </div>
          </div>
          <div className="preview-metric">
            <span className="metric-icon">🏆</span>
            <div>
              <strong>4+ Certificates</strong>
              <small>Generated</small>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>🔗 Quick Links</h3>
        <div className="quick-links">
          <a 
            href="https://carbonlens-ai.solutionsynth.cloud" 
            target="_blank" 
            rel="noopener noreferrer"
            className="quick-link"
          >
            🌐 Live Application
          </a>
          <a 
            href="https://console.aws.amazon.com/dynamodb/home?region=us-east-1#tables:selected=carbonlens-ai-dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="quick-link"
          >
            🗄️ DynamoDB Table
          </a>
          <a 
            href="https://console.aws.amazon.com/s3/buckets/carbonlens-ai-documents-dev-790756194179" 
            target="_blank" 
            rel="noopener noreferrer"
            className="quick-link"
          >
            📁 S3 Bucket
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;