import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
// --- RUTA CORREGIDA AQUÍ ---
import Spinner from '../components/ui/Spinner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// --- IMPORTACIÓN DEL LOGO ---
import companyLogo from '../assets/logo-laro.png';

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

  const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex bg-[#0F2D4A] lg:bg-gray-100">
      
      <div className="hidden lg:flex w-1/2 bg-[#0F2D4A] items-center justify-center p-12 text-white flex-col">
        <img src={companyLogo} alt="Laro Payments Logo" className="w-2/3 max-w-xs mb-8" />
        <h1 className="text-3xl font-bold text-center">Bienvenido a tu CRM</h1>
        <p className="mt-2 text-center text-gray-300">Gestiona tus prospectos de forma eficiente.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          <div className="lg:hidden flex justify-center mb-6">
            <img src={companyLogo} alt="Laro Payments Logo" className="w-40" />
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg w-full">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              {isResetMode ? 'Restablecer Contraseña' : 'Iniciar Sesión'}
            </h2>
            <p className="text-center text-gray-500 mb-8">
              {isResetMode ? 'Ingresa tu correo para recibir un enlace.' : 'Ingresa tus credenciales para acceder.'}
            </p>

            {isResetMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email-reset">Email</label>
                    <input id="email-reset" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="Escribe tu correo electrónico" required />
                </div>
                
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {message && <p className="text-sm text-green-500 text-center">{message}</p>}

                <div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Spinner size="sm"/> : 'Enviar Enlace'}
                    </Button>
                </div>
                <div className="text-center">
                  <button type="button" onClick={() => { setIsResetMode(false); setError(''); setMessage(''); }} className="text-sm font-bold text-blue-600 hover:underline">
                    Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email-login">Email</label>
                  <input id="email-login" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="tu.correo@ejemplo.com" required />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-gray-700 text-sm font-bold" htmlFor="password">Contraseña</label>
                        <button type="button" onClick={() => { setIsResetMode(true); setError(''); setMessage(''); }} className="text-sm font-bold text-blue-600 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} placeholder="••••••••" required />
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                
                <div>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? <Spinner size="sm"/> : 'Acceder'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;