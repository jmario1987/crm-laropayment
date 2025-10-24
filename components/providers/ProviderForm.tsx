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

  // 1. Añadimos los campos nuevos al estado
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  // 2. Cargamos los datos nuevos si estamos en modo edición
  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        name: providerToEdit.name,
        contactPerson: providerToEdit.contactPerson,
        email: providerToEdit.email || '', // Usamos || '' por si el dato no existe
        phone: providerToEdit.phone || '', // Usamos || '' por si el dato no existe
      });
    } else {
      // Limpiamos el formulario si cerramos el modal de edición y abrimos el de crear
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
      });
    }
  }, [providerToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 3. Añadimos los campos nuevos al objeto que se va a guardar
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
        {/* 4. Cambiamos el texto de la etiqueta */}
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Desarrollador</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</label>
        <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>

      {/* --- INICIO DE CAMPOS AÑADIDOS --- */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      {/* --- FIN DE CAMPOS AÑADIDOS --- */}

      <div className="flex justify-end pt-4">
        {/* 5. Cambiamos el texto de los botones */}
        <Button type="submit">{isEditMode ? 'Actualizar Desarrollador' : 'Crear Desarrollador'}</Button>
      </div>
    </form>
  );
};

export default ProviderForm;