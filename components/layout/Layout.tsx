import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';
import Modal from '../ui/Modal';
import LeadForm from '../leads/LeadForm';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa todas tus páginas
import Dashboard from '../dashboard/Dashboard';
import Pipeline from '../pipeline/Pipeline';
import Users from '../../pages/Users';
import Products from '../../pages/Products';
import Providers from '../../pages/Providers';
import Stages from '../../pages/Stages';
import WonLeadsPage from '../../pages/WonLeadsPage';
import LeadsListPage from '../../pages/LeadsListPage';
import ProtectedRoute from '../auth/ProtectedRoute';
import { USER_ROLES } from '../../types';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Estado para el menú móvil

  return (
    <>
      <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col h-screen">
          <Header 
            userName={user?.name} 
            onLogout={logout}
            onNewLeadClick={() => setIsNewLeadModalOpen(true)}
            onMenuClick={() => setSidebarOpen(true)} // Función para abrir el menú
          />
          <main className="flex-grow p-4 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/won-leads" element={<WonLeadsPage />} />
              <Route path="/leads" element={<LeadsListPage />} />
              <Route path="/users" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Users /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Products /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Providers /></ProtectedRoute>} />
              <Route path="/stages" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Stages /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </div>
      {isNewLeadModalOpen && (
        <Modal isOpen={isNewLeadModalOpen} onClose={() => setIsNewLeadModalOpen(false)} title="Crear Nuevo Prospecto">
          <LeadForm onSuccess={() => setIsNewLeadModalOpen(false)} />
        </Modal>
      )}
    </>
  );
};

export default MainLayout;
