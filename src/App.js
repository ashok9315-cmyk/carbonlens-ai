import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { awsConfig } from './aws-config';

import Dashboard from './components/Dashboard';
import DocumentUpload from './components/DocumentUpload';
import CarbonAnalysis from './components/CarbonAnalysis';
import Optimizations from './components/Optimizations';
import Certificates from './components/Certificates';
import CertificateVerification from './components/CertificateVerification';
import LandingPage from './components/LandingPage';
import Navigation from './components/Navigation';

const amplifyConfig = awsConfig;

Amplify.configure(amplifyConfig);

// Public component for certificate verification and landing page
const PublicApp = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/certificates/verify/:certificateId" element={<CertificateVerification />} />
          <Route path="/*" element={<AuthenticatedApp />} />
        </Routes>
      </div>
    </Router>
  );
};

// Authenticated app component
const AuthenticatedAppComponent = ({ signOut, user }) => {
  return (
    <>
      <Navigation user={user} signOut={signOut} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/analysis" element={<CarbonAnalysis />} />
          <Route path="/optimizations" element={<Optimizations />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </>
  );
};

// Wrap the authenticated component
const AuthenticatedApp = withAuthenticator(AuthenticatedAppComponent, {
  socialProviders: [],
  signUpAttributes: ['email'],
  loginMechanisms: ['email'],
  formFields: {
    signUp: {
      email: {
        order: 1,
        placeholder: 'Enter your email address',
        required: true
      },
      password: {
        order: 2,
        placeholder: 'Enter your password',
        required: true
      },
      confirm_password: {
        order: 3,
        placeholder: 'Confirm your password',
        required: true
      }
    }
  }
});

export default PublicApp;
