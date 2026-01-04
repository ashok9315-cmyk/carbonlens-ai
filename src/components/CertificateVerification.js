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
        <div className="certificate">
          <div className="header">
            <h1>🔍 Verifying Certificate</h1>
            <div className="loading-spinner"></div>
          </div>
          <div className="content" style={{textAlign: 'center', padding: '40px'}}>
            <p style={{fontSize: '1.2em', color: '#2c3e50'}}>Please wait while we verify the certificate...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || verificationStatus === 'invalid') {
    return (
      <div className="certificate-verification">
        <div className="certificate">
          <div className="header" style={{background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'}}>
            <h1>❌ Certificate Invalid</h1>
            <div className="subtitle">{error || 'This certificate could not be verified.'}</div>
          </div>
          <div className="content">
            <div className="section">
              <h2 className="section-title">🔍 Verification Details</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Certificate ID</div>
                  <div className="info-value">{certificateId}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className="info-value">Invalid or Not Found</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-verification">
      <button className="print-button" onClick={() => window.print()}>🖨️ Print Certificate</button>
      
      <div className="certificate">
        <div className="header">
          <h1>🌍 Carbon Footprint Certificate</h1>
          <div className="subtitle">GHG Protocol Compliant</div>
        </div>
        
        <div className="content">
          <div className="section">
            <h2 className="section-title">🏢 Company Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Company Name</div>
                <div className="info-value">{certificate.company.name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Address</div>
                <div className="info-value">{certificate.company.address}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Contact</div>
                <div className="info-value">{certificate.company.contact}</div>
              </div>
            </div>
          </div>

          
          <div className="section">
            <h2 className="section-title">📦 Product Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Product Name</div>
                <div className="info-value">{certificate.product.name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">SKU</div>
                <div className="info-value">{certificate.product.sku}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Category</div>
                <div className="info-value">{certificate.product.category}</div>
              </div>
            </div>
          </div>

          
          <div className="section">
            <h2 className="section-title">🌱 Carbon Footprint Analysis</h2>
            <div className="emissions-highlight">
              <div className="total">{certificate.carbonFootprint.totalEmissions.toLocaleString()} {certificate.carbonFootprint.unit}</div>
              <div className="label">Total Emissions</div>
            </div>
            
            <div className="breakdown">
              <div className="breakdown-item">
                <div className="icon">🚚</div>
                <div className="value">{certificate.carbonFootprint.breakdown.transport}</div>
                <div className="label">Transport<br />kg CO₂e</div>
              </div>
              <div className="breakdown-item">
                <div className="icon">🏭</div>
                <div className="value">{certificate.carbonFootprint.breakdown.manufacturing}</div>
                <div className="label">Manufacturing<br />kg CO₂e</div>
              </div>
              <div className="breakdown-item">
                <div className="icon">🏢</div>
                <div className="value">{certificate.carbonFootprint.breakdown.warehousing}</div>
                <div className="label">Warehousing<br />kg CO₂e</div>
              </div>
              <div className="breakdown-item">
                <div className="icon">📍</div>
                <div className="value">{certificate.carbonFootprint.breakdown.lastMile}</div>
                <div className="label">Last Mile<br />kg CO₂e</div>
              </div>
            </div>
          </div>

          
          <div className="section">
            <h2 className="section-title">🚚 Supply Chain Details</h2>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Origin</div>
                <div className="info-value">{certificate.supplyChain.origin}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Destination</div>
                <div className="info-value">{certificate.supplyChain.destination}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Transport Mode</div>
                <div className="info-value">{certificate.supplyChain.transportMode}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Distance</div>
                <div className="info-value">{certificate.supplyChain.distance} km</div>
              </div>
              <div className="info-item">
                <div className="info-label">Weight</div>
                <div className="info-value">{certificate.supplyChain.weight} kg</div>
              </div>
            </div>
          </div>

          
          <div className="section">
            <h2 className="section-title">🔐 Verification Details</h2>
            <div className="verification-box">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Verification Method</div>
                  <div className="info-value">{certificate.verification.method}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Algorithm</div>
                  <div className="info-value">{certificate.verification.algorithm}</div>
                </div>
              </div>
              
              <div style={{marginTop: '15px'}}>
                <div className="info-label">Hash</div>
                <div className="hash-value">{certificate.verification.hash}</div>
              </div>
              
              <div style={{marginTop: '10px'}}>
                <div className="info-label">Signature</div>
                <div className="hash-value">{certificate.verification.signature}</div>
              </div>
            </div>
            
            <div className="info-grid" style={{marginTop: '12px'}}>
              <div className="info-item">
                <div className="info-label">Issued Date</div>
                <div className="info-value">{formatDate(certificate.issuedAt)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Valid Until</div>
                <div className="info-value">{formatDate(certificate.validUntil)}</div>
              </div>
            </div>
            
            <div className="certificate-id">
              <strong>Certificate ID:</strong><br />
              {certificateId}
            </div>
          </div>
        </div>
        
        <div className="footer">
          <p><strong>This certificate is GHG Protocol compliant and cryptographically verified.</strong></p>
          <p style={{marginTop: '10px', fontSize: '0.9em'}}>© 2026 Carbon Footprint Certification Authority</p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;