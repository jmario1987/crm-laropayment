import React, { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
// --- IMPORTAMOS LAS NUEVAS INTERFACES (Equipment, Terminal) ---
import { Lead, LeadStatus, USER_ROLES, StatusHistoryEntry, TagHistoryEntry, Equipment, Terminal } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';

interface LeadFormProps {
  lead?: Lead;
  duplicateFrom?: Lead;
  onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, duplicateFrom, onSuccess }) => {
  const { dispatch, sellers, products, providers, stages, tags, allLeads } = useLeads(); 
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
    // --- NUEVO: ESTADO PARA LOS EQUIPOS ---
    equipments: [] as Equipment[]
  });

  const isNewLeadCreation = !lead;

  const availableStagesForDropdown = useMemo(() => {
      if (isNewLeadCreation) return sortedStages.slice(0, 1);
      
      const currentIndex = sortedStages.findIndex(s => s.id === lead?.status);
      if (currentIndex === -1) return sortedStages;
      
      return sortedStages.filter((s, index) => 
          Math.abs(index - currentIndex) <= 1 || 
          s.type === 'lost' || 
          index === currentIndex
      );
  }, [isNewLeadCreation, sortedStages, lead?.status]);

  const availableTags = useMemo(() => tags.filter(tag => tag.stageId === formData.status), [formData.status, tags]);
  const selectedStage = useMemo(() => stages.find(s => s.id === formData.status), [formData.status, stages]);
  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);

  const canReassign = user?.role === USER_ROLES.Admin || 
                      user?.role === USER_ROLES.Supervisor || 
                      (lead && (lead.ownerId === user?.id || lead.creatorId === user?.id));

  useEffect(() => {
    const initialOwnerId = user?.role === USER_ROLES.Vendedor ? user?.id : (sellers[0]?.id || ''); 
    if (lead) {
      setFormData({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || defaultStatus,
        ownerId: lead.ownerId || initialOwnerId || '', 
        productIds: lead.productIds || [],
        providerId: lead.providerId || '', 
        newObservation: '', 
        tagId: lead.tagIds?.[0] || '',
        affiliateNumber: lead.affiliateNumber || '',
        assignedOffice: lead.assignedOffice || '', 
        // --- CARGAMOS LOS EQUIPOS EXISTENTES ---
        equipments: lead.equipments || []
      });
    } else if (duplicateFrom) {
      setFormData({
        name: duplicateFrom.name || '',
        company: duplicateFrom.company || '',
        email: duplicateFrom.email || '',
        phone: duplicateFrom.phone || '',
        status: defaultStatus,
        ownerId: duplicateFrom.ownerId || initialOwnerId || '', 
        productIds: [], 
        providerId: duplicateFrom.providerId || '', 
        newObservation: '', 
        tagId: '', 
        affiliateNumber: '', 
        assignedOffice: duplicateFrom.assignedOffice || '', 
        // No duplicamos los equipos físicos al duplicar el cliente
        equipments: []
      });
    } else {
      setFormData({
        name: '', 
        company: '', 
        email: '', 
        phone: '', 
        status: defaultStatus,
        ownerId: initialOwnerId || '', 
        productIds: [], 
        providerId: '', 
        newObservation: '', 
        tagId: '', 
        affiliateNumber: '', 
        assignedOffice: '',
        equipments: []
      });
    }
  }, [lead, duplicateFrom, stages, user, sellers, defaultStatus]); 

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

  // --- FUNCIONES PARA MANEJAR PLACAS Y TERMINALES ---
  const addEquipment = () => {
    setFormData(prev => ({
        ...prev,
        equipments: [...prev.equipments, { id: Date.now().toString(), placa: '', sede: '', terminals: [] }]
    }));
  };

  const removeEquipment = (eqId: string) => {
    setFormData(prev => ({
        ...prev,
        equipments: prev.equipments.filter(eq => eq.id !== eqId)
    }));
  };

  const updateEquipment = (eqId: string, field: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        equipments: prev.equipments.map(eq => eq.id === eqId ? { ...eq, [field]: value } : eq)
    }));
  };

  const addTerminal = (eqId: string) => {
    setFormData(prev => ({
        ...prev,
        equipments: prev.equipments.map(eq => {
            if (eq.id === eqId) {
                if (eq.terminals.length >= 8) return eq; // Bloqueo de seguridad: máximo 8 terminales
                return { 
                    ...eq, 
                    terminals: [...eq.terminals, { id: Date.now().toString() + Math.random(), number: '', currency: 'CRC' }] 
                };
            }
            return eq;
        })
    }));
  };

  const removeTerminal = (eqId: string, termId: string) => {
    setFormData(prev => ({
        ...prev,
        equipments: prev.equipments.map(eq => {
            if (eq.id === eqId) {
                return { ...eq, terminals: eq.terminals.filter(t => t.id !== termId) };
            }
            return eq;
        })
    }));
  };

  const updateTerminal = (eqId: string, termId: string, field: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        equipments: prev.equipments.map(eq => {
            if (eq.id === eqId) {
                return {
                    ...eq,
                    terminals: eq.terminals.map(t => t.id === termId ? { ...t, [field]: value } : t)
                };
            }
            return eq;
        })
    }));
  };
  // --------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Error: Usuario no autenticado.");
      return;
    }

    const normalizedInputName = formData.name.trim().toLowerCase();
    const nameExists = allLeads.some(l => 
        l.id !== lead?.id &&
        l.name.trim().toLowerCase() === normalizedInputName
    );
    
    if (nameExists) {
        alert("⚠️ Error: Ya existe un prospecto con ese nombre exacto. Por favor agrega un distintivo (ej. Nombre - Sucursal o Nombre - Link de Pago).");
        return;
    }

    if (isNewLeadCreation && !formData.providerId) {
        alert("⚠️ Error: Debes seleccionar el Origen ('Referido por') para poder crear el prospecto.");
        return;
    }

    if (!formData.productIds || formData.productIds.length !== 1) {
        alert("⚠️ Error: Debes seleccionar EXACTAMENTE UN (1) producto.\n\nSi el cliente necesita más de un producto, crea este prospecto con el principal y luego usa el botón 'Duplicar' en su ficha para añadir los productos adicionales.");
        return;
    }

    if (availableTags.length > 0 && !formData.tagId) {
        alert("⚠️ Error: Debes seleccionar una Sub-Etapa / Etiqueta obligatoriamente para esta etapa.");
        return;
    }

    if (selectedStage?.type === 'won') {
        const afNum = formData.affiliateNumber || '';
        if (afNum.length !== 10) {
            alert("⚠️ Error: El número de afiliado debe tener exactamente 10 dígitos.");
            return;
        }
        if (!afNum.startsWith('0')) {
            alert("⚠️ Error: El número de afiliado debe comenzar siempre con un cero (0).");
            return;
        }
        
        const affiliateExists = allLeads.some(l => 
            l.id !== lead?.id && 
            l.affiliateNumber === afNum
        );

        if (affiliateExists) {
            alert("⚠️ Error: Este Número de Afiliado ya está registrado en otro cliente dentro del sistema.");
            return;
        }
    }

    const isNewLead = !lead;
    const leadId = lead?.id || doc(collection(db, 'leads')).id; 

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

    if (isManager) {
      sellerHasViewedNotificationCalc = false; 
      if (newObservationAdded) {
        notificationForSellerCalc = true; 
        notificationForManagerIdCalc = user.id; 
      }
    } else { 
      notificationForSellerCalc = false; 
      if (newObservationAdded) {
        if(lead?.notificationForSeller === true && lead?.notificationForManagerId){
             sellerHasViewedNotificationCalc = true; 
        } else {
             sellerHasViewedNotificationCalc = lead?.sellerHasViewedNotification || false; 
        }
      } else {
        sellerHasViewedNotificationCalc = lead?.sellerHasViewedNotification || false;
      }
    }

    let updatedObservations = lead?.observations || '';
    if (newObservationAdded) {
        const observationText = `\n---\n[${new Date().toLocaleString()}] por ${user.name}:\n${formData.newObservation.trim()}`;
        updatedObservations = (updatedObservations + observationText).trim();
    }

    const leadDataToSave: any = { 
        id: leadId,
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone || '', 
        status: formData.status as LeadStatus,
        ownerId: formData.ownerId,
        observations: updatedObservations,
        createdAt: lead?.createdAt || new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        _version: (lead?._version || 0) + 1,
        
        creatorId: isNewLead ? user.id : (lead?.creatorId || user.id),
        
        notificationForManagerId: notificationForManagerIdCalc, 
        notificationForSeller: notificationForSellerCalc, 
        sellerHasViewedNotification: sellerHasViewedNotificationCalc, 

        providerId: formData.providerId || null, 
        productIds: formData.productIds || [],
        tagIds: formData.tagId ? [formData.tagId] : [],
        assignedOffice: formData.assignedOffice || null, 
        
        // --- GUARDAMOS LOS EQUIPOS EN LA BASE DE DATOS ---
        equipments: formData.equipments
    };

    if (!isNewLead && lead?.ownerId !== formData.ownerId) {
        leadDataToSave.reassignedAt = new Date().toISOString();
    } else if (lead?.reassignedAt) {
        leadDataToSave.reassignedAt = lead.reassignedAt; 
    }

    const currentSelectedStage = stages.find(s => s.id === formData.status);
    leadDataToSave.affiliateNumber = currentSelectedStage?.type === 'won' ? (formData.affiliateNumber || null) : (lead?.affiliateNumber || null); 

    if (statusHistory.length > 0) leadDataToSave.statusHistory = statusHistory;
    if (tagHistory.length > 0) leadDataToSave.tagHistory = tagHistory;
    if (lead?.clientStatus) leadDataToSave.clientStatus = lead.clientStatus;
    if (lead?.billingHistory) leadDataToSave.billingHistory = lead.billingHistory;

    try {
      await setDoc(doc(db, 'leads', leadId), leadDataToSave as Lead, { merge: true }); 
      
      const finalLeadDataForState = { 
          ...lead, 
          ...leadDataToSave, 
          providerId: leadDataToSave.providerId ?? null,
          productIds: leadDataToSave.productIds ?? [],
          tagIds: leadDataToSave.tagIds ?? [],
          statusHistory: leadDataToSave.statusHistory ?? lead?.statusHistory ?? [], 
          tagHistory: leadDataToSave.tagHistory ?? lead?.tagHistory ?? [], 
          affiliateNumber: leadDataToSave.affiliateNumber ?? null,
          assignedOffice: leadDataToSave.assignedOffice ?? null,
          clientStatus: leadDataToSave.clientStatus ?? lead?.clientStatus ?? null, 
          billingHistory: leadDataToSave.billingHistory ?? lead?.billingHistory, 
          creatorId: leadDataToSave.creatorId,
          reassignedAt: leadDataToSave.reassignedAt ?? lead?.reassignedAt ?? undefined,
          equipments: leadDataToSave.equipments ?? []
      } as Lead;

      if (isNewLead) {
        dispatch({ type: 'ADD_LEAD', payload: finalLeadDataForState });
      } else {
        dispatch({ type: 'UPDATE_LEAD', payload: finalLeadDataForState });
      }

      const newAssignedOffice = leadDataToSave.assignedOffice;
      const officeChanged = newAssignedOffice !== (lead?.assignedOffice || null);

      if (!isNewLead && officeChanged && leadDataToSave.email) {
          const relatedLeadsToUpdate = allLeads.filter(l => 
              l.email === leadDataToSave.email && 
              l.id !== leadId &&                  
              (l.assignedOffice || null) !== newAssignedOffice 
          );

          if (relatedLeadsToUpdate.length > 0) {
              const batch = writeBatch(db);
              relatedLeadsToUpdate.forEach(relatedLead => {
                  const leadRef = doc(db, 'leads', relatedLead.id);
                  batch.update(leadRef, { assignedOffice: newAssignedOffice });
              });

              try {
                  await batch.commit();
                  relatedLeadsToUpdate.forEach(relatedLead => {
                      dispatch({ type: 'UPDATE_LEAD', payload: { ...relatedLead, assignedOffice: newAssignedOffice } });
                  });
              } catch (batchError) {
                  console.error("Error al actualizar prospectos relacionados:", batchError);
              }
          } 
      }
      
      onSuccess(); 
      
    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Hubo un error al guardar el prospecto.');
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar p-1">
      
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">
            Datos Principales
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label htmlFor="name" className={labelClass}>Nombre del Prospecto *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputClass}/>
            </div>
            <div>
                <label htmlFor="company" className={labelClass}>Empresa</label>
                <input type="text" name="company" id="company" value={formData.company} onChange={handleChange} className={inputClass}/>
            </div>
            <div>
                <label htmlFor="assignedOffice" className={labelClass}>Oficina Asignada</label>
                <input type="text" name="assignedOffice" id="assignedOffice" value={formData.assignedOffice} onChange={handleChange} className={inputClass} placeholder="Ej: Sucursal Central" />
            </div>
            <div>
                <label htmlFor="email" className={labelClass}>Correo Electrónico</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClass}/>
            </div>
            <div>
                <label htmlFor="phone" className={labelClass}>Teléfono *</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className={inputClass}/>
            </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">
            Estado y Clasificación
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="status" className={labelClass}>Etapa</label>
                <select 
                    name="status" 
                    id="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    disabled={isNewLeadCreation}
                    className={`${inputClass} ${isNewLeadCreation ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-500' : ''}`}
                >
                    {availableStagesForDropdown.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                </select>
                {isNewLeadCreation && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                        Todo prospecto nuevo debe iniciar en esta etapa.
                    </p>
                )}
            </div>
            
            {availableTags.length > 0 ? (
                <div>
                    <label htmlFor="tagId" className={labelClass}>Sub-Etapa / Etiqueta *</label>
                    <select name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} required className={inputClass}>
                        <option value="">Seleccione una sub-etapa...</option>
                        {availableTags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
                    </select>
                </div>
            ) : <div className="hidden md:block"></div>}

            {selectedStage && selectedStage.type === 'won' && ( 
                <div className="md:col-span-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"> 
                    <label htmlFor="affiliateNumber" className="block text-sm font-bold text-green-800 dark:text-green-400 mb-1">
                        Número de Afiliado (Requerido para Producción) *
                    </label> 
                    <input 
                        type="text" 
                        name="affiliateNumber" 
                        id="affiliateNumber" 
                        value={formData.affiliateNumber} 
                        onChange={(e) => {
                            const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData(prev => ({ ...prev, affiliateNumber: soloNumeros }));
                        }} 
                        className={inputClass} 
                        placeholder="Ej: 0123456789" 
                        required 
                    /> 
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-green-700 dark:text-green-500 font-medium">
                            Debe comenzar con 0 y tener exactamente 10 dígitos.
                        </p>
                        <p className={`text-xs font-bold ${formData.affiliateNumber.length === 10 ? 'text-green-600' : 'text-red-500'}`}>
                            {formData.affiliateNumber.length}/10
                        </p>
                    </div>
                </div> 
            )}

            <div className="md:col-span-2 z-10">
                <label className={labelClass}>Productos de Interés *</label>
                <MultiSelectDropdown options={productOptions} selectedValues={formData.productIds || []} onChange={handleProductSelectionChange} placeholder="Seleccionar producto..."/>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                    Debes seleccionar exactamente un (1) producto.
                </p>
            </div>
        </div>
      </div>

      {/* --- NUEVA SECCIÓN: EQUIPOS Y CONFIGURACIÓN (PLACAS Y TERMINALES) --- */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-600">
            <h4 className="text-base font-bold text-gray-800 dark:text-white">
                Equipos y Configuración
            </h4>
            <Button type="button" variant="secondary" onClick={addEquipment} className="text-xs py-1 px-2">
                + Agregar Placa
            </Button>
        </div>
        
        {formData.equipments.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">No hay equipos registrados para este cliente.</p>
        ) : (
            <div className="space-y-4">
                {formData.equipments.map((eq, eqIndex) => (
                    <div key={eq.id} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 rounded-lg shadow-sm relative">
                        <button 
                            type="button" 
                            onClick={() => removeEquipment(eq.id)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar Placa"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">Placa #{eqIndex + 1}</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">N° de Placa (Datáfono)</label>
                                <input 
                                    type="text" 
                                    value={eq.placa} 
                                    onChange={(e) => updateEquipment(eq.id, 'placa', e.target.value)} 
                                    className="block w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Ej: P-1050"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                    Sede <span className="font-normal text-gray-400">(Opcional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={eq.sede || ''} 
                                    onChange={(e) => updateEquipment(eq.id, 'sede', e.target.value)} 
                                    className="block w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Ej: Sucursal Tibás"
                                />
                            </div>
                        </div>

                        {/* SUB-SECCIÓN DE TERMINALES DENTRO DE LA PLACA */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Terminales ({eq.terminals.length}/8)</label>
                                <button 
                                    type="button" 
                                    onClick={() => addTerminal(eq.id)}
                                    disabled={eq.terminals.length >= 8}
                                    className={`text-xs font-medium py-1 px-2 rounded transition-colors ${eq.terminals.length >= 8 ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/80'}`}
                                >
                                    + Añadir Terminal
                                </button>
                            </div>
                            
                            {eq.terminals.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Haz clic en "+ Añadir Terminal" para configurar las monedas de esta placa.</p>
                            ) : (
                                <div className="space-y-2">
                                    {eq.terminals.map((term, termIndex) => (
                                        <div key={term.id} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-4">{termIndex + 1}.</span>
                                            <input 
                                                type="text" 
                                                value={term.number} 
                                                onChange={(e) => updateTerminal(eq.id, term.id, 'number', e.target.value)} 
                                                className="block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="N° Terminal (Ej: T-001)"
                                                required
                                            />
                                            <select 
                                                value={term.currency} 
                                                onChange={(e) => updateTerminal(eq.id, term.id, 'currency', e.target.value)}
                                                className="block w-24 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="CRC">Colones</option>
                                                <option value="USD">Dólares</option>
                                            </select>
                                            <button 
                                                type="button" 
                                                onClick={() => removeTerminal(eq.id, term.id)}
                                                className="text-red-400 hover:text-red-600 p-1"
                                                title="Eliminar Terminal"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      {/* ------------------------------------------------------------------------ */}

      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">
            Asignación y Origen
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
                <label htmlFor="providerId" className={labelClass}>Referido por {isNewLeadCreation && '*'}:</label>
                <select 
                    name="providerId" 
                    id="providerId" 
                    value={formData.providerId} 
                    onChange={handleChange} 
                    required={isNewLeadCreation} 
                    className={inputClass}
                >
                    <option value="">Seleccione una opción...</option>
                    {providers.map(provider => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                </select>
            </div>

            {canReassign && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label htmlFor="ownerId" className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">
                        {lead ? 'Asignado a:' : 'Asignar a Vendedor:'}
                    </label>
                    <select name="ownerId" id="ownerId" value={formData.ownerId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-medium">
                        {sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                    </select>
                </div>
            )}
        </div>
      </div>

      <div>
        <label htmlFor="newObservation" className="block text-base font-bold text-gray-800 dark:text-white mb-2">Añadir Observación</label>
        <textarea name="newObservation" id="newObservation" value={formData.newObservation} onChange={handleChange} rows={3} className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm" placeholder="Escribe aquí la nueva nota, minutas de reunión o estatus..."/>
      </div>
      
      <div className="flex justify-end pt-4 pb-2 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-2 z-20">
        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto text-lg px-8 py-2">
          {lead ? 'Guardar Cambios' : duplicateFrom ? 'Crear Prospecto Duplicado' : 'Crear Prospecto'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;