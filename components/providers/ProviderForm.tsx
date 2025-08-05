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
  });

  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        name: providerToEdit.name,
        contactPerson: providerToEdit.contactPerson,
      });
    }
  }, [providerToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const providerData: Provider = {
        id: providerToEdit?.id || new Date().toISOString(),
        name: formData.name,
        contactPerson: formData.contactPerson
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Proveedor</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit">{isEditMode ? 'Actualizar Proveedor' : 'Crear Proveedor'}</Button>
      </div>
    </form>
  );
};

export default ProviderForm;