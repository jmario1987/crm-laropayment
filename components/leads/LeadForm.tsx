import React, { useState, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadStatus } from '../../types';
import Button from '../ui/Button';
import { USER_ROLES } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';

interface LeadFormProps {
  lead?: Lead;
  onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onSuccess }) => {
  const { dispatch, sellers, products, providers, stages } = useLeads();
  const { user } = useAuth();
  
  const sortedStages = [...stages].sort((a,b) => a.order - b.order);
  const defaultStatus = sortedStages.find(s => s.type === 'open')?.id || sortedStages[0]?.id || '';

  const [formData, setFormData] = useState({
    name: lead?.name || '',
    company: lead?.company || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    status: lead?.status || defaultStatus,
    ownerId: lead?.ownerId || (user?.role === USER_ROLES.Vendedor ? user.id : (sellers[0]?.id || '')),
    productIds: lead?.productIds || [],
    providerId: lead?.providerId || '',
    observations: lead?.observations || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleProductSelectionChange = (selectedIds: string[]) => {
      setFormData(prev => ({...prev, productIds: selectedIds}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const ownerId = (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor) 
      ? formData.ownerId 
      : user.id;

    // CORRECCIÓN AQUÍ: Construimos el objeto base
    const newLeadData: Partial<Lead> = {
      id: lead?.id || new Date().toISOString(),
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      status: formData.status as LeadStatus,
      createdAt: lead?.createdAt || new Date().toISOString(),
      statusHistory: lead?.statusHistory || [{ status: formData.status as LeadStatus, date: new Date().toISOString() }],
      ownerId,
      productIds: formData.productIds,
      observations: formData.observations,
    };

    // Y añadimos el providerId solo si tiene un valor
    if (formData.providerId) {
        newLeadData.providerId = formData.providerId;
    }

    if (lead) {
      dispatch({ type: 'UPDATE_LEAD', payload: newLeadData as Lead });
    } else {
      dispatch({ type: 'ADD_LEAD', payload: newLeadData as Lead });
    }
    onSuccess();
  };

  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
        <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
        <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          {sortedStages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </div>
       {(user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor) && (
        <div>
          <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asignar a Vendedor</label>
          <select name="ownerId" id="ownerId" value={formData.ownerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
            {sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="productIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Productos de Interés</label>
        <MultiSelectDropdown
          options={productOptions}
          selectedValues={formData.productIds}
          onChange={handleProductSelectionChange}
          placeholder="Seleccionar productos..."
        />
      </div>
      <div>
        <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referido por:</label>
        <select name="providerId" id="providerId" value={formData.providerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          <option value="">Ninguno</option>
          {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
        </select>
      </div>
       <div>
        <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
        <textarea name="observations" id="observations" value={formData.observations} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
      </div>
      <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
        <Button type="submit">
          {lead ? 'Actualizar Prospecto' : 'Guardar Prospecto'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;