import React, { useState } from 'react';
import axios from 'axios';
import { Auth } from 'aws-amplify';
import { awsConfig } from '../aws-config';
import './DocumentUpload.css';

const DocumentUpload = () => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    uploadProgress: 0,
    processingStage: '',
    uploadedFiles: [],
    error: null
  });

  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (isValidFile(file)) {
        await processFile(file);
      } else {
        setUploadState(prev => ({
          ...prev,
          error: `Invalid file type: ${file.name}. Please upload PDF, PNG, JPG, or JPEG files.`
        }));
      }
    }
  };

  const isValidFile = (file) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const processFile = async (file) => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      processingStage: 'Preparing document for processing...',
      error: null
    }));

    try {
      // Stage 1: Document Processing
      setUploadState(prev => ({
        ...prev,
        uploadProgress: 20,
        processingStage: 'Extracting text and data from document...'
      }));
      
      await sleep(500); // UX delay
      
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      setUploadState(prev => ({
        ...prev,
        uploadProgress: 40,
        processingStage: 'Analyzing document with AI...'
      }));
      
      // Get current authenticated user
      let userEmail = 'anonymous';
      try {
        const user = await Auth.currentAuthenticatedUser();
        userEmail = user.attributes.email;
      } catch (authError) {
        console.log('No authenticated user, using anonymous');
      }
      
      // Call document processing API
      const documentResponse = await axios.post(
        `${awsConfig.API.endpoints[0].endpoint}/process-document`,
        {
          fileData: base64,
          fileName: file.name,
          documentType: getDocumentType(file.name)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail
          }
        }
      );

      setUploadState(prev => ({
        ...prev,
        uploadProgress: 60,
        processingStage: 'Calculating carbon footprint with AI analysis...'
      }));
      
      await sleep(1000); // UX delay
      
      // Stage 2: Automatic Carbon Analysis
      let carbonResult = null;
      try {
        const carbonResponse = await axios.post(
          `${awsConfig.API.endpoints[0].endpoint}/calculate-carbon`,
          {
            documentId: documentResponse.data.documentId,
            shippingData: {
              origin: documentResponse.data.extractedData.origin || 'Unknown Origin',
              destination: documentResponse.data.extractedData.destination || 'Unknown Destination',
              transportMode: documentResponse.data.extractedData.transportMode || 'truck',
              weight: documentResponse.data.extractedData.weight || 1000,
              distance: documentResponse.data.extractedData.distance || 500,
              carrier: documentResponse.data.extractedData.carrier
            },
            additionalData: {
              documentType: getDocumentType(file.name),
              fileName: file.name
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': userEmail
            }
          }
        );
        carbonResult = carbonResponse.data;
      } catch (carbonError) {
        console.warn('Carbon calculation failed, continuing without it:', carbonError);
      }

      setUploadState(prev => ({
        ...prev,
        uploadProgress: 100,
        processingStage: 'Analysis complete!',
        isUploading: false,
        uploadedFiles: [...prev.uploadedFiles, {
          id: documentResponse.data.documentId,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          extractedData: documentResponse.data.extractedData,
          confidence: documentResponse.data.confidence,
          carbonFootprint: carbonResult?.carbonFootprint,
          aiInsights: carbonResult?.aiInsights,
          status: 'processed'
        }]
      }));

      // Reset progress after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: 0,
          processingStage: ''
        }));
      }, 3000);

    } catch (error) {
      console.error('Error processing file:', error);
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        processingStage: '',
        error: `Failed to process ${file.name}: ${error.response?.data?.error || error.message}`
      }));
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const getDocumentType = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('invoice')) return 'invoice';
    if (name.includes('bill') || name.includes('lading')) return 'bill_of_lading';
    if (name.includes('shipping') || name.includes('label')) return 'shipping_label';
    return 'logistics_document';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h1>Document Upload & AI Analysis</h1>
        <p>Upload shipping documents for automated AI-powered carbon footprint analysis</p>
      </div>

      {/* Upload Area */}
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
          className="file-input"
        />
        
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drag & Drop Documents Here</h3>
          <p>or <label htmlFor="file-upload" className="upload-link">browse files</label></p>
          <div className="upload-info">
            <p>Supported formats: PDF, PNG, JPG, JPEG</p>
            <p>Maximum file size: 10MB</p>
          </div>
        </div>

        {/* Enhanced Processing Progress */}
        {uploadState.isUploading && (
          <div className="processing-progress">
            <div className="progress-header">
              <h3>🔄 AI Processing in Progress</h3>
            </div>
            <div className="progress-stage">
              <div className="stage-indicator">
                <div className={`stage-dot ${uploadState.uploadProgress >= 20 ? 'active' : ''}`}></div>
                <div className="stage-line"></div>
                <div className={`stage-dot ${uploadState.uploadProgress >= 60 ? 'active' : ''}`}></div>
                <div className="stage-line"></div>
                <div className={`stage-dot ${uploadState.uploadProgress >= 100 ? 'active' : ''}`}></div>
              </div>
              <div className="stage-labels">
                <span className="stage-label">Document Processing</span>
                <span className="stage-label">Carbon Analysis</span>
                <span className="stage-label">Complete</span>
              </div>
            </div>
            <div className="progress-message">
              <span className="progress-icon">⚡</span>
              {uploadState.processingStage}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadState.uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-percentage">{uploadState.uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {uploadState.error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {uploadState.error}
          <button 
            className="error-close"
            onClick={() => setUploadState(prev => ({ ...prev, error: null }))}
          >
            ×
          </button>
        </div>
      )}

      {/* Uploaded Files List with Carbon Results */}
      {uploadState.uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Processed Documents & Analysis Results</h3>
          <div className="files-list">
            {uploadState.uploadedFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <span className="file-icon">{getFileIcon(file.type)}</span>
                  <div className="file-details">
                    <h4>{file.name}</h4>
                    <p>{formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="file-status">
                  <span className="status-badge processed">✅ Analyzed</span>
                </div>

                <div className="analysis-results">
                  {/* Document Processing Results */}
                  {file.extractedData && (
                    <div className="extracted-data">
                      <h5>📄 Document Processing Results</h5>
                      <div className="data-grid">
                        {file.extractedData.origin && (
                          <div className="data-item">
                            <span className="data-label">Origin:</span>
                            <span className="data-value">{file.extractedData.origin}</span>
                          </div>
                        )}
                        {file.extractedData.destination && (
                          <div className="data-item">
                            <span className="data-label">Destination:</span>
                            <span className="data-value">{file.extractedData.destination}</span>
                          </div>
                        )}
                        {file.extractedData.transportMode && (
                          <div className="data-item">
                            <span className="data-label">Transport Mode:</span>
                            <span className="data-value">{file.extractedData.transportMode}</span>
                          </div>
                        )}
                        {file.extractedData.weight && (
                          <div className="data-item">
                            <span className="data-label">Weight:</span>
                            <span className="data-value">{file.extractedData.weight} kg</span>
                          </div>
                        )}
                        {file.extractedData.carrier && (
                          <div className="data-item">
                            <span className="data-label">Carrier:</span>
                            <span className="data-value">{file.extractedData.carrier}</span>
                          </div>
                        )}
                      </div>
                      {file.confidence && (
                        <div className="confidence-score">
                          <span className="confidence-label">Confidence:</span>
                          <span className="confidence-value">{Math.round(file.confidence.overall * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carbon Analysis Results */}
                  {file.carbonFootprint && (
                    <div className="carbon-results">
                      <h5>🌱 Carbon Footprint Analysis</h5>
                      <div className="carbon-summary">
                        <div className="total-emissions">
                          <span className="emissions-value">
                            {file.carbonFootprint.totalEmissions.toLocaleString()}
                          </span>
                          <span className="emissions-unit">kg CO₂e</span>
                        </div>
                        
                        {file.carbonFootprint.breakdown && (
                          <div className="emissions-breakdown">
                            <div className="breakdown-item">
                              <span>Transport:</span>
                              <span>{file.carbonFootprint.breakdown.transport} kg CO₂e</span>
                            </div>
                            <div className="breakdown-item">
                              <span>Manufacturing:</span>
                              <span>{file.carbonFootprint.breakdown.manufacturing} kg CO₂e</span>
                            </div>
                            <div className="breakdown-item">
                              <span>Warehousing:</span>
                              <span>{file.carbonFootprint.breakdown.warehousing} kg CO₂e</span>
                            </div>
                            <div className="breakdown-item">
                              <span>Last Mile:</span>
                              <span>{file.carbonFootprint.breakdown.lastMile} kg CO₂e</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {file.aiInsights && (
                        <div className="ai-insights">
                          <h6>🤖 AI Insights</h6>
                          {file.aiInsights.sustainabilityScore && (
                            <div className="sustainability-score">
                              <span>Sustainability Score: </span>
                              <span className="score">{file.aiInsights.sustainabilityScore}/10</span>
                            </div>
                          )}
                          {file.aiInsights.recommendations && file.aiInsights.recommendations.length > 0 && (
                            <div className="recommendations">
                              <strong>Top Recommendations:</strong>
                              <ul>
                                {file.aiInsights.recommendations.slice(0, 2).map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="upload-instructions">
        <h3>How It Works</h3>
        <div className="instructions-grid">
          <div className="instruction-item">
            <div className="instruction-icon">1️⃣</div>
            <div className="instruction-content">
              <h4>Upload Documents</h4>
              <p>Drag and drop or select shipping documents, invoices, and bills of lading</p>
            </div>
          </div>
          
          <div className="instruction-item">
            <div className="instruction-icon">2️⃣</div>
            <div className="instruction-content">
              <h4>AI Processing</h4>
              <p>Our AI extracts shipping information using Amazon Textract and Comprehend</p>
            </div>
          </div>
          
          <div className="instruction-item">
            <div className="instruction-icon">3️⃣</div>
            <div className="instruction-content">
              <h4>Automatic Carbon Analysis</h4>
              <p>Instantly calculate carbon footprint and get AI-powered optimization recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;