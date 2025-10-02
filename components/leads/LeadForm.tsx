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
    tagId: lead?.tagIds?.[0] || '', 
  });

  const isWonStageSelected = useMemo(() => {
    const selectedStage = stages.find(s => s.id === formData.status);
    return selectedStage?.type === 'won';
  }, [formData.status, stages]);

  const relevantTags = useMemo(() => {
    return tags.filter(tag => tag.stageId === formData.status);
  }, [formData.status, tags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
        setFormData((prev) => ({ ...prev, [name]: value, tagId: '' }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleProductSelectionChange = (selectedIds: string[]) => {
      setFormData(prev => ({...prev, productIds: selectedIds}));
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
    
    let updatedStatusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (!lead) {
        updatedStatusHistory = [{ status: formData.status as LeadStatus, date: new Date().toISOString() }];
    } else if (lead.status !== formData.status) {
        updatedStatusHistory = [...updatedStatusHistory, { status: formData.status as LeadStatus, date: new Date().toISOString() }];
    }

    const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
    const ownerId = isManager ? formData.ownerId : user.id;

    // CAMBIO CLAVE: Construimos un objeto parcial y luego lo fusionamos para asegurar que el objeto final es un 'Lead' completo.
    const partialNewData: Partial<Lead> = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        status: formData.status as LeadStatus,
        statusHistory: updatedStatusHistory,
        ownerId,
        productIds: formData.productIds,
        observations: finalObservations,
        lastUpdate: new Date().toISOString(),
        affiliateNumber: formData.affiliateNumber,
        tagIds: formData.tagId ? [formData.tagId] : [],
        providerId: formData.providerId,
    };

    if (lead) {
      // Para actualizar, fusionamos el prospecto viejo con los datos nuevos
      const updatedLead: Lead = { ...lead, ...partialNewData };
      dispatch({ type: 'UPDATE_LEAD', payload: updatedLead });
    } else {
      // Para crear, necesitamos un objeto Lead completo
      const newLead: Lead = {
        id: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...partialNewData,
        // Aseguramos que todos los campos obligatorios estén presentes
        name: partialNewData.name!,
        company: partialNewData.company!,
        email: partialNewData.email!,
        phone: partialNewData.phone!,
        status: partialNewData.status!,
        ownerId: partialNewData.ownerId!,
        observations: partialNewData.observations!,
        lastUpdate: partialNewData.lastUpdate!,
      };
      dispatch({ type: 'ADD_LEAD', payload: newLead });
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
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etapa Principal</label>
        <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
          {sortedStages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
      </div>
      {relevantTags.length > 0 && (
        <div>
          <label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-Etapa</label>
          <select name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
            <option value="">Ninguna</option>
            {relevantTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
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
          selectedValues={formData.productIds || []}
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