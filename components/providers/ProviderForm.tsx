import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Provider } from '../../types';
import Button from '../ui/Button';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface ProviderFormProps {
  providerToEdit?: Provider;
  onSuccess: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ providerToEdit, onSuccess }) => {
  const { dispatch } = useLeads();
  const isEditMode = !!providerToEdit;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. AGREGAMOS softwareType AL ESTADO INICIAL ---
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    softwareType: '', // Nuevo campo
  });

  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        name: providerToEdit.name,
        contactPerson: providerToEdit.contactPerson,
        email: providerToEdit.email || '', 
        phone: providerToEdit.phone || '', 
        softwareType: providerToEdit.softwareType || '', // Cargamos el dato si existe
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        softwareType: '',
      });
    }
  }, [providerToEdit]);

  // --- 2. AMPLIAMOS EL TIPO DEL EVENTO PARA ACEPTAR <select> ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; 

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const providerId = providerToEdit.id;
        const docRef = doc(db, 'providers', providerId);
        
        // Incluimos el nuevo campo en la actualización
        const dataToUpdate = {
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          softwareType: formData.softwareType,
        };

        await updateDoc(docRef, dataToUpdate);
        dispatch({ type: 'UPDATE_PROVIDER', payload: { ...dataToUpdate, id: providerId } as Provider });

      } else {
        // Incluimos el nuevo campo en la creación
        const dataToSave = {
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          softwareType: formData.softwareType,
        };

        const docRef = await addDoc(collection(db, 'providers'), dataToSave);
        dispatch({ type: 'ADD_PROVIDER', payload: { ...dataToSave, id: docRef.id } as Provider });
      }
      
      onSuccess();

    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("Error: No se pudo guardar la información.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Software</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      
      {/* --- 3. NUEVO CAMPO: TIPO DE SOFTWARE --- */}
      <div>
        <label htmlFor="softwareType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Software</label>
        <select 
            name="softwareType" 
            id="softwareType" 
            value={formData.softwareType} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
            <option value="" disabled>Seleccione una opción...</option>
            <option value="Comercial">Comercial</option>
            <option value="Propietario">Propietario</option>
        </select>
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
        {/* --- 4. ACTUALIZAMOS LOS TEXTOS DEL BOTÓN --- */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Software' : 'Crear Software')}
        </Button>
      </div>
    </form>
  );
};

export default ProviderForm;