import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API } from 'aws-amplify';
import './CertificateVerification.css';

const CertificateVerification = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('verifying');

  useEffect(() => {
    if (certificateId) {
      verifyCertificate(certificateId);
    }
  }, [certificateId]);

  const verifyCertificate = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a verification API
      // For now, we'll simulate verification
      const response = await API.get('carbonlens-api', `/certificate/${id}`);
      
      if (response && response.certificate) {
        setCertificate(response.certificate);
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('invalid');
        setError('Certificate not found or invalid');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
      setVerificationStatus('invalid');
      setError('Certificate verification failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="certificate-verification">
        <div className="verification-container">
          <div className="verification-header">
            <h1>🔍 Verifying Certificate</h1>
            <div className="loading-spinner"></div>
            <p>Please wait while we verify the certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || verificationStatus === 'invalid') {
    return (
      <div className="certificate-verification">
        <div className="verification-container">
          <div className="verification-header error">
            <h1>❌ Certificate Invalid</h1>
            <p>{error || 'This certificate could not be verified.'}</p>
            <div className="verification-details">
              <p><strong>Certificate ID:</strong> {certificateId}</p>
              <p><strong>Status:</strong> Invalid or Not Found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-verification">
      <div className="verification-container">
        <div className="verification-header verified">
          <h1>✅ Certificate Verified</h1>
          <p>This carbon footprint certificate is authentic and valid.</p>
        </div>

        <div className="certificate-display">
          <div className="certificate-card">
            <div className="certificate-header">
              <h2>Carbon Footprint Certificate</h2>
              <div className="certificate-badge">
                <span className="badge-text">GHG Protocol Compliant</span>
              </div>
            </div>

            <div className="certificate-content">
              <div className="certificate-section">
                <h3>🏢 Company Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Company:</span>
                    <span className="value">{certificate.company.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Address:</span>
                    <span className="value">{certificate.company.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Contact:</span>
                    <span className="value">{certificate.company.contact}</span>
                  </div>
                </div>
              </div>

              <div className="certificate-section">
                <h3>📦 Product Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Product:</span>
                    <span className="value">{certificate.product.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">SKU:</span>
                    <span className="value">{certificate.product.sku}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Category:</span>
                    <span className="value">{certificate.product.category}</span>
                  </div>
                </div>
              </div>

              <div className="certificate-section">
                <h3>🌱 Carbon Footprint</h3>
                <div className="emissions-summary">
                  <div className="total-emissions">
                    <span className="emissions-value">
                      {certificate.carbonFootprint.totalEmissions.toLocaleString()}
                    </span>
                    <span className="emissions-unit">{certificate.carbonFootprint.unit}</span>
                  </div>
                  
                  <div className="emissions-breakdown">
                    <div className="breakdown-item">
                      <span>Transport:</span>
                      <span>{certificate.carbonFootprint.breakdown.transport} kg CO₂e</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Manufacturing:</span>
                      <span>{certificate.carbonFootprint.breakdown.manufacturing} kg CO₂e</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Warehousing:</span>
                      <span>{certificate.carbonFootprint.breakdown.warehousing} kg CO₂e</span>
                    </div>
                    <div className="breakdown-item">
                      <span>Last Mile:</span>
                      <span>{certificate.carbonFootprint.breakdown.lastMile} kg CO₂e</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="certificate-section">
                <h3>🚚 Supply Chain</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Origin:</span>
                    <span className="value">{certificate.supplyChain.origin}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Destination:</span>
                    <span className="value">{certificate.supplyChain.destination}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Transport Mode:</span>
                    <span className="value">{certificate.supplyChain.transportMode}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Distance:</span>
                    <span className="value">{certificate.supplyChain.distance} km</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Weight:</span>
                    <span className="value">{certificate.supplyChain.weight} kg</span>
                  </div>
                </div>
              </div>

              <div className="certificate-section">
                <h3>🔐 Verification</h3>
                <div className="verification-info">
                  <div className="info-item">
                    <span className="label">Method:</span>
                    <span className="value">{certificate.verification.method}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Algorithm:</span>
                    <span className="value">{certificate.verification.algorithm}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Hash:</span>
                    <span className="value hash">{certificate.verification.hash}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Signature:</span>
                    <span className="value hash">{certificate.verification.signature}</span>
                  </div>
                </div>
              </div>

              <div className="certificate-footer">
                <div className="certificate-dates">
                  <div className="date-item">
                    <span className="label">Issued:</span>
                    <span className="value">{formatDate(certificate.issuedAt)}</span>
                  </div>
                  <div className="date-item">
                    <span className="label">Valid Until:</span>
                    <span className="value">{formatDate(certificate.validUntil)}</span>
                  </div>
                </div>
                
                <div className="certificate-id">
                  <span className="label">Certificate ID:</span>
                  <span className="value">{certificateId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="verification-actions">
          <button 
            className="btn-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Certificate
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;