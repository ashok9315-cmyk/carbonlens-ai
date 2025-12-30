import React, { useState, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';
import './Optimizations.css';

const Optimizations = () => {
  const [optimizations, setOptimizations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const email = user.attributes.email;
      setUserEmail(email);
      await loadOptimizations(email);
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      // Fallback to demo data for non-authenticated users
      loadDemoOptimizations();
    }
  };

  const loadOptimizations = async (email) => {
    setLoading(true);
    try {
      const response = await API.get('carbonlens-api', '/optimizations', {
        headers: {
          'x-user-email': email
        },
        queryStringParameters: {
          optimizationType: 'all'
        }
      });
      
      setOptimizations(response.optimizations);
    } catch (error) {
      console.error('Error loading optimizations:', error);
      // Fallback to demo data
      loadDemoOptimizations();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoOptimizations = () => {
    try {
      // Demo data for non-authenticated users
      const mockOptimizations = {
        routeOptimization: [
          {
            action: "Optimize delivery routes using AI-powered route planning",
            emissionReduction: "15-25%",
            difficulty: "Medium",
            costImpact: "Savings",
            timeline: "2-4 weeks",
            description: "Implement dynamic route optimization to reduce total distance traveled and fuel consumption"
          },
          {
            action: "Consolidate shipments to reduce number of trips",
            emissionReduction: "20-30%",
            difficulty: "Low",
            costImpact: "Savings",
            timeline: "1-2 weeks",
            description: "Combine multiple small shipments into fewer larger ones to improve efficiency"
          }
        ],
        transportModeSwitch: [
          {
            action: "Switch from air freight to ocean freight for non-urgent shipments",
            emissionReduction: "80-90%",
            difficulty: "Low",
            costImpact: "Savings",
            timeline: "1-2 weeks",
            description: "Ocean freight produces significantly lower emissions than air transport"
          },
          {
            action: "Use rail transport for long-distance domestic shipments",
            emissionReduction: "60-70%",
            difficulty: "Medium",
            costImpact: "Neutral",
            timeline: "4-6 weeks",
            description: "Rail transport is more efficient for heavy, long-distance shipments"
          }
        ],
        consolidation: [
          {
            action: "Implement cross-docking to reduce warehouse storage time",
            emissionReduction: "10-15%",
            difficulty: "High",
            costImpact: "Cost",
            timeline: "8-12 weeks",
            description: "Direct transfer from inbound to outbound transportation reduces storage emissions"
          }
        ],
        timing: [
          {
            action: "Schedule shipments during off-peak hours to avoid traffic congestion",
            emissionReduction: "10-15%",
            difficulty: "Low",
            costImpact: "Neutral",
            timeline: "1 week",
            description: "Reduce fuel consumption by avoiding traffic delays"
          }
        ],
        summary: {
          totalPotentialReduction: "25-40%",
          quickWins: [
            "Consolidate shipments",
            "Switch to ocean freight",
            "Optimize delivery timing"
          ],
          longTermGoals: [
            "Implement AI route optimization",
            "Establish rail transport partnerships",
            "Develop sustainable supplier network"
          ]
        }
      };
      setOptimizations(mockOptimizations);
    } catch (error) {
      console.error('Error loading optimizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOptimizations = () => {
    if (!optimizations || selectedCategory === 'all') {
      return optimizations;
    }
    
    return {
      ...optimizations,
      [selectedCategory]: optimizations[selectedCategory]
    };
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Low': '#27ae60',
      'Medium': '#f39c12',
      'High': '#e74c3c'
    };
    return colors[difficulty] || '#95a5a6';
  };

  const getCostImpactColor = (impact) => {
    const colors = {
      'Savings': '#27ae60',
      'Neutral': '#f39c12',
      'Cost': '#e74c3c'
    };
    return colors[impact] || '#95a5a6';
  };

  if (loading) {
    return (
      <div className="optimizations loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Generating optimization recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="optimizations">
      <div className="optimizations-header">
        <h1>Carbon Optimization Recommendations</h1>
        <p>AI-powered suggestions to reduce your supply chain carbon footprint</p>
      </div>

      {optimizations && (
        <>
          <div className="optimization-summary">
            <div className="summary-card">
              <h2>{optimizations.summary.totalPotentialReduction}</h2>
              <p>Total Potential Reduction</p>
            </div>
            <div className="quick-wins">
              <h3>Quick Wins</h3>
              <ul>
                {optimizations.summary.quickWins.map((win, index) => (
                  <li key={index}>{win}</li>
                ))}
              </ul>
            </div>
            <div className="long-term">
              <h3>Long-term Goals</h3>
              <ul>
                {optimizations.summary.longTermGoals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="optimization-filters">
            <button 
              className={selectedCategory === 'all' ? 'active' : ''}
              onClick={() => setSelectedCategory('all')}
            >
              All Recommendations
            </button>
            <button 
              className={selectedCategory === 'routeOptimization' ? 'active' : ''}
              onClick={() => setSelectedCategory('routeOptimization')}
            >
              Route Optimization
            </button>
            <button 
              className={selectedCategory === 'transportModeSwitch' ? 'active' : ''}
              onClick={() => setSelectedCategory('transportModeSwitch')}
            >
              Transport Mode
            </button>
            <button 
              className={selectedCategory === 'consolidation' ? 'active' : ''}
              onClick={() => setSelectedCategory('consolidation')}
            >
              Consolidation
            </button>
            <button 
              className={selectedCategory === 'timing' ? 'active' : ''}
              onClick={() => setSelectedCategory('timing')}
            >
              Timing
            </button>
          </div>

          <div className="optimization-categories">
            {Object.entries(getFilteredOptimizations()).map(([category, recommendations]) => {
              if (category === 'summary' || !Array.isArray(recommendations)) return null;
              
              return (
                <div key={category} className="category-section">
                  <h3 className="category-title">
                    {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </h3>
                  <div className="recommendations-grid">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="recommendation-card">
                        <div className="rec-header">
                          <h4>{rec.action}</h4>
                          <div className="rec-badges">
                            <span 
                              className="badge emission-reduction"
                              style={{ backgroundColor: '#27ae60' }}
                            >
                              {rec.emissionReduction} reduction
                            </span>
                          </div>
                        </div>
                        
                        <p className="rec-description">{rec.description}</p>
                        
                        <div className="rec-details">
                          <div className="detail-item">
                            <span className="label">Difficulty:</span>
                            <span 
                              className="value difficulty"
                              style={{ color: getDifficultyColor(rec.difficulty) }}
                            >
                              {rec.difficulty}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Cost Impact:</span>
                            <span 
                              className="value cost-impact"
                              style={{ color: getCostImpactColor(rec.costImpact) }}
                            >
                              {rec.costImpact}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Timeline:</span>
                            <span className="value">{rec.timeline}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Optimizations;