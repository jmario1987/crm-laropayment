import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Product } from '../../types';
import Button from '../ui/Button';
// --- 1. IMPORTAMOS LAS FUNCIONES DE FIREBASE ---
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

interface ProductFormProps {
  productToEdit?: Product;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSuccess }) => {
  const { dispatch } = useLeads();
  const isEditMode = !!productToEdit;

  // --- 2. AÑADIMOS UN ESTADO DE "GUARDANDO" ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Corregido: Limpiar formulario al cambiar de modo
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        description: productToEdit.description,
      });
    } else {
      setFormData({ // Limpiar al pasar a modo Crear
        name: '',
        description: '',
      });
    }
  }, [productToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        const productId = productToEdit.id;
        const docRef = doc(db, 'products', productId);
        
        const dataToUpdate = {
          name: formData.name,
          description: formData.description,
        };

        // 1. Guardamos en Firebase
        await updateDoc(docRef, dataToUpdate);
        
        // 2. Actualizamos el estado local (memoria)
        dispatch({ type: 'UPDATE_PRODUCT', payload: { ...dataToUpdate, id: productId } as Product });

      } else {
        // --- LÓGICA DE CREAR (ADD) ---
        const dataToSave = {
          name: formData.name,
          description: formData.description,
        };

        // 1. Guardamos en Firebase y obtenemos la referencia
        const docRef = await addDoc(collection(db, 'products'), dataToSave);

        // 2. Actualizamos el estado local (memoria) CON EL NUEVO ID
        dispatch({ type: 'ADD_PRODUCT', payload: { ...dataToSave, id: docRef.id } as Product });
      }
      
      onSuccess(); // Cerramos el modal

    } catch (error) {
      console.error("Error guardando producto en Firebase:", error);
      alert("Error: No se pudo guardar el producto.");
    } finally {
      setIsSubmitting(false); // Reactivamos el botón
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div className="flex justify-end pt-4">
        {/* 4. DESHABILITAMOS EL BOTÓN MIENTRAS GUARDA */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Crear Producto')}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;