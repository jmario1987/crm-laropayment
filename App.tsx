import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importa los componentes de layout y seguridad
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { USER_ROLES } from './types';

// Importa los componentes REALES de las páginas
import Dashboard from './components/dashboard/Dashboard';
import Pipeline from './components/pipeline/Pipeline';
import Users from './pages/Users';
import Products from './pages/Products';
import Providers from './pages/Providers';
import Stages from './pages/Stages';

// --- Layout principal de la App ---
const MainLayout = () => {
  // (Este layout ya no necesita ser modificado, lo dejamos como estaba)
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-grow p-8">
        <Routes>
          {/* La primera ruta que ve un usuario logueado es el dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Rutas Públicas (accesibles para todos los usuarios logueados) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />

          {/* Rutas Protegidas (solo para Administradores) */}
          <Route path="/users" element={
            <ProtectedRoute roles={[USER_ROLES.Admin]}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute roles={[USER_ROLES.Admin]}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/providers" element={
            <ProtectedRoute roles={[USER_ROLES.Admin]}>
              <Providers />
            </ProtectedRoute>
          } />
          <Route path="/stages" element={
            <ProtectedRoute roles={[USER_ROLES.Admin]}>
              <Stages />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

// --- El componente App principal ---
function App() {
  return (
    <Routes>
      {/* Ruta pública para el login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Todas las demás rutas están protegidas por el guardia */}
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
