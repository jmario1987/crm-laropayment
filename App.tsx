import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importa la lógica de autenticación
import { useAuth } from './hooks/useAuth';

// Importa los componentes de layout y seguridad
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';
import Header from './components/layout/Header'; // Importamos el Header
import ProtectedRoute from './components/auth/ProtectedRoute';
import Modal from './components/ui/Modal';
import LeadForm from './components/leads/LeadForm';
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
  const { user, logout } = useAuth();
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  return (
    <>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen">
          {/* Añadimos el Header aquí, pasándole la información que necesita */}
          <Header 
            userName={user?.name} 
            onLogout={logout}
            onNewLeadClick={() => setIsNewLeadModalOpen(true)}
          />
          {/* El contenido principal ahora tiene un scroll si es necesario */}
          <main className="flex-grow p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/users" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Users /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Products /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Providers /></ProtectedRoute>} />
              <Route path="/stages" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Stages /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Modal para crear un nuevo prospecto, controlado por el Header */}
      {isNewLeadModalOpen && (
        <Modal isOpen={isNewLeadModalOpen} onClose={() => setIsNewLeadModalOpen(false)} title="Crear Nuevo Prospecto">
          <LeadForm onSuccess={() => setIsNewLeadModalOpen(false)} />
        </Modal>
      )}
    </>
  );
};

// --- El componente App principal ---
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
