import React, { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadStatus, USER_ROLES, StatusHistoryEntry, TagHistoryEntry, Equipment, Terminal } from '../../types';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';
import { COSTA_RICA_LOCATIONS } from '../../data/locations';
import { saveAuditLog } from '../../services/audit';

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

  const sortedProviders = useMemo(() => {
      return [...providers].sort((a, b) => a.name.localeCompare(b.name));
  }, [providers]);

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
    equipments: [] as Equipment[],
    province: '',
    canton: '',
    district: '',
    addressDetails: ''
  });

  const [showImportBox, setShowImportBox] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [importCurrency, setImportCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [eqSearchQuery, setEqSearchQuery] = useState('');

  const isNewLeadCreation = !lead;

  useEffect(() => {
    if (isNewLeadCreation && !duplicateFrom) {
        if (formData.providerId && formData.providerId !== 'DIRECT') {
            const executiveStage = sortedStages[1]; 
            if (executiveStage && formData.status !== executiveStage.id && formData.status !== sortedStages[2]?.id) {
                setFormData(prev => ({ ...prev, status: executiveStage.id, tagId: '' }));
            }
        } else {
            const firstStage = sortedStages[0];
            if (firstStage && formData.status !== firstStage.id) {
                setFormData(prev => ({ ...prev, status: firstStage.id, tagId: '' }));
            }
        }
    }
  }, [formData.providerId, isNewLeadCreation, duplicateFrom, sortedStages]);

  const availableStagesForDropdown = useMemo(() => {
      if (isNewLeadCreation) {
          if (!formData.providerId || formData.providerId === 'DIRECT') {
              return sortedStages.length > 0 ? [sortedStages[0]] : [];
          } else {
              return sortedStages.slice(1, 3);
          }
      }
      
      const currentIndex = sortedStages.findIndex(s => s.id === lead?.status);
      if (currentIndex === -1) return sortedStages;
      return sortedStages.filter((s, index) => Math.abs(index - currentIndex) <= 1 || s.type === 'lost' || index === currentIndex);
  }, [isNewLeadCreation, sortedStages, lead?.status, formData.providerId]);

  const availableTags = useMemo(() => tags.filter(tag => tag.stageId === formData.status), [formData.status, tags]);
  const selectedStage = useMemo(() => stages.find(s => s.id === formData.status), [formData.status, stages]);
  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
  const canReassign = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor || (lead && (lead.ownerId === user?.id || lead.creatorId === user?.id));

  useEffect(() => {
    const initialOwnerId = user?.role === USER_ROLES.Vendedor ? user?.id : (sellers[0]?.id || ''); 
    if (lead) {
      const mappedEquipments = (lead.equipments || []).map(eq => {
          if (eq.serie === undefined) { return { ...eq, serie: eq.placa, placa: '' }; }
          return eq;
      });

      setFormData({
        name: lead.name || '', company: lead.company || '', email: lead.email || '', phone: lead.phone || '',
        status: lead.status || defaultStatus, ownerId: lead.ownerId || initialOwnerId || '', 
        productIds: lead.productIds || [], 
        providerId: lead.providerId ? lead.providerId : 'DIRECT', 
        newObservation: '', tagId: lead.tagIds?.[0] || '', affiliateNumber: lead.affiliateNumber || '', 
        assignedOffice: lead.assignedOffice || '', equipments: mappedEquipments,
        province: lead.province || '', canton: lead.canton || '', district: lead.district || '', addressDetails: lead.addressDetails || ''
      });
    } else if (duplicateFrom) {
      setFormData({
        name: duplicateFrom.name || '', company: duplicateFrom.company || '', email: duplicateFrom.email || '', phone: duplicateFrom.phone || '',
        status: defaultStatus, ownerId: duplicateFrom.ownerId || initialOwnerId || '', productIds: [], 
        providerId: duplicateFrom.providerId ? duplicateFrom.providerId : 'DIRECT', newObservation: '', tagId: '', affiliateNumber: '', 
        assignedOffice: duplicateFrom.assignedOffice || '', equipments: [],
        province: duplicateFrom.province || '', canton: duplicateFrom.canton || '', district: duplicateFrom.district || '', addressDetails: duplicateFrom.addressDetails || ''
      });
    } else {
      setFormData({
        name: '', company: '', email: '', phone: '', status: defaultStatus, ownerId: initialOwnerId || '', 
        productIds: [], providerId: '', newObservation: '', tagId: '', affiliateNumber: '', assignedOffice: '', equipments: [],
        province: '', canton: '', district: '', addressDetails: ''
      });
    }
  }, [lead, duplicateFrom, stages, user, sellers, defaultStatus]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'status') {
        setFormData(prev => ({ ...prev, status: value, tagId: '' })); 
    } else if (name === 'province') {
        setFormData(prev => ({ ...prev, province: value, canton: '', district: '' }));
    } else if (name === 'canton') {
        setFormData(prev => ({ ...prev, canton: value, district: '' }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const provinces = Object.keys(COSTA_RICA_LOCATIONS);
  const cantons = formData.province 
      ? Object.keys(COSTA_RICA_LOCATIONS[formData.province]).sort((a, b) => a.localeCompare(b)) 
      : [];
  const districts = (formData.province && formData.canton) 
      ? [...COSTA_RICA_LOCATIONS[formData.province][formData.canton]].sort((a, b) => a.localeCompare(b)) 
      : [];

  const handleProductSelectionChange = (selectedValues: string[]) => setFormData(prev => ({ ...prev, productIds: selectedValues }));

  const addEquipment = () => setFormData(prev => ({ ...prev, equipments: [...prev.equipments, { id: Date.now().toString(), serie: '', placa: '', sede: '', terminals: [] }] }));
  const removeEquipment = (eqId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.filter(eq => eq.id !== eqId) }));
  const updateEquipment = (eqId: string, field: string, value: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => eq.id === eqId ? { ...eq, [field]: value } : eq) }));
  const addTerminal = (eqId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { if (eq.terminals.length >= 8) return eq; return { ...eq, terminals: [...eq.terminals, { id: Date.now().toString() + Math.random(), number: '', currency: 'CRC' }] }; } return eq; }) }));
  const removeTerminal = (eqId: string, termId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { return { ...eq, terminals: eq.terminals.filter(t => t.id !== termId) }; } return eq; }) }));
  const updateTerminal = (eqId: string, termId: string, field: string, value: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { return { ...eq, terminals: eq.terminals.map(t => t.id === termId ? { ...t, [field]: value } : t) }; } return eq; }) }));

  const formatPlaca = (val: string) => val.replace(/\D/g, '').slice(0, 6);
  const formatSerie = (val: string) => {
      let cleaned = val.replace(/\D/g, '').slice(0, 9);
      if (cleaned.length > 6) { return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6)}`; } 
      else if (cleaned.length > 3) { return `${cleaned.slice(0,3)}-${cleaned.slice(3)}`; }
      return cleaned;
  };

  const processPasteData = () => {
    if (!pasteData.trim()) return alert("Por favor pega los datos de Excel en la caja de texto.");
    const rows = pasteData.split('\n');
    const newEquipments: Equipment[] = [];
    let addedCount = 0;
    
    rows.forEach(row => {
        if (!row.trim()) return;
        const cols = row.split('\t').map(c => c.trim());
        if (cols[0].toLowerCase().includes('serie') || cols[0].toLowerCase().includes('placa')) return;
        
        if (cols.length >= 3) {
            const placa = formatPlaca(cols[0]); 
            const serie = formatSerie(cols[1]); 
            const terminal = cols[2]; 
            const sede = cols.length >= 4 ? cols[3] : '';
            
            const existingEqIndex = newEquipments.findIndex(eq => (eq.serie === serie && serie !== '') || (eq.placa === placa && placa !== ''));
            
            if (existingEqIndex >= 0) {
                if (newEquipments[existingEqIndex].terminals.length < 8) {
                    newEquipments[existingEqIndex].terminals.push({ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency });
                    addedCount++;
                }
            } else {
                newEquipments.push({ id: Date.now().toString() + Math.random(), serie: serie, placa: placa, sede: sede, terminals: [{ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency }] });
                addedCount++;
            }
        } else if (cols.length === 2) {
             const serie = formatSerie(cols[0]); 
             const terminal = cols[1]; 
             const existingEqIndex = newEquipments.findIndex(eq => eq.serie === serie);
             if (existingEqIndex >= 0) {
                 if (newEquipments[existingEqIndex].terminals.length < 8) {
                     newEquipments[existingEqIndex].terminals.push({ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency });
                     addedCount++;
                 }
             } else {
                 newEquipments.push({ id: Date.now().toString() + Math.random(), serie: serie, placa: '', sede: '', terminals: [{ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency }] });
                 addedCount++;
             }
        }
    });
    if (addedCount === 0) return alert("No se pudo detectar un formato válido. Asegúrate de copiar al menos 3 columnas desde Excel (Placa, Serie, Terminal).");
    setFormData(prev => ({ ...prev, equipments: [...prev.equipments, ...newEquipments] }));
    setPasteData(''); setShowImportBox(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Error: Usuario no autenticado.");

    const normalizedInputName = formData.name.trim().toLowerCase();
    const nameExists = allLeads.some(l => l.id !== lead?.id && l.name.trim().toLowerCase() === normalizedInputName);
    
    if (nameExists) return alert("Error: Ya existe un prospecto con ese nombre exacto.");
    if (isNewLeadCreation && !formData.providerId) return alert("Error: Debes seleccionar el Origen del prospecto.");
    if (!formData.productIds || formData.productIds.length !== 1) return alert("Error: Debes seleccionar EXACTAMENTE UN (1) producto.");
    if (availableTags.length > 0 && !formData.tagId) return alert("Error: Debes seleccionar una Sub-Etapa.");

    if (selectedStage?.type === 'won') {
        const afNum = formData.affiliateNumber || '';
        if (afNum.length !== 10) return alert("Error: El número de afiliado debe tener exactamente 10 dígitos.");
        if (!afNum.startsWith('0')) return alert("Error: El número de afiliado debe comenzar siempre con un cero (0).");
        
        const affiliateExists = allLeads.some(l => l.id !== lead?.id && l.affiliateNumber === afNum);
        if (affiliateExists) return alert("Error: Este Número de Afiliado ya está registrado en otro cliente.");
    }

    for (const eq of formData.equipments) {
        if (!eq.serie) { return alert("Error: El N° de Serie es obligatorio en todos los equipos."); }
        if (eq.serie.length !== 11) { return alert(`Error: El N° de Serie "${eq.serie}" está incompleto. Debe tener 9 dígitos (formato XXX-XXX-XXX).`); }
        if (eq.placa && eq.placa.length !== 6) { return alert(`Error: El N° de Placa "${eq.placa}" debe tener exactamente 6 dígitos.`); }
    }

    const leadId = lead?.id || doc(collection(db, 'leads')).id; 

    let statusHistory: StatusHistoryEntry[] = lead?.statusHistory || [];
    if (isNewLeadCreation || lead?.status !== formData.status) {
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

    const finalProviderId = (formData.providerId === 'DIRECT' || formData.providerId === '') ? null : formData.providerId;

    const leadDataToSave: any = { 
        id: leadId, name: formData.name, company: formData.company, email: formData.email,
        phone: formData.phone || '', status: formData.status as LeadStatus, ownerId: formData.ownerId,
        observations: updatedObservations, createdAt: lead?.createdAt || new Date().toISOString(),
        lastUpdate: new Date().toISOString(), _version: (lead?._version || 0) + 1,
        creatorId: isNewLeadCreation ? user.id : (lead?.creatorId || user.id),
        notificationForManagerId: notificationForManagerIdCalc, notificationForSeller: notificationForSellerCalc, 
        sellerHasViewedNotification: sellerHasViewedNotificationCalc, providerId: finalProviderId, 
        productIds: formData.productIds || [], tagIds: formData.tagId ? [formData.tagId] : [],
        assignedOffice: formData.assignedOffice || null, equipments: formData.equipments,
        province: formData.province || null, canton: formData.canton || null, district: formData.district || null, addressDetails: formData.addressDetails || null
    };

    if (!isNewLeadCreation && lead?.ownerId !== formData.ownerId) {
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
      
      // --- DETECCIÓN INTELIGENTE DE CAMBIOS PARA BITÁCORA ---
      let changesDetails = isNewLeadCreation ? 'Creó un nuevo prospecto.' : 'Actualizó la información general.';
      
      if (!isNewLeadCreation && lead) {
          const changes: string[] = [];
          
          if (lead.name !== formData.name) changes.push(`Nombre: '${lead.name}' ➔ '${formData.name}'`);
          if (lead.phone !== formData.phone) changes.push(`Teléfono: '${lead.phone || 'N/A'}' ➔ '${formData.phone}'`);
          if (lead.email !== formData.email) changes.push(`Correo: '${lead.email || 'N/A'}' ➔ '${formData.email}'`);
          if (lead.company !== formData.company) changes.push(`Empresa: '${lead.company || 'N/A'}' ➔ '${formData.company}'`);
          if (lead.assignedOffice !== formData.assignedOffice) changes.push(`Oficina: '${lead.assignedOffice || 'N/A'}' ➔ '${formData.assignedOffice}'`);
          if (lead.providerId !== finalProviderId) {
              const oldProvider = providers.find(p => p.id === lead.providerId)?.name || 'Venta Directa';
              const newProvider = providers.find(p => p.id === finalProviderId)?.name || 'Venta Directa';
              changes.push(`Origen: '${oldProvider}' ➔ '${newProvider}'`);
          }
          if (lead.affiliateNumber !== formData.affiliateNumber && selectedStage?.type === 'won') {
              changes.push(`Afiliado: '${lead.affiliateNumber || 'N/A'}' ➔ '${formData.affiliateNumber}'`);
          }
          if (lead.status !== formData.status) {
              const oldStage = stages.find(s => s.id === lead.status)?.name || 'Desconocida';
              const newStage = stages.find(s => s.id === formData.status)?.name || 'Desconocida';
              changes.push(`Etapa: [${oldStage}] ➔ [${newStage}]`);
          }
          if (JSON.stringify(lead.equipments) !== JSON.stringify(formData.equipments)) {
              changes.push(`Se modificaron equipos/terminales`);
          }

          if (changes.length > 0) {
              changesDetails = changes.join(' | ');
          } else if (newObservationAdded) {
              changesDetails = 'Agregó una nueva observación.';
          } else {
              changesDetails = 'Guardó sin detectar cambios específicos.';
          }
      }

      await saveAuditLog({
          userId: user.id,
          userName: user.name,
          action: isNewLeadCreation ? 'CREAR' : 'EDITAR',
          module: 'PROSPECTOS',
          entityId: leadId,
          entityName: formData.name,
          details: changesDetails,
          timestamp: new Date().toISOString()
      });
      // -------------------------------------------------------------
      
      const finalLeadDataForState = { 
          ...lead, ...leadDataToSave,
          statusHistory: leadDataToSave.statusHistory ?? lead?.statusHistory ?? [], 
          tagHistory: leadDataToSave.tagHistory ?? lead?.tagHistory ?? [], 
          clientStatus: leadDataToSave.clientStatus ?? lead?.clientStatus ?? null, 
          billingHistory: leadDataToSave.billingHistory ?? lead?.billingHistory, 
          reassignedAt: leadDataToSave.reassignedAt ?? lead?.reassignedAt ?? undefined,
          equipments: leadDataToSave.equipments ?? []
      } as Lead;

      if (isNewLeadCreation) { dispatch({ type: 'ADD_LEAD', payload: finalLeadDataForState }); } 
      else { dispatch({ type: 'UPDATE_LEAD', payload: finalLeadDataForState }); }

      const newAssignedOffice = leadDataToSave.assignedOffice;
      const officeChanged = newAssignedOffice !== (lead?.assignedOffice || null);

      if (!isNewLeadCreation && officeChanged && leadDataToSave.email) {
          const relatedLeadsToUpdate = allLeads.filter(l => l.email === leadDataToSave.email && l.id !== leadId && (l.assignedOffice || null) !== newAssignedOffice );
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
              } catch (batchError) { console.error("Error al actualizar relacionados:", batchError); }
          } 
      }
      onSuccess(); 
    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Hubo un error al guardar el prospecto.');
    }
  };

  const filteredFormEquipments = useMemo(() => {
    if (!eqSearchQuery) return formData.equipments;
    const q = eqSearchQuery.toLowerCase();
    return formData.equipments.filter(eq => 
        (eq.serie && eq.serie.toLowerCase().includes(q)) ||
        eq.placa.toLowerCase().includes(q) || 
        (eq.sede && eq.sede.toLowerCase().includes(q)) || 
        (eq.terminals && eq.terminals.some(t => t.number.toLowerCase().includes(q)))
    );
  }, [formData.equipments, eqSearchQuery]);

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar p-1">
      
      {/* DATOS PRINCIPALES */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">Datos Principales</h4>
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

      {/* --- UBICACIÓN GEOGRÁFICA --- */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Ubicación del Comercio
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className={labelClass}>Provincia</label>
                <select name="province" value={formData.province} onChange={handleChange} className={inputClass}>
                    <option value="">Seleccione...</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div>
                <label className={labelClass}>Cantón</label>
                <select name="canton" value={formData.canton} onChange={handleChange} disabled={!formData.province} className={`${inputClass} ${!formData.province ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-400' : ''}`}>
                    <option value="">Seleccione...</option>
                    {cantons.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className={labelClass}>Distrito</label>
                <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.canton} className={`${inputClass} ${!formData.canton ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-400' : ''}`}>
                    <option value="">Seleccione...</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="md:col-span-3">
                <label className={labelClass}>Otras señas (Dirección Exacta)</label>
                <textarea name="addressDetails" value={formData.addressDetails} onChange={handleChange} rows={2} className={inputClass} placeholder="Ej: 200m oeste de la escuela, casa blanca portón negro..."/>
            </div>
        </div>
      </div>

      {/* --- ORIGEN Y ASIGNACIÓN --- */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">Origen y Asignación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
                <label htmlFor="providerId" className={labelClass}>Origen del Prospecto {isNewLeadCreation && '*'}:</label>
                <select name="providerId" id="providerId" value={formData.providerId} onChange={handleChange} required={isNewLeadCreation} className={inputClass}>
                    <option value="" disabled hidden>Seleccione una opción...</option>
                    <option value="DIRECT" className="font-bold text-gray-700 dark:text-gray-300">Venta Directa (Sin Desarrollador)</option>
                    <optgroup label="Desarrolladores Registrados">
                        {sortedProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </optgroup>
                </select>
            </div>
            {canReassign && (
                <div>
                    <label htmlFor="ownerId" className={labelClass}>Responsable Actual:</label>
                    <select name="ownerId" id="ownerId" value={formData.ownerId} onChange={handleChange} className={inputClass}>
                        {sellers.map(seller => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                    </select>
                </div>
            )}
        </div>
      </div>

      {/* --- ESTADO Y CLASIFICACIÓN --- */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">Estado y Clasificación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="status" className={labelClass}>Etapa Inicial</label>
                <select 
                    name="status" 
                    id="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    disabled={isNewLeadCreation && (!formData.providerId || formData.providerId === 'DIRECT')}
                    className={`${inputClass} ${isNewLeadCreation && (!formData.providerId || formData.providerId === 'DIRECT') ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-gray-500' : ''}`}
                >
                    {availableStagesForDropdown.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                </select>
                {isNewLeadCreation && formData.providerId && formData.providerId !== 'DIRECT' ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1.5 uppercase tracking-wider">
                        Salto automático activado
                    </p>
                ) : isNewLeadCreation && formData.providerId === 'DIRECT' ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1.5 uppercase tracking-wider">
                        Etapa inicial por defecto
                    </p>
                ) : isNewLeadCreation ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1.5 uppercase tracking-wider">
                        Seleccione el origen primero
                    </p>
                ) : null}
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
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-600"> 
                    <label htmlFor="affiliateNumber" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Número de Afiliado (Requerido para Producción) *</label> 
                    <input 
                        type="text" name="affiliateNumber" id="affiliateNumber" value={formData.affiliateNumber} 
                        onChange={(e) => setFormData(prev => ({ ...prev, affiliateNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                        className={inputClass} placeholder="Ej: 0123456789" required 
                    /> 
                </div> 
            )}

            <div className="md:col-span-2 z-10">
                <label className={labelClass}>Productos de Interés *</label>
                <MultiSelectDropdown options={productOptions} selectedValues={formData.productIds || []} onChange={handleProductSelectionChange} placeholder="Seleccionar producto..."/>
            </div>
        </div>
      </div>

      {/* EQUIPOS Y CONFIGURACIÓN */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 dark:border-gray-600 gap-3">
            <h4 className="text-base font-bold text-gray-800 dark:text-white">Equipos y Configuración</h4>
            
            {formData.equipments.length > 2 && (
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar placa/serie a editar..." 
                        value={eqSearchQuery}
                        onChange={(e) => setEqSearchQuery(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-primary-500"
                    />
                </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="secondary" onClick={() => setShowImportBox(!showImportBox)} className="text-xs py-1.5 px-3 flex-1 sm:flex-none justify-center shadow-sm border-gray-300">
                    Pegar desde Excel
                </Button>
                <Button type="button" variant="secondary" onClick={addEquipment} className="text-xs py-1.5 px-3 flex-1 sm:flex-none justify-center shadow-sm border-gray-300">
                    + Agregar Equipo
                </Button>
            </div>
        </div>

        {showImportBox && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600 mb-6 shadow-inner animate-fade-in-down">
                <h5 className="font-bold text-gray-800 dark:text-gray-300 mb-2">
                    Pegar desde Excel
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Copia las celdas de tu Excel y pégalas aquí. El formato debe ser: <br/>
                    <strong>N° Placa (Opcional) | N° Serie | Terminal | Sede o Caja (Opcional)</strong>.
                </p>
                
                <div className="flex gap-4 mb-3">
                    <div className="flex-1">
                        <textarea 
                            value={pasteData}
                            onChange={(e) => setPasteData(e.target.value)}
                            placeholder="Pega aquí las filas de Excel (Ctrl+V)..."
                            className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 dark:text-gray-200 custom-scrollbar whitespace-pre"
                        />
                    </div>
                    <div className="w-48 flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Moneda de Terminales:</label>
                        <select 
                            value={importCurrency}
                            onChange={(e) => setImportCurrency(e.target.value as 'CRC' | 'USD')}
                            className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="CRC">Colones</option>
                            <option value="USD">Dólares</option>
                        </select>
                        <button 
                            type="button"
                            onClick={processPasteData}
                            className="mt-auto w-full py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded shadow transition-colors text-sm"
                        >
                            Procesar Filas
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {formData.equipments.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">No hay equipos registrados para este cliente.</p>
        ) : (
            <div className="space-y-4">
                {filteredFormEquipments.length > 0 ? filteredFormEquipments.map((eq, displayIndex) => (
                    <div key={eq.id} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-4 rounded-lg shadow-sm relative">
                        <button 
                            type="button" 
                            onClick={() => removeEquipment(eq.id)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 p-1.5 rounded-md"
                            title="Eliminar Equipo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm border-b pb-1 dark:border-gray-600 w-fit pr-4">Hardware POS</h5>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        N° de Placa (Activo Fijo) <span className="font-normal text-gray-400">(Opcional)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={eq.placa || ''} 
                                        onChange={(e) => updateEquipment(eq.id, 'placa', formatPlaca(e.target.value))} 
                                        className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Ej: 123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        N° de Serie (Datáfono) *
                                    </label>
                                    <input 
                                        type="text" 
                                        value={eq.serie || ''} 
                                        onChange={(e) => updateEquipment(eq.id, 'serie', formatSerie(e.target.value))} 
                                        className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 font-mono tracking-wider"
                                        placeholder="XXX-XXX-XXX"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Sede o Caja <span className="font-normal text-gray-400">(Opcional)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={eq.sede || ''} 
                                        onChange={(e) => updateEquipment(eq.id, 'sede', e.target.value)} 
                                        className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Ej: Sucursal Tibás o Caja 1"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-7">
                                <div className="bg-gray-50 dark:bg-gray-800/80 rounded-md p-3 border border-gray-200 dark:border-gray-600 h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Terminales ({eq.terminals.length}/8)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => addTerminal(eq.id)}
                                            disabled={eq.terminals.length >= 8}
                                            className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors shadow-sm border ${eq.terminals.length >= 8 ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed dark:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'}`}
                                        >
                                            + Añadir Terminal
                                        </button>
                                    </div>
                                    
                                    {eq.terminals.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-md p-4">
                                            <p className="text-xs text-gray-400 italic text-center">Sin terminales. Haz clic en "+ Añadir" para configurar las monedas.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 flex-1">
                                            {eq.terminals.map((term, termIndex) => (
                                                <div key={term.id} className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400 font-medium w-4">{termIndex + 1}.</span>
                                                    <input 
                                                        type="text" 
                                                        value={term.number} 
                                                        onChange={(e) => updateTerminal(eq.id, term.id, 'number', e.target.value)} 
                                                        className="block w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-primary-500 focus:border-primary-500"
                                                        placeholder="N° Terminal"
                                                        required
                                                    />
                                                    <select 
                                                        value={term.currency} 
                                                        onChange={(e) => updateTerminal(eq.id, term.id, 'currency', e.target.value)}
                                                        className="block w-28 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium focus:ring-primary-500 focus:border-primary-500"
                                                    >
                                                        <option value="CRC">Colones</option>
                                                        <option value="USD">Dólares</option>
                                                    </select>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeTerminal(eq.id, term.id)}
                                                        className="text-red-400 hover:text-red-600 p-1.5 bg-white border border-gray-200 hover:bg-red-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-red-900/30 rounded ml-1 transition-colors shadow-sm"
                                                        title="Eliminar Terminal"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 text-center py-4">No se encontraron resultados para tu búsqueda.</p>
                )}

                {!eqSearchQuery && (
                    <button
                        type="button"
                        onClick={addEquipment}
                        className="w-full py-3 mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Añadir otro Equipo
                    </button>
                )}
            </div>
        )}
      </div>

      {/* OBSERVACIONES */}
      <div>
        <label htmlFor="newObservation" className="block text-base font-bold text-gray-800 dark:text-white mb-2">Añadir Observación</label>
        <textarea name="newObservation" id="newObservation" value={formData.newObservation} onChange={handleChange} rows={3} className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm" placeholder="Escribe aquí la nueva nota, minutas de reunión o estatus..."/>
      </div>
      
      {/* BOTÓN GUARDAR CON NUEVO DISEÑO */}
      <div className="flex justify-end pt-4 pb-2 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-2 z-20">
        <Button 
          type="submit" 
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white w-full sm:w-auto text-sm font-medium px-6 py-2 rounded-lg shadow-sm transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {lead ? 'Guardar Cambios' : duplicateFrom ? 'Crear Duplicado' : 'Crear Prospecto'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;