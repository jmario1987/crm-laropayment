import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LeadProvider } from './context/LeadContext';

// ORDEN CORREGIDO Y SIN STRICTMODE
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <LeadProvider>
        <App />
      </LeadProvider>
    </AuthProvider>
  </BrowserRouter>
);