import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Product } from '../../types';
import Button from '../ui/Button';

interface ProductFormProps {
  productToEdit?: Product;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSuccess }) => {
  const { dispatch } = useLeads();
  const isEditMode = !!productToEdit;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        description: productToEdit.description,
      });
    }
  }, [productToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData: Product = {
        id: productToEdit?.id || new Date().toISOString(),
        name: formData.name,
        description: formData.description
    };

    if (isEditMode) {
        dispatch({ type: 'UPDATE_PRODUCT', payload: productData });
    } else {
        dispatch({ type: 'ADD_PRODUCT', payload: productData });
    }
    
    onSuccess();
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
        <Button type="submit">{isEditMode ? 'Actualizar Producto' : 'Crear Producto'}</Button>
      </div>
    </form>
  );
};

export default ProductForm;