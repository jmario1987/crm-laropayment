import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadStatus, USER_ROLES, StatusHistoryEntry } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';

interface LeadFormProps {
  lead?: Lead;
  onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onSuccess }) => {
  const { dispatch, sellers, products, providers, stages, tags } = useLeads();
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
    observations: '',
    affiliateNumber: lead?.affiliateNumber || '',
    tagIds: lead?.tagIds || [],
  });

  const isWonStageSelected = useMemo(() => {
    const selectedStage = stages.find(s => s.id === formData.status);
    return selectedStage?.type === 'won';
  }, [formData.status, stages]);

  const relevantTags = useMemo(() => {
    return tags.filter(tag => tag.stageId === formData.status);
  }, [formData.status, tags]);

  const tagOptions = relevantTags.map(t => ({ value: t.id, label: t.name }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
        setFormData((prev) => ({ ...prev, [name]: value, tagIds: [] }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleProductSelectionChange = (selectedIds: string[]) => {
      setFormData(prev => ({...prev, productIds: selectedIds}));
  };

  const handleTagSelectionChange = (selectedIds: string[]) => {
    setFormData(prev => ({...prev, tagIds: selectedIds}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isWonStageSelected && !formData.affiliateNumber.trim()) {
        alert('El Número de Afiliado es obligatorio para marcar un prospecto como Ganado.');
        return;
    }

    let finalObservations = lead?.observations || '';
    if (formData.observations.trim() !== '') {
        const autor = user.name || 'Usuario del Sistema';
        const fecha = new Date().toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
        const entradaHistorial = `--- ${fecha} - ${autor} ---\n${formData.observations.trim()}`;
        finalObservations = entradaHistorial + '\n\n' + (lead?.observations || '');
    }

    const notificationUpdates: Partial<Lead> = {};
    const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;

    if (lead) {
      if (isManager && formData.observations.trim() !== '') {
        notificationUpdates.notificationForSeller = true;
        notificationUpdates.notificationForManagerId = user.id;
        notificationUpdates.sellerHasViewedNotification = false;
      }
      else if (!isManager && lead.notificationForSeller) {
        notificationUpdates.notificationForSeller = false;
        notificationUpdates.sellerHasViewedNotification = true;
      }
    }

    // <-- CAMBIO CLAVE: Lógica corregida para actualizar el historial de etapas
    let updatedStatusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (!lead) { // Si es un prospecto nuevo
        updatedStatusHistory = [{ status: formData.status as LeadStatus, date: new Date().toISOString() }];
    } else if (lead.status !== formData.status) { // Si es uno existente y la etapa cambió
        updatedStatusHistory = [...updatedStatusHistory, { status: formData.status as LeadStatus, date: new Date().toISOString() }];
    }

    const ownerId = isManager ? formData.ownerId : user.id;

    const newLeadData: Partial<Lead> = {
      id: lead?.id || new Date().toISOString(),
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      status: formData.status as LeadStatus,
      createdAt: lead?.createdAt || new Date().toISOString(),
      statusHistory: updatedStatusHistory, // Se usa el historial corregido
      ownerId,
      productIds: formData.productIds,
      observations: finalObservations,
      lastUpdate: new Date().toISOString(),
      affiliateNumber: formData.affiliateNumber,
      tagIds: formData.tagIds,
      ...notificationUpdates,
    };

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
      {/* El resto del JSX del formulario se mantiene igual */}
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
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etapa Principal</label>
        <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          {sortedStages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </div>
      {relevantTags.length > 0 && (
        <div>
          <label htmlFor="tagIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Etapa / Etiquetas</label>
          <MultiSelectDropdown
            options={tagOptions}
            selectedValues={formData.tagIds}
            onChange={handleTagSelectionChange}
            placeholder="Seleccionar sub-etapas..."
          />
        </div>
      )}
      {isWonStageSelected && (
        <div>
          <label htmlFor="affiliateNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Número de Afiliado <span className="text-red-500">*</span>
          </label>
          <input type="text" name="affiliateNumber" id="affiliateNumber" value={formData.affiliateNumber} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
        </div>
      )}
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
        <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Añadir Observación</label>
        <textarea name="observations" id="observations" value={formData.observations} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" placeholder="Escribe aquí la nueva nota..."/>
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