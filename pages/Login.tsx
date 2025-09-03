import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
// --- NUEVA ADICIÓN ---
// Importa la función de Firebase para enviar el correo y tu configuración de 'auth'
// Asegúrate de que la ruta a tu archivo de configuración de Firebase sea la correcta.
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // <--- VERIFICA ESTA RUTA

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- NUEVA ADICIÓN ---
  // Estado para cambiar entre el modo de Login y el modo de "Olvidé Contraseña"
  const [isResetMode, setIsResetMode] = useState(false);
  // Estado para mostrar mensajes de éxito (ej. "Correo enviado")
  const [message, setMessage] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage(''); // Limpiar mensajes
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales incorrectas. Por favor, intente de nuevo.');
    }
  };

  // --- NUEVA ADICIÓN ---
  // Función para manejar el envío del correo de restablecimiento
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                Laro Payment CRM
            </h1>
        </div>
        
        {isResetMode ? (
            // --- NUEVA ADICIÓN ---
            // Formulario para "Olvidé Contraseña"
            <form className="space-y-6" onSubmit={handlePasswordReset}>
              <h2 className="text-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                Restablecer Contraseña
              </h2>
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
                  placeholder="Escribe tu correo electrónico"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {message && <p className="text-sm text-green-500">{message}</p>}
              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Spinner size="sm"/> : 'Enviar Enlace de Recuperación'}
                </Button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                    setMessage('');
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </form>
        ) : (
            // Tu formulario de Login original con un pequeño añadido
            <>
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
                    
                    {/* --- NUEVA ADICIÓN --- */}
                    <div className="text-right">
                        <button
                        type="button"
                        onClick={() => {
                            setIsResetMode(true);
                            setError('');
                            setMessage('');
                        }}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                        ¿Olvidaste tu contraseña?
                        </button>
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
            </>
        )}
      </div>
    </div>
  );
};

export default Login;