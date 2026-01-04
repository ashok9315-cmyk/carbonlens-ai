import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '📊',
      title: 'Real-Time Analytics',
      description: 'Track your carbon footprint with live data visualization and comprehensive insights.',
      gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
    },
    {
      icon: '🌍',
      title: 'Supply Chain Tracking',
      description: 'Monitor emissions across your entire supply chain from source to delivery.',
      gradient: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations to optimize and reduce your carbon emissions.',
      gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Documents Processed' },
    { value: '2.5M', label: 'Tons CO₂ Tracked' },
    { value: '500+', label: 'Companies Trust Us' },
    { value: '99.9%', label: 'Accuracy Rate' }
  ];

  const benefits = [
    { icon: '🚀', title: 'Automated Processing', description: 'AI-powered document analysis' },
    { icon: '🚢', title: 'Multi-Modal Transport', description: 'Air, sea, rail, and road tracking' },
    { icon: '📋', title: 'Regulatory Compliance', description: 'International standards met' },
    { icon: '🔗', title: 'API Integration', description: 'Seamless system connectivity' },
    { icon: '🔒', title: 'Data Security', description: 'Enterprise-grade encryption' },
    { icon: '📈', title: 'Custom Reporting', description: 'Tailored business insights' }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo">
            <svg className="logo-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#headerGradient)" />
              <circle cx="42" cy="42" r="22" fill="none" stroke="white" strokeWidth="4" opacity="0.95"/>
              <line x1="58" y1="58" x2="70" y2="70" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.95"/>
              <circle cx="42" cy="42" r="5" fill="white" opacity="0.9"/>
              <circle cx="30" cy="42" r="3.5" fill="white" opacity="0.85"/>
              <circle cx="54" cy="42" r="3.5" fill="white" opacity="0.85"/>
              <path d="M75 25 Q80 22, 82 27 Q78 29, 75 27 Z" fill="white" opacity="0.8"/>
            </svg>
            <span className="logo-text">CarbonLens AI</span>
          </div>
          <button className="header-login-btn" onClick={() => navigate('/dashboard')}>
            Login
          </button>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="hero-grid"></div>
        
        <div className="hero-content-wrapper">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>Intelligent Carbon Tracking Platform</span>
          </div>
          
          <h1 className="hero-title">
            Track Carbon Emissions
            <br />
            <span className="hero-title-highlight">Across Your Supply Chain</span>
          </h1>
          
          <p className="hero-description">
            Powerful AI-driven platform to track, analyze, and optimize your supply chain's 
            carbon footprint in real-time. Make data-driven decisions for a sustainable future.
          </p>
          
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Get Started Free
              <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              View Demo
            </button>
          </div>
          
          <div className="hero-login-link">
            Already have an account? <button className="login-link" onClick={() => navigate('/dashboard')}>Login</button>
          </div>
          
          <div className="hero-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">FEATURES</span>
            <h2 className="section-title">Everything You Need to Track<br />Carbon Emissions</h2>
            <p className="section-subtitle">
              Powerful tools designed for modern supply chain sustainability
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${activeFeature === index ? 'feature-active' : ''}`}
              >
                <div className="feature-icon-wrapper" style={{ background: feature.gradient }}>
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-indicator" style={{ background: feature.gradient }}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">BENEFITS</span>
            <h2 className="section-title">Why Choose CarbonLens AI</h2>
            <p className="section-subtitle">
              Comprehensive features to help you achieve your sustainability goals
            </p>
          </div>
          
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">
            Join hundreds of companies already tracking their carbon emissions with CarbonLens AI
          </p>
          <button className="btn-primary btn-large" onClick={() => navigate('/dashboard')}>
            Start Tracking Now
            <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">🌿</span>
                <span className="logo-text">CarbonLens AI</span>
              </div>
              <p className="footer-tagline">
                Empowering sustainable supply chains through intelligent carbon tracking
              </p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4 className="footer-heading">Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#" className="footer-link">Pricing</a>
                <a href="#" className="footer-link">API</a>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-heading">Company</h4>
                <a href="#" className="footer-link">About</a>
                <a href="#" className="footer-link">Blog</a>
                <a href="#" className="footer-link">Careers</a>
              </div>
              
              <div className="footer-column">
                <h4 className="footer-heading">Support</h4>
                <a href="#" className="footer-link">Documentation</a>
                <a href="#" className="footer-link">Contact</a>
                <a href="#" className="footer-link">Help Center</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2026 CarbonLens AI. All rights reserved.
            </p>
            <div className="footer-legal">
              <a href="#" className="footer-link">Privacy Policy</a>
              <span className="footer-separator">•</span>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
