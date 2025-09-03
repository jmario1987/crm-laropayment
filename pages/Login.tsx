import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales incorrectas. Por favor, intente de nuevo.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingrese su email para restablecer la contraseña.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('¡Revisa tu correo! Se ha enviado un enlace para restablecer tu contraseña.');
    } catch (err) {
      setError('Error al enviar el correo. Verifica que la dirección sea correcta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Estilos del contenedor principal de LoginPage.tsx
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Estilos de la tarjeta de LoginPage.tsx */}
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        
        {/* Título simple de LoginPage.tsx */}
        <h2 className="text-2xl font-bold text-center mb-6">CRM Laro Payment</h2>

        {isResetMode ? (
          <form onSubmit={handlePasswordReset}>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
                </label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Escribe tu correo electrónico"
                required
                />
            </div>
            {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
            {message && <p className="text-sm text-green-500 text-center mb-4">{message}</p>}
            <div className="mb-4">
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Spinner size="sm"/> : 'Enviar Enlace'}
                </Button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsResetMode(false); setError(''); setMessage(''); }}
                className="text-sm font-bold text-gray-600 hover:text-gray-800"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Tu correo electrónico"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Tu contraseña"
                required
              />
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => { setIsResetMode(true); setError(''); setMessage(''); }}
                  className="text-sm font-bold text-gray-600 hover:text-gray-800"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
            <div>
              <Button
                className="w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? <Spinner size="sm"/> : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;