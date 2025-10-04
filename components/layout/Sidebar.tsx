// Sidebar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

// --- CAMBIO 1: Importamos el logo desde la carpeta de assets ---
import logoLaro from '../../assets/logo-sidebar.png'; // Asegúrate que la ruta y nombre sean correctos

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
  const { user, logout } = useAuth(); // Importamos la función de logout
  const isAdmin = user?.role === USER_ROLES.Admin;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const baseLinkClasses = "flex items-center p-2 rounded-lg transition-colors duration-200";
  const activeLinkClasses = "border-l-4 border-primary-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400";
  const inactiveLinkClasses = "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

  const getLinkClassName = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div className={`fixed inset-y-0 left-0 flex flex-col h-screen p-3 bg-white dark:bg-gray-800 shadow-lg w-64 z-40 transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* --- CAMBIO 2: Se añade el contenedor del logo en la parte superior --- */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
            <img src={logoLaro} alt="Logo Laro Payment" className="h-12 w-auto" />
        </div>

        <div className="space-y-3 flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-2">
            <NavLink to="/dashboard" onClick={handleLinkClick} className={getLinkClassName}>
              <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              <span className="ml-4">Dashboard</span>
            </NavLink>
            <NavLink to="/pipeline" onClick={handleLinkClick} className={getLinkClassName}>
              <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <span className="ml-4">Pipeline</span>
            </NavLink>
            <NavLink to="/won-leads" onClick={handleLinkClick} className={getLinkClassName}>
               <NavIcon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <span className="ml-4">Ganados</span>
            </NavLink>
            <NavLink to="/leads" onClick={handleLinkClick} className={getLinkClassName}>
               <NavIcon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <span className="ml-4">Prospectos</span>
            </NavLink>
            
            {isAdmin && (
              <>
                {/* --- CAMBIO 3: Se añade el título de la sección de Administración --- */}
                <div className="pt-4 pb-2 px-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Administración</span>
                </div>
                
                <NavLink to="/users" onClick={handleLinkClick} className={getLinkClassName}>
                   <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v1a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h4z" />
                   <span className="ml-4">Usuarios</span>
                </NavLink>
                <NavLink to="/products" onClick={handleLinkClick} className={getLinkClassName}>
                   <NavIcon path="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                   <span className="ml-4">Productos</span>
                </NavLink>
                <NavLink to="/providers" onClick={handleLinkClick} className={getLinkClassName}>
                   <NavIcon path="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z" />
                   <span className="ml-4">Proveedores</span>
                </NavLink>
                <NavLink to="/stages" onClick={handleLinkClick} className={getLinkClassName}>
                    <NavIcon path="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                   <span className="ml-4">Etapas</span>
                </NavLink>
                <NavLink to="/tags" onClick={handleLinkClick} className={getLinkClassName}>
                    <NavIcon path="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l4.707 4.707H20a1 1 0 011 1v4a1 1 0 01-1 1h-1.586l-4.707 4.707a1 1 0 01-1.414 0l-4.707-4.707zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                   <span className="ml-4">Sub-Etapas</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* --- CAMBIO 4: Se añade la sección del perfil y cierre de sesión al final --- */}
        <div className="mt-auto p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 p-2">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                </div>
            </div>
            <button 
              onClick={logout} 
              className="w-full mt-2 flex items-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <NavIcon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              <span className="ml-4">Cerrar Sesión</span>
            </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;