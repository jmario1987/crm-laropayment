import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importa los componentes de layout
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';

// Importa los componentes REALES de las páginas
import Dashboard from './components/dashboard/Dashboard';
import Pipeline from './components/pipeline/Pipeline'; // ¡Importamos el Pipeline real!

// --- Layout principal de la App ---
const MainLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-grow p-8">
        <Routes>
          {/* Las rutas ahora usan los componentes reales que importamos */}
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
