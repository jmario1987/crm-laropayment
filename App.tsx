import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login'; // <-- CAMBIO IMPORTANTE
import MainLayout from './components/layout/Layout';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} /> {/* <-- CAMBIO IMPORTANTE */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;