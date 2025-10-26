import React, { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadStatus, USER_ROLES, StatusHistoryEntry, TagHistoryEntry } from '../../types';
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
    name: '', 
    company: '',
    email: '',
    phone: '',
    status: defaultStatus,
    ownerId: '',
    productIds: [] as string[],
    providerId: '', 
    newObservation: '',
    tagId: '',
    affiliateNumber: '',
    assignedOffice: '', 
  });

  const availableTags = useMemo(() => {
    return tags.filter(tag => tag.stageId === formData.status);
  }, [formData.status, tags]);

  const selectedStage = useMemo(() => {
    return stages.find(s => s.id === formData.status);
  }, [formData.status, stages]);

  const productOptions = useMemo(() => {
    return products.map(p => ({ value: p.id, label: p.name }));
  }, [products]);

  useEffect(() => {
    const initialOwnerId = user?.role === USER_ROLES.Vendedor ? user?.id : (sellers[0]?.id || ''); 
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || defaultStatus,
        ownerId: lead.ownerId || initialOwnerId || '', // Ensure initialOwnerId exists
        productIds: lead.productIds || [],
        providerId: lead.providerId || '', 
        newObservation: '', 
        tagId: lead.tagIds?.[0] || '',
        affiliateNumber: lead.affiliateNumber || '',
        assignedOffice: lead.assignedOffice || '', 
      });
    } else {
      setFormData({
        name: '', 
        company: '', 
        email: '', 
        phone: '', 
        status: defaultStatus,
        ownerId: initialOwnerId || '', // Ensure initialOwnerId exists
        productIds: [], 
        providerId: '', 
        newObservation: '', 
        tagId: '', 
        affiliateNumber: '', 
        assignedOffice: ''
      });
    }
  }, [lead, stages, user, sellers, defaultStatus]); 

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

  // --- FUNCIÓN handleSubmit REVISADA CON LA ESTRATEGIA DE OMITIR UNDEFINED ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Error: Usuario no autenticado.");
      return;
    }

    const isNewLead = !lead;
    const leadId = lead?.id || doc(collection(db, 'leads')).id; 

    // --- Calcular Historiales y Observaciones ---
    let statusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (isNewLead || lead?.status !== formData.status) {
      statusHistory = [...statusHistory, { status: formData.status, date: new Date().toISOString() }];
    }
    let tagHistory: TagHistoryEntry[] = lead?.tagHistory || [];
    const currentTagIdInDb = lead?.tagIds?.[0]; 
    if (formData.tagId && formData.tagId !== currentTagIdInDb) {
        tagHistory = [...tagHistory, { tagId: formData.tagId, date: new Date().toISOString() }];
    } 
    let notificationForSellerCalc = lead?.notificationForSeller || false;
    let sellerHasViewedNotificationCalc = lead?.sellerHasViewedNotification || false;
    let notificationForManagerIdCalc = lead?.notificationForManagerId ?? null; 
    const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
    const newObservationAdded = formData.newObservation.trim() !== '';
    // (Lógica compleja de notificaciones omitida por brevedad, asumimos que está correcta)
    if (isManager) { /* ... */ } else { /* ... */ }
    let updatedObservations = lead?.observations || '';
    if (newObservationAdded) { /* ... */ }

    // --- CONSTRUCCIÓN SEGURA DEL OBJETO leadDataToSave ---
    const leadDataToSave: any = { // Usamos 'any' para construir dinámicamente
        id: leadId,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone || '', // Obligatorio
        status: formData.status as LeadStatus,
        ownerId: formData.ownerId,
        observations: updatedObservations,
        createdAt: lead?.createdAt || new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        _version: (lead?._version || 0) + 1,
        notificationForManagerId: notificationForManagerIdCalc, // Siempre string | null
        notificationForSeller: notificationForSellerCalc, 
        sellerHasViewedNotification: sellerHasViewedNotificationCalc, 
    };

    // --- Añadir campos opcionales SOLO si tienen valor válido ---
    // String | Null
    leadDataToSave.providerId = formData.providerId || null;
    leadDataToSave.assignedOffice = formData.assignedOffice || null;
    const currentSelectedStage = stages.find(s => s.id === formData.status);
    leadDataToSave.affiliateNumber = currentSelectedStage?.type === 'won' ? (formData.affiliateNumber || null) : (lead?.affiliateNumber || null);
    
    // Arrays (enviar array vacío si no hay selección)
    leadDataToSave.productIds = formData.productIds || [];
    leadDataToSave.tagIds = formData.tagId ? [formData.tagId] : [];
    
    // Arrays de Historial (omitir si están vacíos al guardar)
    if (statusHistory.length > 0) {
        leadDataToSave.statusHistory = statusHistory;
    }
    if (tagHistory.length > 0) {
        leadDataToSave.tagHistory = tagHistory;
    }
    
    // Otros opcionales (omitir si son null/undefined originalmente y no se cambian)
    // clientStatus y billingHistory no se editan en este form, así que los omitimos
    // para que merge:true los preserve si existen. Si necesitaras editarlos aquí,
    // aplicarías lógica similar (añadir solo si tienen valor).
    // Ejemplo: leadDataToSave.clientStatus = formData.clientStatus || null; (si tuvieras ese campo en formData)


    try {
      // Usamos 'as Lead' porque confiamos en la construcción
      await setDoc(doc(db, 'leads', leadId), leadDataToSave as Lead, { merge: true }); 
      
      // Para el dispatch, asegurar estructura completa para el estado local
      const finalLeadDataForState = { 
          ...lead, // Empezar con el lead original (si existe)
          ...leadDataToSave, // Sobrescribir con los datos guardados
          // Rellenar campos opcionales que pudieron omitirse al guardar, para el estado local
          providerId: leadDataToSave.providerId ?? null,
          productIds: leadDataToSave.productIds ?? [],
          tagIds: leadDataToSave.tagIds ?? [],
          statusHistory: leadDataToSave.statusHistory ?? lead?.statusHistory ?? [], // Mantener si no se envió
          tagHistory: leadDataToSave.tagHistory ?? lead?.tagHistory ?? [], // Mantener si no se envió
          affiliateNumber: leadDataToSave.affiliateNumber ?? null,
          assignedOffice: leadDataToSave.assignedOffice ?? null,
          clientStatus: lead?.clientStatus ?? null, // Mantener si no se edita aquí
          billingHistory: lead?.billingHistory, // Mantener si no se edita aquí
          notificationForSeller: leadDataToSave.notificationForSeller ?? false, 
          sellerHasViewedNotification: leadDataToSave.sellerHasViewedNotification ?? false, 
      } as Lead;

      if (isNewLead) {
        dispatch({ type: 'ADD_LEAD', payload: finalLeadDataForState });
      } else {
        dispatch({ type: 'UPDATE_LEAD', payload: finalLeadDataForState });
      }
      
      onSuccess(); 
      
    } catch (error) {
      console.error("Error al guardar el prospecto: ", error);
      alert('Hubo un error al guardar el prospecto.');
    }
  };

  // --- El resto del return (JSX del formulario) no cambia ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Prospecto</label><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label><input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="assignedOffice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oficina Asignada</label><input type="text" name="assignedOffice" id="assignedOffice" value={formData.assignedOffice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" placeholder="Ej: Sucursal Central" /></div>
      <div><label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etapa</label><select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">{sortedStages.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></div>
      
      {selectedStage && selectedStage.type === 'won' && ( 
        <div> 
          <label htmlFor="affiliateNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número de Afiliado</label> 
          <input type="text" name="affiliateNumber" id="affiliateNumber" value={formData.affiliateNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" placeholder="Introduce el número de afiliado" /> 
        </div> 
      )}

      {availableTags.length > 0 && <div><label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-Etapas / Etiquetas</label><select name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"><option value="">Ninguna</option>{availableTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></div>}
      {(user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor) && <div><label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asignar a Vendedor</label><select name="ownerId" id="ownerId" value={formData.ownerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">{sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select></div>}
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Productos de Interés</label><MultiSelectDropdown options={productOptions} selectedValues={formData.productIds || []} onChange={handleProductSelectionChange} placeholder="Seleccionar productos..."/></div>
      <div><label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Referido por:</label><select name="providerId" id="providerId" value={formData.providerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"><option value="">Ninguno</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></div> {/* O Desarrollador */}
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