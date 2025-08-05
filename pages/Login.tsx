import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales incorrectas. Por favor, intente de nuevo.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                Laro Payment CRM
            </h1>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="admin@crm.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm"/> : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            <p className="font-bold">Usuarios de prueba:</p>
            <p>admin@crm.com (Admin)</p>
            <p>supervisor@crm.com (Supervisor)</p>
            <p>vendedor1@crm.com (Vendedor)</p>
            <p>vendedor2@crm.com (Vendedor)</p>
            <p>vendedor3@crm.com (Vendedor)</p>
            <p>Contraseña para todos: <strong>password</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Login;