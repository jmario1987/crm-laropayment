import React, { useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { User } from '../../types';
import Button from '../ui/Button';

interface ResetPasswordFormProps {
  user: User;
  onSuccess: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ user, onSuccess }) => {
  const { dispatch } = useLeads();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const updatedUser: User = {
      ...user,
      password: password,
    };
    
    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
        <input 
          type="password" 
          name="password" 
          id="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end pt-4">
        <Button type="submit">Guardar Nueva Contraseña</Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
