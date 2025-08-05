import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// RUTAS CORREGIDAS Y CONFIRMADAS
// La dirección correcta es: entrar a 'components', luego a 'layout', y ahí está el archivo.
import Sidebar from './components/layout/Sidebar';
import LoginPage from './components/layout/LoginPage';

// --- Componentes de ejemplo para las páginas internas ---
const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p>Bienvenido a tu panel de control.</p>
  </div>
);

const Pipeline = () => (
  <div>
    <h1 className="text-3xl font-bold">Pipeline</h1>
    <p>Aquí verás el estado de tus prospectos.</p>
  </div>
);
// --- Fin de componentes de ejemplo ---


// --- Layout principal de la App (cuando el usuario ya inició sesión) ---
const MainLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-grow p-8">
        <Routes>
          {/* Rutas internas que se muestran junto al Sidebar */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
        </Routes>
      </main>
    </div>
  );
};


// --- El componente App principal que decide qué mostrar ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el inicio de sesión */}
        <Route path="/login" element={<LoginPage />} />

        {/* Cuando el usuario vaya a cualquier otra ruta, se muestra el layout principal */}
        <Route path="/*" element={<MainLayout />} />

        {/* Redirección: Si alguien entra a la raíz, lo enviamos a /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
