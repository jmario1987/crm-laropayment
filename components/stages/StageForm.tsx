
import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Stage } from '../../types';
import Button from '../ui/Button';

interface StageFormProps {
  stageToEdit?: Stage;
  onSuccess: () => void;
}

const StageForm: React.FC<StageFormProps> = ({ stageToEdit, onSuccess }) => {
  const { dispatch, stages } = useLeads();
  const isEditMode = !!stageToEdit;

  const [formData, setFormData] = useState({
    name: '',
    type: 'open' as 'open' | 'won' | 'lost',
    color: '#3b82f6',
  });

  useEffect(() => {
    if (stageToEdit) {
      setFormData({
        name: stageToEdit.name,
        type: stageToEdit.type,
        color: stageToEdit.color,
      });
    }
  }, [stageToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stageData: Stage = {
      id: stageToEdit?.id || new Date().toISOString(),
      name: formData.name,
      type: formData.type,
      color: formData.color,
      order: stageToEdit?.order ?? stages.length,
    };

    if (isEditMode) {
      dispatch({ type: 'UPDATE_STAGE', payload: stageData });
    } else {
      dispatch({ type: 'ADD_STAGE', payload: stageData });
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Etapa</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Etapa</label>
        <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          <option value="open">Abierta</option>
          <option value="won">Ganada</option>
          <option value="lost">Perdida</option>
        </select>
      </div>
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
        <div className="flex items-center mt-1">
            <input type="color" name="color" id="color" value={formData.color} onChange={handleChange} required className="p-0 h-10 w-10 block bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer" />
            <span className="ml-3 px-3 py-2 rounded-md" style={{backgroundColor: formData.color, color: '#fff', textShadow: '0 0 2px #000'}}>{formData.color}</span>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit">{isEditMode ? 'Actualizar Etapa' : 'Crear Etapa'}</Button>
      </div>
    </form>
  );
};

export default StageForm;
