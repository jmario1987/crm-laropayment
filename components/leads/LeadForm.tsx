import React, { useState, useMemo, useEffect } from 'react'; // Asegúrate que useEffect está importado
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

  // --- 1. AÑADIMOS assignedOffice AL ESTADO INICIAL ---
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
    assignedOffice: '', // <-- NUEVO CAMPO AÑADIDO AL ESTADO
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

  // --- 2. ACTUALIZAMOS useEffect PARA CARGAR/LIMPIAR assignedOffice ---
  useEffect(() => {
    const initialOwnerId = user?.role === USER_ROLES.Vendedor ? user?.id : (sellers[0]?.id || ''); // Asegurar que user existe
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || defaultStatus,
        ownerId: lead.ownerId || initialOwnerId,
        productIds: lead.productIds || [],
        providerId: lead.providerId || '', 
        newObservation: '', 
        tagId: lead.tagIds?.[0] || '',
        affiliateNumber: lead.affiliateNumber || '',
        assignedOffice: lead.assignedOffice || '', // <-- CARGAR DATO EXISTENTE
      });
    } else {
      // Limpiar para nuevo prospecto
      setFormData({
        name: '', 
        company: '', 
        email: '', 
        phone: '', 
        status: defaultStatus,
        ownerId: initialOwnerId || '', // Asegurar un valor inicial
        productIds: [], 
        providerId: '', 
        newObservation: '', 
        tagId: '', 
        affiliateNumber: '', 
        assignedOffice: '' // <-- LIMPIAR CAMPO NUEVO
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

  // --- 4. REVISAMOS handleSubmit COMPLETO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Error: Usuario no autenticado.");
      return;
    }

    const isNewLead = !lead;
    const leadId = lead?.id || doc(collection(db, 'leads')).id; 

    // Historial de Etapas
    let statusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (isNewLead || lead?.status !== formData.status) { // Usar lead?.status
      statusHistory = [...statusHistory, { status: formData.status, date: new Date().toISOString() }];
    }

    // Historial de Sub-Etapas
    let tagHistory: TagHistoryEntry[] = lead?.tagHistory || [];
    const currentTagIdInDb = lead?.tagIds?.[0]; 
    if (formData.tagId && formData.tagId !== currentTagIdInDb) {
        tagHistory = [...tagHistory, { tagId: formData.tagId, date: new Date().toISOString() }];
    } 
    
    // Lógica de Notificaciones y Observaciones
    let notificationForSellerCalc = lead?.notificationForSeller || false;
    let sellerHasViewedNotificationCalc = lead?.sellerHasViewedNotification || false;
    let notificationForManagerIdCalc = lead?.notificationForManagerId ?? null; // Usar ?? null
    const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
    const newObservationAdded = formData.newObservation.trim() !== '';

    if (isManager) {
      sellerHasViewedNotificationCalc = false; 
      if (newObservationAdded) {
        notificationForSellerCalc = true; 
        notificationForManagerIdCalc = user.id; 
      }
    } else { 
      notificationForSellerCalc = false; 
      if (newObservationAdded) {
        if(lead?.notificationForSeller && lead?.notificationForManagerId){
             sellerHasViewedNotificationCalc = true; 
        } else {
             sellerHasViewedNotificationCalc = false; // Corregido: no setear a true si no había notif
        }
      } else {
          // Si no hay nueva observación, mantener el estado de 'visto' que ya tenía
          sellerHasViewedNotificationCalc = lead?.sellerHasViewedNotification || false;
      }
    }
    let updatedObservations = lead?.observations || '';
    if (newObservationAdded) {
        const observationText = `\n---\n[${new Date().toLocaleString()}] por ${user.name}:\n${formData.newObservation.trim()}`;
        updatedObservations = (updatedObservations + observationText).trim();
    }

    // Construcción final del objeto Lead a guardar (revisado)
    const leadData: Omit<Lead, 'tagHistory'> & { tagHistory?: TagHistoryEntry[] } = {
      // Usamos Omit para excluir temporalmente tagHistory
      ...lead, // Mantiene campos existentes no editados del lead original si existe
      id: leadId,
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone || '', // phone es string obligatorio, usa '' si está vacío
      status: formData.status as LeadStatus,
      ownerId: formData.ownerId,
      observations: updatedObservations,
      createdAt: lead?.createdAt || new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      providerId: formData.providerId || null, // Guarda null si es ""
      productIds: formData.productIds, 
      tagIds: formData.tagId ? [formData.tagId] : [], 
      statusHistory: statusHistory, 
      // tagHistory se añade abajo
      _version: (lead?._version || 0) + 1,
      affiliateNumber: selectedStage?.type === 'won' ? (formData.affiliateNumber || null) : (lead?.affiliateNumber || null), // Usa null
      notificationForSeller: notificationForSellerCalc, // Guarda el booleano calculado
      sellerHasViewedNotification: sellerHasViewedNotificationCalc, // Guarda el booleano calculado
      notificationForManagerId: notificationForManagerIdCalc, // Ya es string | null
      assignedOffice: formData.assignedOffice || null, // Guarda null si es ""
      clientStatus: (lead?.clientStatus === 'Activo' || lead?.clientStatus === 'Inactivo') ? lead.clientStatus : null, // Mantiene estado si existe, sino null
      billingHistory: lead?.billingHistory // Mantiene si existe
    };

    // Añadir tagHistory solo si el array calculado tiene elementos
    if (tagHistory.length > 0) {
      leadData.tagHistory = tagHistory;
    }

    try {
      // Usamos 'as Lead' temporalmente aquí, Firestore manejará bien los undefined implícitos
      await setDoc(doc(db, 'leads', leadId), leadData as Lead, { merge: true }); 
      
      // Aseguramos que el estado local tenga arrays vacíos si son undefined
      const finalLeadDataForState = { 
          ...leadData, 
          tagHistory: leadData.tagHistory || [],
          productIds: leadData.productIds || [],
          tagIds: leadData.tagIds || [],
          statusHistory: leadData.statusHistory || []
      } as Lead;


      if (isNewLead) {
        dispatch({ type: 'ADD_LEAD', payload: finalLeadDataForState });
      } else {
        dispatch({ type: 'UPDATE_LEAD', payload: finalLeadDataForState });
      }
      
      // reloadData(); 
      onSuccess(); 
      
    } catch (error) {
      console.error("Error al guardar el prospecto: ", error);
      alert('Hubo un error al guardar el prospecto.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
      {/* --- CAMPOS DEL FORMULARIO --- */}
      <div><label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Prospecto</label><input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label><input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label><input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label><input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/></div>
      
      {/* --- 3. AÑADIMOS EL INPUT PARA assignedOffice --- */}
      <div>
        <label htmlFor="assignedOffice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Oficina Asignada</label>
        <input 
          type="text" 
          name="assignedOffice" 
          id="assignedOffice" 
          value={formData.assignedOffice} 
          onChange={handleChange} 
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" 
          placeholder="Ej: Sucursal Central" 
        />
      </div>
      {/* --- FIN DEL INPUT --- */}

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