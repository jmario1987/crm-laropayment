import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LeadProvider } from './context/LeadContext'; // ¡El cerebro de los datos!

// El código final que une toda la lógica.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LeadProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LeadProvider>
    </BrowserRouter>
  </React.StrictMode>
);
