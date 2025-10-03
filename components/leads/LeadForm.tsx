import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadStatus, USER_ROLES, StatusHistoryEntry } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface LeadFormProps {
  lead?: Lead;
  onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onSuccess }) => {
  const { dispatch, sellers, products, providers, stages, tags, reloadData } = useLeads();
  const { user } = useAuth();
  
  const sortedStages = useMemo(() => [...stages].sort((a,b) => a.order - b.order), [stages]);
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
    newObservation: '',
    tagId: lead?.tagIds?.[0] || '', 
  });

  const availableTags = useMemo(() => {
    return tags.filter(tag => tag.stageId === formData.status);
  }, [tags, formData.status]);

  const productOptions = useMemo(() => {
    return products.map(p => ({ value: p.id, label: p.name }));
  }, [products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'status') {
      setFormData(prev => ({ ...prev, status: value, tagId: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleProductSelectionChange = (selectedValues: string[]) => {
    setFormData(prev => ({ ...prev, productIds: selectedValues }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Error: Usuario no autenticado.");
      return;
    }

    const isNewLead = !lead;
    const leadId = lead?.id || doc(collection(db, 'leads')).id;

    let statusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (isNewLead || lead.status !== formData.status) {
      statusHistory = [...statusHistory, { status: formData.status, date: new Date().toISOString() }];
    }

    let updatedObservations = lead?.observations || '';
    if (formData.newObservation.trim() !== '') {
        const observationText = `\n---\n[${new Date().toLocaleString()}] por ${user.name}:\n${formData.newObservation.trim()}`;
        updatedObservations = (updatedObservations + observationText).trim();
    }

    const leadData: Lead = {
      ...lead,
      id: leadId,
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      status: formData.status as LeadStatus,
      ownerId: formData.ownerId,
      observations: updatedObservations,
      createdAt: lead?.createdAt || new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      providerId: formData.providerId,
      productIds: formData.productIds,
      tagIds: formData.tagId ? [formData.tagId] : [],
      statusHistory: statusHistory,
      // --- LA LÓGICA CLAVE: INCREMENTAR LA VERSIÓN ---
      _version: (lead?._version || 0) + 1,
    };

    try {
      await setDoc(doc(db, 'leads', leadId), leadData, { merge: true });
      
      if (isNewLead) {
        dispatch({ type: 'ADD_LEAD', payload: leadData });
      } else {
        dispatch({ type: 'UPDATE_LEAD', payload: leadData });
      }
      
      reloadData();
      onSuccess();
      
    } catch (error) {
      console.error("Error al guardar el prospecto: ", error);
      alert('Hubo un error al guardar el prospecto.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Prospecto</label><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label><input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etapa</label><select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">{sortedStages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></div>
      {availableTags.length > 0 && <div><label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-Etapas / Etiquetas</label><select name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"><option value="">Ninguna</option>{availableTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></div>}
      {(user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor) && <div><label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asignar a Vendedor</label><select name="ownerId" id="ownerId" value={formData.ownerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">{sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select></div>}
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Productos de Interés</label><MultiSelectDropdown options={productOptions} selectedValues={formData.productIds || []} onChange={handleProductSelectionChange} placeholder="Seleccionar productos..."/></div>
      <div><label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referido por:</label><select name="providerId" id="providerId" value={formData.providerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"><option value="">Ninguno</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></div>
      <div><label htmlFor="newObservation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Añadir Observación</label><textarea name="newObservation" id="newObservation" value={formData.newObservation} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" placeholder="Escribe aquí la nueva nota..."/></div>
      <div className="flex justify-end pt-2">
        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white">
          {lead ? 'Actualizar Prospecto' : 'Crear Prospecto'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;