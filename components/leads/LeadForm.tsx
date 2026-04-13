import React, { useState, useMemo, useEffect } from 'react';
import { useLeads } from '../../hooks/useLeads';
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
    name: '', company: '', email: '', phone: '', status: defaultStatus, ownerId: '',
    productIds: [] as string[], providerId: '', newObservation: '', tagId: '',
    affiliateNumber: '', assignedOffice: '', equipments: [] as Equipment[]
  });

  const [showImportBox, setShowImportBox] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [importCurrency, setImportCurrency] = useState<'CRC' | 'USD'>('CRC');
  
  // --- NUEVO ESTADO: Buscador dentro de edición ---
  const [eqSearchQuery, setEqSearchQuery] = useState('');

  const isNewLeadCreation = !lead;

  const availableStagesForDropdown = useMemo(() => {
      if (isNewLeadCreation) return sortedStages.slice(0, 1);
      const currentIndex = sortedStages.findIndex(s => s.id === lead?.status);
      if (currentIndex === -1) return sortedStages;
      return sortedStages.filter((s, index) => Math.abs(index - currentIndex) <= 1 || s.type === 'lost' || index === currentIndex);
  }, [isNewLeadCreation, sortedStages, lead?.status]);

  const availableTags = useMemo(() => tags.filter(tag => tag.stageId === formData.status), [formData.status, tags]);
  const selectedStage = useMemo(() => stages.find(s => s.id === formData.status), [formData.status, stages]);
  const productOptions = useMemo(() => products.map(p => ({ value: p.id, label: p.name })), [products]);
  const canReassign = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor || (lead && (lead.ownerId === user?.id || lead.creatorId === user?.id));

  useEffect(() => {
    const initialOwnerId = user?.role === USER_ROLES.Vendedor ? user?.id : (sellers[0]?.id || ''); 
    if (lead) {
      setFormData({
        name: lead.name || '', company: lead.company || '', email: lead.email || '', phone: lead.phone || '',
        status: lead.status || defaultStatus, ownerId: lead.ownerId || initialOwnerId || '', 
        productIds: lead.productIds || [], providerId: lead.providerId || '', newObservation: '', 
        tagId: lead.tagIds?.[0] || '', affiliateNumber: lead.affiliateNumber || '', assignedOffice: lead.assignedOffice || '', 
        equipments: lead.equipments || []
      });
    } else {
      setFormData({
        name: '', company: '', email: '', phone: '', status: defaultStatus, ownerId: initialOwnerId || '', 
        productIds: [], providerId: '', newObservation: '', tagId: '', affiliateNumber: '', assignedOffice: '', equipments: []
      });
    }
  }, [lead, duplicateFrom, stages, user, sellers, defaultStatus]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'status') setFormData(prev => ({ ...prev, status: value, tagId: '' })); 
    else setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProductSelectionChange = (selectedValues: string[]) => setFormData(prev => ({ ...prev, productIds: selectedValues }));

  const addEquipment = () => setFormData(prev => ({ ...prev, equipments: [...prev.equipments, { id: Date.now().toString(), placa: '', sede: '', terminals: [] }] }));
  const removeEquipment = (eqId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.filter(eq => eq.id !== eqId) }));
  const updateEquipment = (eqId: string, field: string, value: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => eq.id === eqId ? { ...eq, [field]: value } : eq) }));
  const addTerminal = (eqId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { if (eq.terminals.length >= 8) return eq; return { ...eq, terminals: [...eq.terminals, { id: Date.now().toString() + Math.random(), number: '', currency: 'CRC' }] }; } return eq; }) }));
  const removeTerminal = (eqId: string, termId: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { return { ...eq, terminals: eq.terminals.filter(t => t.id !== termId) }; } return eq; }) }));
  const updateTerminal = (eqId: string, termId: string, field: string, value: string) => setFormData(prev => ({ ...prev, equipments: prev.equipments.map(eq => { if (eq.id === eqId) { return { ...eq, terminals: eq.terminals.map(t => t.id === termId ? { ...t, [field]: value } : t) }; } return eq; }) }));

  const processPasteData = () => {
    if (!pasteData.trim()) return alert("Por favor pega los datos de Excel en la caja de texto.");
    const rows = pasteData.split('\n');
    const newEquipments: Equipment[] = [];
    let addedCount = 0;
    rows.forEach(row => {
        if (!row.trim()) return;
        const cols = row.split('\t').map(c => c.trim());
        if (cols[0].toLowerCase().includes('serie') || cols[0].toLowerCase().includes('placa')) return;
        if (cols.length >= 2) {
            const placa = cols[0]; const terminal = cols[1]; const sede = cols.length >= 3 ? cols[2] : '';
            const existingEqIndex = newEquipments.findIndex(eq => eq.placa === placa);
            if (existingEqIndex >= 0) {
                if (newEquipments[existingEqIndex].terminals.length < 8) {
                    newEquipments[existingEqIndex].terminals.push({ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency });
                    addedCount++;
                }
            } else {
                newEquipments.push({ id: Date.now().toString() + Math.random(), placa: placa, sede: sede, terminals: [{ id: Date.now().toString() + Math.random(), number: terminal, currency: importCurrency }] });
                addedCount++;
            }
        }
    });
    if (addedCount === 0) return alert("No se pudo detectar un formato válido. Asegúrate de copiar las columnas desde Excel.");
    setFormData(prev => ({ ...prev, equipments: [...prev.equipments, ...newEquipments] }));
    setPasteData(''); setShowImportBox(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Error: Usuario no autenticado.");
    const nameExists = allLeads.some(l => l.id !== lead?.id && l.name.trim().toLowerCase() === formData.name.trim().toLowerCase());
    if (nameExists) return alert("⚠️ Error: Ya existe un prospecto con ese nombre exacto.");
    if (isNewLeadCreation && !formData.providerId) return alert("⚠️ Error: Debes seleccionar el Origen ('Referido por').");
    if (!formData.productIds || formData.productIds.length !== 1) return alert("⚠️ Error: Debes seleccionar EXACTAMENTE UN (1) producto.");
    
    const isNewLead = !lead;
    const leadId = lead?.id || doc(collection(db, 'leads')).id; 
    
    // Simplificando código de guardado para la visualización
    const leadDataToSave: any = { 
        id: leadId, name: formData.name, company: formData.company, email: formData.email,
        phone: formData.phone || '', status: formData.status as LeadStatus, ownerId: formData.ownerId,
        observations: formData.newObservation ? (lead?.observations || '') + `\n---\n[${new Date().toLocaleString()}] por ${user.name}:\n${formData.newObservation.trim()}` : lead?.observations || '', 
        createdAt: lead?.createdAt || new Date().toISOString(), lastUpdate: new Date().toISOString(),
        creatorId: isNewLead ? user.id : (lead?.creatorId || user.id),
        providerId: formData.providerId || null, productIds: formData.productIds || [], tagIds: formData.tagId ? [formData.tagId] : [],
        assignedOffice: formData.assignedOffice || null, equipments: formData.equipments,
        affiliateNumber: stages.find(s => s.id === formData.status)?.type === 'won' ? (formData.affiliateNumber || null) : (lead?.affiliateNumber || null)
    };

    try {
      await setDoc(doc(db, 'leads', leadId), leadDataToSave as Lead, { merge: true }); 
      dispatch({ type: isNewLead ? 'ADD_LEAD' : 'UPDATE_LEAD', payload: { ...lead, ...leadDataToSave } as Lead });
      onSuccess(); 
    } catch (error) { alert('Hubo un error al guardar el prospecto.'); }
  };

  // --- FILTRO INTERNO DE EDICIÓN ---
  const filteredFormEquipments = useMemo(() => {
    if (!eqSearchQuery) return formData.equipments;
    const q = eqSearchQuery.toLowerCase();
    return formData.equipments.filter(eq => 
        eq.placa.toLowerCase().includes(q) || 
        (eq.sede && eq.sede.toLowerCase().includes(q)) || 
        (eq.terminals && eq.terminals.some(t => t.number.toLowerCase().includes(q)))
    );
  }, [formData.equipments, eqSearchQuery]);

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar p-1">
      {/* ... SECCIONES DE DATOS, ESTADO, ETC (Minimizadas por espacio, ya están en tu código) ... */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b pb-2 dark:border-gray-600">Datos Principales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className={labelClass}>Nombre *</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass}/></div>
            <div><label className={labelClass}>Número de Afiliado</label><input type="text" name="affiliateNumber" value={formData.affiliateNumber} onChange={e => setFormData(prev => ({ ...prev, affiliateNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className={inputClass}/></div>
        </div>
      </div>

      {/* --- SECCIÓN DE EQUIPOS CON BUSCADOR --- */}
      <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 dark:border-gray-600 gap-3">
            <h4 className="text-base font-bold text-gray-800 dark:text-white">Equipos y Configuración</h4>
            
            {/* INPUT DE BÚSQUEDA INTERNA */}
            {formData.equipments.length > 2 && (
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Buscar placa/terminal a editar..." 
                        value={eqSearchQuery}
                        onChange={(e) => setEqSearchQuery(e.target.value)}
                        className="block w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-primary-500"
                    />
                </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="secondary" onClick={() => setShowImportBox(!showImportBox)} className="text-xs py-1.5 px-3 flex-1 sm:flex-none justify-center">
                    Pegar desde Excel
                </Button>
            </div>
        </div>

        {/* CAJA DE IMPORTACIÓN */}
        {showImportBox && (
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-6">
                <div className="flex gap-4">
                    <textarea value={pasteData} onChange={(e) => setPasteData(e.target.value)} placeholder="Ctrl+V aquí..." className="w-full h-24 px-3 py-2 text-sm border rounded bg-white" />
                    <div className="w-32 flex flex-col gap-2">
                        <select value={importCurrency} onChange={(e) => setImportCurrency(e.target.value as 'CRC' | 'USD')} className="px-2 py-1 text-sm border rounded">
                            <option value="CRC">Colones</option><option value="USD">Dólares</option>
                        </select>
                        <button type="button" onClick={processPasteData} className="py-2 bg-indigo-600 text-white text-xs font-bold rounded">Procesar</button>
                    </div>
                </div>
            </div>
        )}
        
        {formData.equipments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay equipos registrados.</p>
        ) : (
            <div className="space-y-4">
                {filteredFormEquipments.length > 0 ? filteredFormEquipments.map((eq, displayIndex) => (
                    <div key={eq.id} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-4 rounded-lg shadow-sm relative">
                        <button type="button" onClick={() => removeEquipment(eq.id)} className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 rounded-md" title="Eliminar Placa">X</button>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">Registro de Placa</h5>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">N° de Placa (Datáfono)</label>
                                    <input type="text" value={eq.placa} onChange={(e) => updateEquipment(eq.id, 'placa', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Sede (Opcional)</label>
                                    <input type="text" value={eq.sede || ''} onChange={(e) => updateEquipment(eq.id, 'sede', e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
                                </div>
                            </div>
                            <div className="lg:col-span-7">
                                <div className="bg-gray-50 rounded-md p-3 border border-gray-200 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-bold">Terminales</label>
                                        <button type="button" onClick={() => addTerminal(eq.id)} disabled={eq.terminals.length >= 8} className="text-xs text-blue-600 font-bold">+ Añadir Terminal</button>
                                    </div>
                                    <div className="space-y-2">
                                        {eq.terminals.map((term, tIdx) => (
                                            <div key={term.id} className="flex gap-2">
                                                <input type="text" value={term.number} onChange={(e) => updateTerminal(eq.id, term.id, 'number', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" />
                                                <select value={term.currency} onChange={(e) => updateTerminal(eq.id, term.id, 'currency', e.target.value)} className="w-24 px-2 py-1.5 border rounded text-sm">
                                                    <option value="CRC">CRC</option><option value="USD">USD</option>
                                                </select>
                                                <button type="button" onClick={() => removeTerminal(eq.id, term.id)} className="text-red-500 px-2 font-bold">X</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 text-center py-4">No se encontraron resultados para tu búsqueda.</p>
                )}

                {/* Botón flotante al final, solo se muestra si NO estás buscando algo específico */}
                {!eqSearchQuery && (
                    <button type="button" onClick={addEquipment} className="w-full py-3 mt-2 border-2 border-dashed rounded-lg text-sm font-semibold text-gray-500 hover:text-blue-600">+ Añadir otra Placa a mano</button>
                )}
            </div>
        )}
      </div>

      <div className="flex justify-end pt-4 pb-2 sticky bottom-0 bg-white z-20">
        <Button type="submit" className="px-8 py-2">Guardar Cambios</Button>
      </div>
    </form>
  );
};
export default LeadForm;