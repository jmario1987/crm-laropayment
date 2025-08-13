import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LeadProvider } from './context/LeadContext';
import { polyfill } from 'mobile-drag-drop'; // <-- AÑADE ESTA LÍNEA

// Activa el "traductor" táctil
polyfill(); // <-- AÑADE ESTA LÍNEA

// Aquí ya no debería estar React.StrictMode
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <LeadProvider>
        <App />
      </LeadProvider>
    </AuthProvider>
  </BrowserRouter>
);