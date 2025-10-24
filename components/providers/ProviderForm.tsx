import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Provider } from '../../types';
import Button from '../ui/Button';
// --- 1. IMPORTAMOS LAS FUNCIONES DE FIREBASE ---
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface ProviderFormProps {
  providerToEdit?: Provider;
  onSuccess: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ providerToEdit, onSuccess }) => {
  const { dispatch } = useLeads();
  const isEditMode = !!providerToEdit;

  // --- 2. AÑADIMOS UN ESTADO DE "GUARDANDO" ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        name: providerToEdit.name,
        contactPerson: providerToEdit.contactPerson,
        email: providerToEdit.email || '', 
        phone: providerToEdit.phone || '', 
      });
    } else {
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

  // --- 3. CONVERTIMOS EL SUBMIT EN UNA FUNCIÓN ASÍNCRONA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Evitar doble click

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // --- LÓGICA DE ACTUALIZAR (UPDATE) ---
        const providerId = providerToEdit.id;
        const docRef = doc(db, 'providers', providerId);
        
        // Creamos el objeto solo con los campos a actualizar
        const dataToUpdate = {
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
        };

        // 1. Guardamos en Firebase
        await updateDoc(docRef, dataToUpdate);
        
        // 2. Actualizamos el estado local (memoria)
        dispatch({ type: 'UPDATE_PROVIDER', payload: { ...dataToUpdate, id: providerId } as Provider });

      } else {
        // --- LÓGICA DE CREAR (ADD) ---
        
        // Creamos el objeto a guardar (sin ID, Firebase lo genera)
        const dataToSave = {
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
        };

        // 1. Guardamos en Firebase y obtenemos la referencia
        const docRef = await addDoc(collection(db, 'providers'), dataToSave);

        // 2. Actualizamos el estado local (memoria) CON EL NUEVO ID
        dispatch({ type: 'ADD_PROVIDER', payload: { ...dataToSave, id: docRef.id } as Provider });
      }
      
      onSuccess(); // Cerramos el modal

    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      alert("Error: No se pudo guardar el desarrollador.");
    } finally {
      setIsSubmitting(false); // Reactivamos el botón
    }
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
        {/* 4. DESHABILITAMOS EL BOTÓN MIENTRAS GUARDA */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Desarrollador' : 'Crear Desarrollador')}
        </Button>
      </div>
    </form>
  );
};

export default ProviderForm;