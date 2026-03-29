import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';
import { User, UserRole } from '../../types';
import Button from '../ui/Button';
import { firebaseConfig, db } from '../../firebaseConfig'; 
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore'; // Agregamos updateDoc
import { getApps } from 'firebase/app';

// Creamos una app secundaria de Firebase para no afectar la sesión del admin
const secondaryApp = getApps().find(app => app.name === 'secondaryApp') || initializeApp(firebaseConfig, 'secondaryApp');
const secondaryAuth = getAuth(secondaryApp);

interface UserFormProps {
  userToEdit?: User;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ userToEdit, onSuccess }) => {
  const { dispatch, roles } = useLeads();
  const { user: currentUser, updateCurrentUser } = useAuth();
  
  const isEditMode = !!userToEdit;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: roles.length > 0 ? roles[0] : '',
    isActive: true, // Por defecto, al crear, el usuario está activo
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      // Si el usuario viejo no tiene el campo isActive, asumimos true
      const userIsActive = userToEdit.isActive !== undefined ? userToEdit.isActive : true;
      setFormData({ 
          name: userToEdit.name, 
          email: userToEdit.email, 
          password: '', 
          role: userToEdit.role,
          isActive: userIsActive
      });
    }
  }, [userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Si el input es un checkbox (nuestro switch de activo/inactivo)
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isEditMode) {
      // Lógica de edición
      const updatedUser: User = { 
          ...userToEdit!, 
          name: formData.name, 
          email: formData.email, 
          role: formData.role as UserRole,
          isActive: formData.isActive
      };
      
      try {
        const userRef = doc(db, "users", userToEdit!.id);
        
        // Protegemos que un Admin no se pueda desactivar a sí mismo por error
        if (currentUser?.id === updatedUser.id && !formData.isActive) {
            setError("No puedes desactivar tu propia cuenta de Administrador.");
            setLoading(false);
            return;
        }

        // Usamos updateDoc para solo modificar los campos que cambian
        await updateDoc(userRef, { 
            name: updatedUser.name, 
            role: updatedUser.role,
            isActive: updatedUser.isActive
        });
        
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        if (currentUser?.id === updatedUser.id) {
          updateCurrentUser(updatedUser);
        }
      } catch (err) {
        setError('No se pudo actualizar el usuario.');
        console.error(err);
        setLoading(false);
        return;
      }
    } else {
      // Lógica de creación
      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const newFirebaseUser = userCredential.user;

        const newUserProfile: User = {
          id: newFirebaseUser.uid,
          name: formData.name,
          email: formData.email,
          role: formData.role as UserRole,
          isActive: true // Siempre nace activo
        };

        const newUserDocRef = doc(db, 'users', newFirebaseUser.uid);
        await setDoc(newUserDocRef, newUserProfile);

        dispatch({ type: 'ADD_USER', payload: newUserProfile });

      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Este correo electrónico ya está registrado.');
        } else {
          console.error(err);
          setError('Ocurrió un error al crear el usuario.');
        }
        setLoading(false);
        return;
      }
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
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50" />
      </div>
      
      {!isEditMode && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña Temporal</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>
      )}
      
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
        <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          {roles.map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      {/* --- NUEVO SWITCH: Mostrar solo en modo edición --- */}
      {isEditMode && (
        <div className="flex items-center pt-2">
            <input 
                type="checkbox" 
                id="isActive" 
                name="isActive" 
                checked={formData.isActive} 
                onChange={handleChange}
                // Deshabilitamos el switch si el usuario intenta desactivarse a sí mismo
                disabled={currentUser?.id === userToEdit?.id} 
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Cuenta Activa (Permitir acceso al sistema)
            </label>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-500 bg-red-50 p-2 rounded">{error}</p>}
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (isEditMode ? 'Actualizar Usuario' : 'Crear Usuario')}</Button>
      </div>
    </form>
  );
};

export default UserForm;