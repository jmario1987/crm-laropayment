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

import Tags from '../../pages/Tags';
import ReportsPage from '../../pages/ReportsPage'; 

// --- IMPORTACIÓN DE LA NUEVA PANTALLA DE AUDITORÍA ---
import AuditPage from '../../pages/AuditPage';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // --- VALIDACIÓN DEL ROL PARA RUTAS ---
  const isSupport = user?.role === USER_ROLES.Soportista;
  const standardOperationRoles = [USER_ROLES.Admin, USER_ROLES.Supervisor, USER_ROLES.Vendedor];

  return (
    <>
      <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col h-screen">
          <Header 
            userName={user?.name} 
            onLogout={logout}
            onNewLeadClick={() => setIsNewLeadModalOpen(true)}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-grow p-4 md:p-8 overflow-y-auto">
            <Routes>
              {/* --- REDIRECCIÓN AUTOMÁTICA SEGÚN ROL --- */}
              <Route path="/" element={<Navigate to={isSupport ? "/leads" : "/dashboard"} replace />} />
              
              {/* --- RUTAS OPERATIVAS (BLOQUEADAS PARA SOPORTISTA) --- */}
              <Route path="/dashboard" element={<ProtectedRoute roles={standardOperationRoles}><Dashboard /></ProtectedRoute>} />
              <Route path="/pipeline" element={<ProtectedRoute roles={standardOperationRoles}><Pipeline /></ProtectedRoute>} />
              <Route path="/won-leads" element={<ProtectedRoute roles={standardOperationRoles}><WonLeadsPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute roles={standardOperationRoles}><ReportsPage /></ProtectedRoute>} />

              {/* --- RUTAS ACCESIBLES PARA TODOS (INCLUYENDO SOPORTISTA) --- */}
              <Route path="/leads" element={<LeadsListPage />} />

              {/* --- RUTAS PROTEGIDAS PARA ADMINISTRADORES --- */}
              <Route path="/users" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Users /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Products /></ProtectedRoute>} />
              <Route path="/providers" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Providers /></ProtectedRoute>} />
              <Route path="/stages" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Stages /></ProtectedRoute>} />
              <Route path="/tags" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><Tags /></ProtectedRoute>} />
              
              {/* BITÁCORA DE AUDITORÍA */}
              <Route path="/auditoria" element={<ProtectedRoute roles={[USER_ROLES.Admin]}><AuditPage /></ProtectedRoute>} />

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