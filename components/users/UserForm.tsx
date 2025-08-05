
import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';
import { User, UserRole } from '../../types';
import Button from '../ui/Button';

interface UserFormProps {
  userToEdit?: User;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ userToEdit, onSuccess }) => {
  const { dispatch, users: allUsers, roles } = useLeads();
  const { user: currentUser, updateCurrentUser } = useAuth();
  
  const isEditMode = !!userToEdit;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: roles.length > 0 ? roles[0] : '',
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
      });
    }
  }, [userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isEditMode) {
      const updatedUser: User = {
        ...userToEdit,
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole,
      };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });

      if (currentUser?.id === updatedUser.id) {
        const { password, ...userToStore } = updatedUser;
        updateCurrentUser(userToStore);
      }
    } else {
      // Create mode
      if (allUsers.some(u => u.email === formData.email)) {
        setError('Ya existe un usuario con este correo electrónico.');
        return;
      }
      const newUser: User = {
        id: new Date().toISOString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as UserRole,
      };
      dispatch({ type: 'ADD_USER', payload: newUser });
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
       {!isEditMode && (
         <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>
       )}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
        <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end pt-4">
        <Button type="submit">{isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}</Button>
      </div>
    </form>
  );
};

export default UserForm;
