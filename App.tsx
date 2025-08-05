
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Pipeline from './components/pipeline/Pipeline';
import Login from './pages/Login';
import Users from './pages/Users';
import Products from './pages/Products';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { USER_ROLES } from './types';
import Providers from './pages/Providers';
import Stages from './pages/Stages';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/users" element={
                  <ProtectedRoute roles={[USER_ROLES.Admin]}>
                    <Users />
                  </ProtectedRoute>
                } />
                 <Route path="/products" element={
                  <ProtectedRoute roles={[USER_ROLES.Admin]}>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/providers" element={
                  <ProtectedRoute roles={[USER_ROLES.Admin]}>
                    <Providers />
                  </ProtectedRoute>
                } />
                <Route path="/stages" element={
                  <ProtectedRoute roles={[USER_ROLES.Admin]}>
                    <Stages />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;
