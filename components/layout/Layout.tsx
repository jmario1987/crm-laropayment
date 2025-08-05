
import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import LeadForm from '../leads/LeadForm';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen text-gray-800 dark:text-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onNewLeadClick={() => setIsModalOpen(true)}
          userName={user?.name}
          onLogout={logout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Nuevo Prospecto">
        <LeadForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Layout;