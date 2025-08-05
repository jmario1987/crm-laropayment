
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

const NavIcon: React.FC<{ path: string }> = ({ path }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
);

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    
    const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
        const baseClasses = 'flex items-center px-4 py-3 rounded-lg transition-colors';
        const activeClasses = 'bg-primary-600 text-white dark:bg-primary-600 dark:text-white';
        const inactiveClasses = 'text-gray-600 dark:text-gray-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-700';
        return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
    };

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
            <div className="flex items-center justify-center h-20 border-b dark:border-gray-700 px-4">
                 <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                    Laro<span className="font-light">Payment</span>
                </h1>
            </div>
<nav className="flex-1 p-4 space-y-2">
  <NavLink to="/dashboard" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
    <NavIcon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <span className="ml-4">Dashboard</span>
  </NavLink>
  <NavLink to="/pipeline" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
    <NavIcon path="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
    <span className="ml-4">Pipeline</span>
  </NavLink>
</nav>
                {user?.role === USER_ROLES.Admin && (
                    <>
                        <NavLink to="/users" className={getNavLinkClass}>
                            <NavIcon path="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            <span className="ml-4">Usuarios</span>
                        </NavLink>
                        <NavLink to="/products" className={getNavLinkClass}>
                           <NavIcon path="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <span className="ml-4">Productos</span>
                        </NavLink>
                        <NavLink to="/providers" className={getNavLinkClass}>
                           <NavIcon path="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z" />
                            <span className="ml-4">Proveedores</span>
                        </NavLink>
                         <NavLink to="/stages" className={getNavLinkClass}>
                           <NavIcon path="M3.5 9.5L6 12l-2.5 2.5M12 4l-2 8 2 8M20.5 9.5L18 12l2.5 2.5" />
                            <span className="ml-4">Etapas</span>
                        </NavLink>
                    </>
                )}
            </nav>
        </div>
    );
};

export default Sidebar;
