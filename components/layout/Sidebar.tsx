import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

import logoLaro from '../../assets/logo-sidebar.png';

const NavIcon = ({ path }: { path: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth(); 
  const isAdmin = user?.role === USER_ROLES.Admin;

  // --- ESTADOS PARA CONTROLAR QUÉ MENÚ ESTÁ ABIERTO ---
  const [isOpsOpen, setIsOpsOpen] = useState(true);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(true);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const baseLinkClasses = "flex items-center px-4 py-2.5 mx-2 my-0.5 rounded-r-lg rounded-l-none transition-all duration-200 text-sm font-medium";
  const activeLinkClasses = "border-l-4 border-primary-500 bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400";
  const inactiveLinkClasses = "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent";

  const getLinkClassName = ({ isActive }: { isActive: boolean }) => 
    `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div className={`fixed inset-y-0 left-0 flex flex-col h-screen bg-white dark:bg-gray-800 shadow-lg border-r border-gray-100 dark:border-gray-700 w-64 z-40 transform transition-transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <img src={logoLaro} alt="Logo Laro Payment" className="h-14 w-auto" />
        </div>

        {/* Contenedor principal con scrollbar oculta/estilizada */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar pb-4">
          <nav className="flex-1 w-full pt-2">
            
            {/* --- SECCIÓN: OPERACIONES (DESPLEGABLE) --- */}
            <button 
                onClick={() => setIsOpsOpen(!isOpsOpen)}
                className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus:outline-none group"
            >
                <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase group-hover:text-primary-500 transition-colors">
                    Operaciones
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpsOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpsOpen && (
                <div className="space-y-1 mb-2 animate-fade-in-down">
                    <NavLink to="/dashboard" onClick={handleLinkClick} className={getLinkClassName}>
                        <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                        <span className="ml-3">Dashboard</span>
                    </NavLink>
                    <NavLink to="/pipeline" onClick={handleLinkClick} className={getLinkClassName}>
                        <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        <span className="ml-3">Pipeline</span>
                    </NavLink>
                    <NavLink to="/won-leads" onClick={handleLinkClick} className={getLinkClassName}>
                        <NavIcon path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <span className="ml-3">En Producción</span>
                    </NavLink>
                    <NavLink to="/leads" onClick={handleLinkClick} className={getLinkClassName}>
                        <NavIcon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        <span className="ml-3">Directorio</span>
                    </NavLink>
                    <NavLink to="/reports" onClick={handleLinkClick} className={getLinkClassName}>
                        <NavIcon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        <span className="ml-3 leading-tight">Reporte de Equipos y Terminales</span>
                    </NavLink>
                </div>
            )}
            
            {isAdmin && (
              <>
                <div className="w-full h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
                
                {/* --- SECCIÓN: ADMINISTRACIÓN (DESPLEGABLE) --- */}
                <button 
                    onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                    className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors focus:outline-none group"
                >
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase group-hover:text-primary-500 transition-colors">
                        Administración
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isAdminMenuOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isAdminMenuOpen && (
                    <div className="space-y-1 pb-2 animate-fade-in-down">
                        <NavLink to="/users" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v1a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h4z" />
                            <span className="ml-3">Usuarios</span>
                        </NavLink>
                        <NavLink to="/products" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            <span className="ml-3">Productos</span>
                        </NavLink>
                        <NavLink to="/providers" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z" />
                            <span className="ml-3">Desarrolladores</span>
                        </NavLink>
                        <NavLink to="/stages" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                            <span className="ml-3">Etapas</span>
                        </NavLink>
                        <NavLink to="/tags" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l4.707 4.707H20a1 1 0 011 1v4a1 1 0 01-1 1h-1.586l-4.707 4.707a1 1 0 01-1.414 0l-4.707-4.707zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <span className="ml-3">Sub-Etapas</span>
                        </NavLink>
                        
                        {/* --- NUEVO: ENLACE A AUDITORÍA --- */}
                        <NavLink to="/auditoria" onClick={handleLinkClick} className={getLinkClassName}>
                            <NavIcon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            <span className="ml-3">Auditoría</span>
                        </NavLink>
                    </div>
                )}
              </>
            )}
          </nav>
        </div>

        {/* --- PERFIL Y CERRAR SESIÓN --- */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500 shadow-sm text-white flex items-center justify-center font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium truncate">{user?.role}</p>
                </div>
            </div>
            
            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200"
            >
              <NavIcon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              <span className="ml-2">Cerrar Sesión</span>
            </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;