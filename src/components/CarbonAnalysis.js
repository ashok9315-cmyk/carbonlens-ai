import React, { useState, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';
import './CarbonAnalysis.css';

const CarbonAnalysis = () => {
  const [calculations, setCalculations] = useState([]);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const email = user.attributes.email;
      setUserEmail(email);
      await loadRecentCalculations(email);
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      // Fallback to demo data for non-authenticated users
      loadDemoCalculations();
    }
  };

  const loadRecentCalculations = async (email) => {
    try {
      setLoading(true);
      const response = await API.get('carbonlens-api', '/dashboard', {
        headers: {
          'x-user-email': email
        }
      });
      
      // Extract calculations from dashboard data
      const calculationsData = response.calculations || [];
      setCalculations(calculationsData);
      
      // Auto-select the first calculation if available
      if (calculationsData.length > 0 && !selectedCalculation) {
        setSelectedCalculation(calculationsData[0]);
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
      // Fallback to demo data
      loadDemoCalculations();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCalculations = () => {
    // Demo data for non-authenticated users
    const mockCalculations = [
      {
        id: '1',
        documentId: 'doc-001',
        productName: 'Laptop Computer',
        totalEmissions: 45.2,
        breakdown: {
          transport: 32.1,
          manufacturing: 8.5,
          warehousing: 2.3,
          lastMile: 2.3
        },
        route: 'Shanghai → Los Angeles',
        transportMode: 'Ocean + Truck',
        calculatedAt: '2024-12-29T10:30:00Z'
      },
      {
        id: '2',
        documentId: 'doc-002',
        productName: 'Smartphone',
        totalEmissions: 12.8,
        breakdown: {
          transport: 8.9,
          manufacturing: 2.1,
          warehousing: 0.9,
          lastMile: 0.9
        },
        route: 'Shenzhen → New York',
        transportMode: 'Air Freight',
        calculatedAt: '2024-12-29T09:15:00Z'
      }
    ];
    
    setCalculations(mockCalculations);
  };

  const calculateNewFootprint = async (shippingData) => {
    if (!userEmail) {
      alert('Please log in to calculate carbon footprint');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('carbonlens-api', '/calculate-carbon', {
        headers: {
          'x-user-email': userEmail
        },
        body: {
          documentId: 'manual-calc',
          shippingData: shippingData
        }
      });
      
      setCalculations(prev => [response, ...prev]);
      setSelectedCalculation(response);
    } catch (error) {
      console.error('Error calculating carbon footprint:', error);
      alert('Failed to calculate carbon footprint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="carbon-analysis">
      <div className="analysis-header">
        <h1>Carbon Footprint Analysis</h1>
        <p>Detailed analysis of supply chain carbon emissions</p>
      </div>

      <div className="analysis-content">
        <div className="calculations-list">
          <h3>Recent Calculations</h3>
          {calculations.map((calc) => (
            <div 
              key={calc.id} 
              className={`calculation-item ${selectedCalculation?.id === calc.id ? 'selected' : ''}`}
              onClick={() => setSelectedCalculation(calc)}
            >
              <div className="calc-header">
                <h4>{calc.productName}</h4>
                <span className="emissions-total">{calc.totalEmissions} kg CO₂e</span>
              </div>
              <div className="calc-details">
                <span className="route">{calc.route}</span>
                <span className="transport-mode">{calc.transportMode}</span>
              </div>
              <div className="calc-date">
                {new Date(calc.calculatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="analysis-details">
          {selectedCalculation ? (
            <div className="calculation-details">
              <h3>Detailed Analysis: {selectedCalculation.productName}</h3>
              
              <div className="emissions-summary">
                <div className="total-emissions">
                  <h2>{selectedCalculation.totalEmissions} kg CO₂e</h2>
                  <p>Total Carbon Footprint</p>
                </div>
              </div>

              <div className="emissions-breakdown">
                <h4>Emissions Breakdown</h4>
                <div className="breakdown-chart">
                  {Object.entries(selectedCalculation.breakdown).map(([category, value]) => (
                    <div key={category} className="breakdown-item">
                      <div className="category-label">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      <div className="category-bar">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${(value / selectedCalculation.totalEmissions) * 100}%`,
                            backgroundColor: getCategoryColor(category)
                          }}
                        ></div>
                      </div>
                      <div className="category-value">{value} kg CO₂e</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="route-info">
                <h4>Route Information</h4>
                <div className="route-details">
                  <div className="route-item">
                    <span className="label">Route:</span>
                    <span className="value">{selectedCalculation.route}</span>
                  </div>
                  <div className="route-item">
                    <span className="label">Transport Mode:</span>
                    <span className="value">{selectedCalculation.transportMode}</span>
                  </div>
                  <div className="route-item">
                    <span className="label">Calculated:</span>
                    <span className="value">
                      {new Date(selectedCalculation.calculatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select a calculation to view details</h3>
              <p>Choose a calculation from the list to see detailed carbon footprint analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getCategoryColor = (category) => {
  const colors = {
    transport: '#3498db',
    manufacturing: '#e74c3c',
    warehousing: '#f39c12',
    lastMile: '#27ae60'
  };
  return colors[category] || '#95a5a6';
};

export default CarbonAnalysis;