import React from 'react';
import { NavLink } from 'react-router-dom';

const NavIcon = ({ path }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const Sidebar = () => {
  return (
    <div className="flex">
      <div className="flex flex-col h-screen p-3 bg-white shadow w-60">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Laro Pago</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/dashboard" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a2 2 0 002 2h10a2 2 0 002-2V10M9 20v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              <span className="ml-4">Dashboard</span>
            </NavLink>
            <NavLink to="/pipeline" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <span className="ml-4">Pipeline</span>
            </NavLink>
            <NavLink to="/users" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
               <NavIcon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 014 4v1a4 4 0 01-4 4H5a4 4 0 01-4-4V7a4 4 0 014-4h4zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              <span className="ml-4">Usuarios</span>
            </NavLink>
             {/* ¡Añadimos el nuevo enlace a Productos! */}
            <NavLink to="/products" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-100">
               <NavIcon path="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <span className="ml-4">Productos</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
