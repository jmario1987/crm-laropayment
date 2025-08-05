import React from 'react';

// Definiendo el componente NavLink para que funcione.
// Asumimos que tienes 'react-router-dom' instalado.
import { NavLink } from 'react-router-dom';

// Definiendo el componente NavIcon para que exista y funcione.
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

// Tu componente Sidebar, ahora completo y corregido.
const Sidebar = () => {
  // Datos de ejemplo para el usuario
  const user = {
    name: 'Mario',
    imageUrl: 'https://via.placeholder.com/150', // Una imagen de ejemplo
  };

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex">
      <div className="flex flex-col h-screen p-3 bg-white shadow w-60">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Laro Pago</h2>
            <button onClick={() => setIsOpen(!isOpen)}>
              {/* Icono de menú (hamburguesa) o de cierre (X) */}
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center py-4">
              {/* Icono de búsqueda */}
            </span>
            <input
              type="text"
              name="q"
              className="w-full py-2 pl-10 text-sm rounded-md focus:outline-none"
              placeholder="Buscar..."
              autoComplete="off"
            />
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
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
