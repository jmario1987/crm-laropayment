import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
// 1. Importamos las herramientas de Firebase
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const LoginPage: React.FC = () => {
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

  // 2. Función de prueba para escribir en la base de datos
  const handleTestWrite = async () => {
    try {
      console.log("Intentando escribir en Firestore...");
      await setDoc(doc(db, "test_collection", "test_document"), {
        message: "Hola, Firebase!",
        timestamp: new Date()
      });
      alert("¡Prueba exitosa! Revisa tu base de datos de Firestore ahora.");
    } catch (error) {
      console.error("Error en la escritura de prueba: ", error);
      alert(`Error en la escritura de prueba. Revisa la consola del navegador.`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <div className="mb-6">
          <img 
            src="/images/logo.png" 
            alt="Logo de la Empresa" 
            className="h-16 w-auto mx-auto" 
          />
        </div>
        <form onSubmit={handleSubmit}>
          {/* ... (el resto del formulario se queda igual) ... */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Tu correo electrónico" required />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" placeholder="******************" required />
          </div>
          {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm"/> : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>

        {/* 3. Añadimos el botón de prueba */}
        <div className="mt-4 border-t pt-4">
          <Button onClick={handleTestWrite} className="w-full bg-yellow-500 hover:bg-yellow-600">
            Probar Conexión con Firebase
          </Button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;