import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

const NavIcon = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.Admin;

  const handleLinkClick = () => {
    onClose(); // Cierra el menú al hacer clic en un enlace en móvil
  };

  return (
    <>
      {/* Overlay para fondo oscuro en móvil */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Menú Lateral */}
      <div className={`fixed inset-y-0 left-0 flex flex-col h-screen p-3 bg-white dark:bg-gray-800 shadow-lg w-64 z-40 transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-3 flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laro Payment</h2>
          </div>
          <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
            <NavLink to="/dashboard" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              <span className="ml-4">Dashboard</span>
            </NavLink>
            <NavLink to="/pipeline" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <span className="ml-4">Pipeline</span>
            </NavLink>
            <NavLink to="/won-leads" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
               <NavIcon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <span className="ml-4">Ganados</span>
            </NavLink>
            <NavLink to="/leads" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
               <NavIcon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <span className="ml-4">Prospectos</span>
            </NavLink>
            {isAdmin && (
              <>
                <hr className="my-2 border-gray-200 dark:border-gray-600"/>
                <NavLink to="/users" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                   <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v1a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h4z" />
                   <span className="ml-4">Usuarios</span>
                </NavLink>
                <NavLink to="/products" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                   <NavIcon path="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                   <span className="ml-4">Productos</span>
                </NavLink>
                <NavLink to="/providers" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                   <NavIcon path="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z" />
                   <span className="ml-4">Proveedores</span>
                </NavLink>
                <NavLink to="/stages" onClick={handleLinkClick} className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <NavIcon path="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                   <span className="ml-4">Etapas</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
