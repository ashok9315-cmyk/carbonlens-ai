import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ user, signOut }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload Documents', icon: '📄' },
    { path: '/analysis', label: 'Carbon Analysis', icon: '🌱' },
    { path: '/optimizations', label: 'Optimizations', icon: '⚡' },
    { path: '/certificates', label: 'Certificates', icon: '🏆' }
  ];

  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <div className="logo-container">
          <div className="logo-circle">
            <svg className="logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="url(#gradient1)" />
              <circle cx="42" cy="42" r="22" fill="none" stroke="white" strokeWidth="4" opacity="0.95"/>
              <line x1="58" y1="58" x2="70" y2="70" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.95"/>
              <circle cx="42" cy="42" r="5" fill="white" opacity="0.9"/>
              <circle cx="30" cy="42" r="3.5" fill="white" opacity="0.85"/>
              <circle cx="54" cy="42" r="3.5" fill="white" opacity="0.85"/>
              <path d="M75 25 Q80 22, 82 27 Q78 29, 75 27 Z" fill="white" opacity="0.8"/>
            </svg>
          </div>
          {!isCollapsed && (
            <div className="logo-text">
              <h1 className="nav-title">CarbonLens AI</h1>
              <p className="nav-subtitle">Carbon Tracking Platform</p>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle sidebar"
        >
          <span className="collapse-icon">{isCollapsed ? '→' : '←'}</span>
        </button>
      </div>
      
      <ul className="nav-menu">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-link-label">{item.label}</span>}
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="nav-footer">
        <div className="user-info">
          <div className="user-avatar">
            <span className="user-icon">👤</span>
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <span className="user-email">{user?.attributes?.email}</span>
              <span className="user-role">Premium User</span>
            </div>
          )}
        </div>
        <button onClick={signOut} className="sign-out-btn" title="Sign Out">
          <span className="signout-icon">🚪</span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;