import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import QRCode from 'qrcode';
import './Certificates.css';

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (selectedCertificate) {
      generateQRCode(selectedCertificate.id);
    }
  }, [selectedCertificate]);

  const initializeComponent = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const email = user.attributes.email;
      setUserEmail(email);
      await loadCertificates(email);
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      // Fallback to demo data for non-authenticated users
      loadDemoCertificates();
    }
  };

  const loadCertificates = async (email) => {
    try {
      setLoading(true);
      const response = await API.get('carbonlens-api', '/dashboard', {
        headers: {
          'x-user-email': email
        }
      });
      
      // Extract certificates from dashboard data
      const certificatesData = response.certificates || [];
      setCertificates(certificatesData);
    } catch (error) {
      console.error('Error loading certificates:', error);
      // Fallback to demo data
      loadDemoCertificates();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCertificates = () => {
    // Demo data for non-authenticated users
    const mockCertificates = [
      {
        id: 'cert-001',
        version: '1.0',
        standard: 'GHG Protocol',
        issuedAt: '2024-12-29T10:30:00Z',
        validUntil: '2025-12-29T10:30:00Z',
        company: {
          name: 'EcoTech Solutions',
          address: '123 Green Street, San Francisco, CA',
          contact: 'sustainability@ecotech.com'
        },
        product: {
          name: 'Laptop Computer',
          sku: 'LT-2024-001',
          category: 'Electronics'
        },
        carbonFootprint: {
          totalEmissions: 45.2,
          unit: 'kg CO2e',
          breakdown: {
            transport: 32.1,
            manufacturing: 8.5,
            warehousing: 2.3,
            lastMile: 2.3
          },
          methodology: 'IPCC Guidelines + EPA Emission Factors',
          scope: 'Scope 3 - Transportation and Distribution'
        },
        supplyChain: {
          origin: 'Shanghai, China',
          destination: 'Los Angeles, USA',
          transportMode: 'Ocean + Truck',
          distance: 12500,
          weight: 2.5
        },
        verification: {
          method: 'Cryptographic Hash',
          algorithm: 'SHA-256',
          timestamp: '2024-12-29T10:30:00Z',
          hash: 'a1b2c3d4e5f6789012345678901234567890abcdef',
          signature: 'sig_1234567890abcdef'
        }
      },
      {
        id: 'cert-002',
        version: '1.0',
        standard: 'GHG Protocol',
        issuedAt: '2024-12-29T09:15:00Z',
        validUntil: '2025-12-29T09:15:00Z',
        company: {
          name: 'Mobile Innovations Inc',
          address: '456 Tech Avenue, Austin, TX',
          contact: 'green@mobileinnovations.com'
        },
        product: {
          name: 'Smartphone',
          sku: 'SP-2024-002',
          category: 'Electronics'
        },
        carbonFootprint: {
          totalEmissions: 12.8,
          unit: 'kg CO2e',
          breakdown: {
            transport: 8.9,
            manufacturing: 2.1,
            warehousing: 0.9,
            lastMile: 0.9
          },
          methodology: 'IPCC Guidelines + EPA Emission Factors',
          scope: 'Scope 3 - Transportation and Distribution'
        },
        supplyChain: {
          origin: 'Shenzhen, China',
          destination: 'New York, USA',
          transportMode: 'Air Freight',
          distance: 17000,
          weight: 0.2
        },
        verification: {
          method: 'Cryptographic Hash',
          algorithm: 'SHA-256',
          timestamp: '2024-12-29T09:15:00Z',
          hash: 'b2c3d4e5f6789012345678901234567890abcdef1',
          signature: 'sig_2345678901bcdef2'
        }
      }
    ];
    
    setCertificates(mockCertificates);
  };

  const generateQRCode = async (certificateId) => {
    try {
      const verificationUrl = `https://carbonlens-ai.solutionsynth.cloud/certificates/verify/${certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const generateNewCertificate = async () => {
    if (!userEmail) {
      alert('Please log in to generate certificates');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('carbonlens-api', '/certificate', {
        headers: {
          'x-user-email': userEmail
        },
        body: {
          calculationId: 'latest', // Use latest calculation
          productInfo: { 
            name: 'New Product', 
            sku: 'NP-001', 
            category: 'General' 
          },
          companyInfo: { 
            name: 'Your Company', 
            address: 'Your Address', 
            contact: userEmail 
          }
        }
      });
      
      // Reload certificates to include the new one
      await loadCertificates(userEmail);
      
      console.log('Certificate generated successfully:', response);
    } catch (error) {
      console.error('Error generating certificate:', error);
      
      // Show specific error message based on the error
      let errorMessage = 'Failed to generate certificate. Please try again.';
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (certificate) => {
    const certificateData = JSON.stringify(certificate, null, 2);
    const blob = new Blob([certificateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-certificate-${certificate.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showCertificate = (certificateId) => {
    navigate(`/certificates/verify/${certificateId}`);
  };

  return (
    <div className="certificates">
      <div className="certificates-header">
        <h1>Carbon Certificates</h1>
        <p>Blockchain-verified carbon footprint certificates for transparency and compliance</p>
        <button 
          className="generate-btn"
          onClick={generateNewCertificate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate New Certificate'}
        </button>
      </div>

      <div className="certificates-content">
        <div className="certificates-list">
          <h3>Your Certificates</h3>
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              className={`certificate-item ${selectedCertificate?.id === cert.id ? 'selected' : ''}`}
              onClick={() => setSelectedCertificate(cert)}
            >
              <div className="certificates-item-header">
                <h4>{cert.product.name}</h4>
                <span className="certificates-item-id">{cert.id}</span>
              </div>
              <div className="certificates-item-details">
                <span className="company">{cert.company.name}</span>
                <span className="emissions">{cert.carbonFootprint.totalEmissions} {cert.carbonFootprint.unit}</span>
              </div>
              <div className="certificates-item-date">
                Issued: {new Date(cert.issuedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="certificate-details">
          {selectedCertificate ? (
            <div className="certificate-viewer">
              <div className="certificates-actions">
                <button 
                  className="download-btn"
                  onClick={() => downloadCertificate(selectedCertificate)}
                >
                  📥 Download JSON Certificate
                </button>
                <button 
                  className="show-cert-btn"
                  onClick={() => showCertificate(selectedCertificate.id)}
                >
                  📄 Show Certificate
                </button>
              </div>

              <div className="certificate-document">
                <div className="certificates-title">
                  <h2>Carbon Footprint Certificate</h2>
                  <div className="certificates-badges">
                    <span className="badge verified">✓ Verified</span>
                    <span className="badge standard">{selectedCertificate.standard}</span>
                  </div>
                </div>

                <div className="certificates-sections">
                  <div className="certificates-section">
                    <h3>Company Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Company:</span>
                        <span className="value">{selectedCertificate.company.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Address:</span>
                        <span className="value">{selectedCertificate.company.address}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Contact:</span>
                        <span className="value">{selectedCertificate.company.contact}</span>
                      </div>
                    </div>
                  </div>

                  <div className="certificates-section">
                    <h3>Product Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Product:</span>
                        <span className="value">{selectedCertificate.product.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">SKU:</span>
                        <span className="value">{selectedCertificate.product.sku}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Category:</span>
                        <span className="value">{selectedCertificate.product.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="certificates-section">
                    <h3>Carbon Footprint</h3>
                    <div className="emissions-summary">
                      <div className="total-emissions">
                        <span className="emissions-value">
                          {selectedCertificate.carbonFootprint.totalEmissions}
                        </span>
                        <span className="emissions-unit">
                          {selectedCertificate.carbonFootprint.unit}
                        </span>
                      </div>
                      <div className="methodology">
                        <span className="label">Methodology:</span>
                        <span className="value">{selectedCertificate.carbonFootprint.methodology}</span>
                      </div>
                    </div>
                  </div>

                  <div className="certificates-section">
                    <h3>Supply Chain</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Origin:</span>
                        <span className="value">{selectedCertificate.supplyChain.origin}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Destination:</span>
                        <span className="value">{selectedCertificate.supplyChain.destination}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Transport Mode:</span>
                        <span className="value">{selectedCertificate.supplyChain.transportMode}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Distance:</span>
                        <span className="value">{selectedCertificate.supplyChain.distance} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="certificates-section">
                    <h3>Verification</h3>
                    <div className="verification-info">
                      <div className="qr-code">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code for verification" />}
                        <p>Scan to verify certificate</p>
                      </div>
                      <div className="verification-details">
                        <div className="info-item">
                          <span className="label">Hash:</span>
                          <span className="value hash">{selectedCertificate.verification.hash}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Algorithm:</span>
                          <span className="value">{selectedCertificate.verification.algorithm}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Timestamp:</span>
                          <span className="value">
                            {new Date(selectedCertificate.verification.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select a certificate to view details</h3>
              <p>Choose a certificate from the list to see the full verification document</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
