import React, { useState } from 'react';
import { User } from '../../types';
import Button from '../ui/Button';
import { auth } from '../../firebaseConfig'; // Importamos la autenticación
import { sendPasswordResetEmail } from 'firebase/auth'; // Importamos la función de reseteo

interface ResetPasswordFormProps {
  user: User;
  onSuccess: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ user, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
        // Usamos la función oficial de Firebase para enviar el correo de reseteo
        await sendPasswordResetEmail(auth, user.email);
        setMessage(`Se ha enviado un correo para restablecer la contraseña a ${user.email}.`);
    } catch (err) {
        setError('Ocurrió un error al enviar el correo. Intente de nuevo.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Al hacer clic en el botón, se enviará un correo electrónico al usuario <strong>{user.email}</strong> con instrucciones para que pueda restablecer su contraseña de forma segura.
      </p>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Correo de Restablecimiento'}
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;