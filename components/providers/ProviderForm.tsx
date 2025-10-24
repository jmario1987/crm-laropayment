import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Provider } from '../../types';
import Button from '../ui/Button';

interface ProviderFormProps {
  providerToEdit?: Provider;
  onSuccess: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ providerToEdit, onSuccess }) => {
  const { dispatch } = useLeads();
  const isEditMode = !!providerToEdit;

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  // --- ESTE ES EL BLOQUE CORREGIDO ---
  useEffect(() => {
    if (providerToEdit) {
      // Si estamos en modo EDICIÓN, llena el formulario
      setFormData({
        name: providerToEdit.name,
        contactPerson: providerToEdit.contactPerson,
        email: providerToEdit.email || '', 
        phone: providerToEdit.phone || '', 
      });
    } else {
      // Si estamos en modo CREACIÓN, limpia el formulario
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
      });
    }
  }, [providerToEdit]); // Esta lógica se ejecuta CADA VEZ que el modal se abre

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const providerData: Provider = {
      id: providerToEdit?.id || new Date().toISOString(),
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
    };

    if (isEditMode) {
      dispatch({ type: 'UPDATE_PROVIDER', payload: providerData });
    } else {
      dispatch({ type: 'ADD_PROVIDER', payload: providerData });
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Desarrollador</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">{isEditMode ? 'Actualizar Desarrollador' : 'Crear Desarrollador'}</Button>
      </div>
    </form>
  );
};

export default ProviderForm;