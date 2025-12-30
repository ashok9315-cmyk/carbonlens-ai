import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ user, signOut }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/upload', label: 'Upload Documents', icon: '📄' },
    { path: '/analysis', label: 'Carbon Analysis', icon: '🌱' },
    { path: '/optimizations', label: 'Optimizations', icon: '⚡' },
    { path: '/certificates', label: 'Certificates', icon: '🏆' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h1 className="nav-title">
          <span className="nav-icon">🔍</span>
          CarbonLens AI
        </h1>
        <p className="nav-subtitle">Intelligent Supply Chain Carbon Tracking</p>
      </div>
      
      <ul className="nav-menu">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="nav-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-email">{user?.attributes?.email}</span>
        </div>
        <button onClick={signOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Navigation;