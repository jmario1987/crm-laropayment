import React from 'react';
// Se elimina la importación de BrowserRouter de aquí
import { Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';

// --- Componentes de ejemplo ---
const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p>Bienvenido a tu panel de control.</p>
  </div>
);

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

// --- App principal ---
function App() {
  // Se eliminó el <BrowserRouter> que envolvía todo
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<MainLayout />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
