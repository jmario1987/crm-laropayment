import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';

// RUTA DEFINITIVA Y CORRECTA
// Apunta a la CARPETA 'dashboard'
import Dashboard from './components/auth/dashboard'; 

// --- Componente de ejemplo para Pipeline ---
const Pipeline = () => (
  <div>
    <h1 className="text-3xl font-bold">Pipeline</h1>
    <p>Aquí verás el estado de tus prospectos.</p>
  </div>
);

// --- Layout principal de la App ---
const MainLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-grow p-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
        </Routes>
      </main>
    </div>
  );
};

// --- El componente App principal ---
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<MainLayout />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
