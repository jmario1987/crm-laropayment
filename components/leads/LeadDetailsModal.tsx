import React, { useState, useMemo, useEffect } from 'react';
import { Lead } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import LeadTimeline from './LeadTimeline';
import LeadForm from './LeadForm';
import { useLeads } from '../../hooks/useLeads';

interface LeadDetailsModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string | null | undefined | React.ReactNode, noTruncate?: boolean }> = ({ icon, label, value, noTruncate }) => (
    <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
        <div className="w-5 mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{icon}</div>
        <span className="font-semibold mr-2">{label}:</span>
        <div className={noTruncate ? 'whitespace-pre-wrap' : 'truncate'}>{value ?? 'N/A'}</div> 
    </div>
);

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, isOpen, onClose }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false); 
    const [activeTab, setActiveTab] = useState<'info' | 'equipments' | 'history'>('info');
    
    // --- ESTADO: Buscador interno de equipos ---
    const [eqSearchQuery, setEqSearchQuery] = useState('');

    const { getUserById, products, getProviderById, getStageById, tags, allLeads } = useLeads();
    const [activeLeadId, setActiveLeadId] = useState(lead.id);

    useEffect(() => {
        setActiveLeadId(lead.id);
        setActiveTab('info');
        setEqSearchQuery(''); // Limpiamos la búsqueda al cambiar de cliente
    }, [lead.id]);

    const activeLead = allLeads.find(l => l.id === activeLeadId) || lead;

    const handleEditSuccess = () => setIsEditModalOpen(false);
    const handleDuplicateSuccess = () => setIsDuplicateModalOpen(false);
    
    const ownerName = getUserById(activeLead.ownerId)?.name;
    const creatorName = activeLead.creatorId ? getUserById(activeLead.creatorId)?.name : null;
    const isCoOwned = activeLead.creatorId && activeLead.creatorId !== activeLead.ownerId;
    const providerName = getProviderById(activeLead.providerId ?? '')?.name; 
    const stage = getStageById(activeLead.status);

    const interestedProducts = useMemo(() => {
        return (activeLead.productIds || []).map(id => products.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => p != null);
    }, [activeLead.productIds, products]);

    const assignedTags = useMemo(() => {
        return (activeLead.tagIds || []).map(id => tags.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => t != null);
    }, [activeLead.tagIds, tags]);

    const relatedLeads = useMemo(() => {
        if (!activeLead.email) return [];
        return allLeads.filter(l => l.email === activeLead.email && l.id !== activeLead.id);
    }, [allLeads, activeLead.email, activeLead.id]);

    const equipmentCount = activeLead.equipments?.length || 0;

    // --- LÓGICA ACTUALIZADA: Aplanar y Filtrar Equipos (Con Placa y Serie) ---
    const filteredFlatEquipments = useMemo(() => {
        if (!activeLead.equipments) return [];
        
        let flatList: any[] = [];
        activeLead.equipments.forEach(eq => {
            // MIGRACIÓN VISUAL ON-THE-FLY PARA DATOS VIEJOS
            // Si no existe 'serie', el dato que está en 'placa' es en realidad la serie.
            const displaySerie = eq.serie !== undefined ? eq.serie : eq.placa;
            const displayPlaca = eq.serie !== undefined ? eq.placa : '';

            if (!eq.terminals || eq.terminals.length === 0) {
                flatList.push({ id: eq.id, placa: displayPlaca, serie: displaySerie, sede: eq.sede, terminalNumber: '-', currency: '-' });
            } else {
                eq.terminals.forEach(t => {
                    flatList.push({ id: t.id, placa: displayPlaca, serie: displaySerie, sede: eq.sede, terminalNumber: t.number, currency: t.currency });
                });
            }
        });

        if (!eqSearchQuery) return flatList;

        const q = eqSearchQuery.toLowerCase();
        return flatList.filter(item => 
            item.placa.toLowerCase().includes(q) || 
            (item.serie && item.serie.toLowerCase().includes(q)) || 
            (item.sede && item.sede.toLowerCase().includes(q)) || 
            item.terminalNumber.toLowerCase().includes(q)
        );
    }, [activeLead.equipments, eqSearchQuery]);

    if (!isOpen) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de ${activeLead.name}`}>
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
                    <button onClick={() => setActiveTab('info')} className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>Información</button>
                    <button onClick={() => setActiveTab('equipments')} className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipments' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                        Equipos {equipmentCount > 0 && <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">{equipmentCount}</span>}
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>Historial & Oportunidades</button>
                </div>

                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
                    {/* ... PESTAÑA 1 INFO ... */}
                    {activeTab === 'info' && (
                        <div className="space-y-3">
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Nombre" value={activeLead.name} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect x="2" y="20" width="20" height="4"/></svg>} label="Empresa" value={activeLead.company} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} label="Email" value={activeLead.email} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>} label="Teléfono" value={activeLead.phone} />
                            {activeLead.affiliateNumber && <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>} label="Número de Afiliado" value={<span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-md">{activeLead.affiliateNumber}</span>} />}
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1H5a1 1 0 110-2V4zm3 1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 01-1 1H8a1 1 0 01-1-1V5zm1 5a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm5-1a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 100 2h.01a1 1 0 100-2H9zm5 1a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" /></svg>} label="Oficina Asignada" value={activeLead.assignedOffice} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>} label="Etapa Principal" value={stage?.name} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>} label="Sub-Etapa" value={assignedTags.length > 0 ? (<div className="flex flex-wrap gap-1">{assignedTags.map(tag => (<span key={tag.id} className="px-2 py-0.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>))}</div>) : undefined} />
                            {isCoOwned && <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>} label="Creador (SDR)" value={creatorName} />}
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isCoOwned ? "#3b82f6" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label={isCoOwned ? "Responsable Actual" : "Vendedor"} value={ownerName} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z"/></svg>} label="Referido por" value={providerName} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>} label="Productos" value={interestedProducts.length > 0 ? (<ul className="list-disc list-inside">{interestedProducts.map(p => <li key={p.id}>{p.name}</li>)}</ul>) : undefined} />
                            <LeadDetailItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} label="Observaciones" value={activeLead.observations} noTruncate={true} />
                        </div>
                    )}

                    {/* --- PESTAÑA 2: TABLA COMPACTA DE EQUIPOS (ACTUALIZADA) --- */}
                    {activeTab === 'equipments' && (
                        <div>
                            {equipmentCount === 0 ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Este cliente no tiene equipos registrados.</p>
                                    <Button onClick={() => setIsEditModalOpen(true)} className="mt-4 text-sm py-1.5">Agregar Equipo</Button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in-down">
                                    {/* BUSCADOR LOCAL */}
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Filtrar por placa, serie, sede o terminal..." 
                                            value={eqSearchQuery}
                                            onChange={(e) => setEqSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                        />
                                    </div>

                                    {/* TABLA DE RESULTADOS ACTUALIZADA CON COLUMNA SERIE */}
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3">Placa</th>
                                                    <th scope="col" className="px-4 py-3">N° Serie</th>
                                                    <th scope="col" className="px-4 py-3">Terminal</th>
                                                    <th scope="col" className="px-4 py-3">Moneda</th>
                                                    <th scope="col" className="px-4 py-3">Sede / Caja</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFlatEquipments.length > 0 ? (
                                                    filteredFlatEquipments.map((item, idx) => (
                                                        <tr key={idx} className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                                {item.placa || '-'}
                                                            </td>
                                                            <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                                {item.serie || '-'}
                                                            </td>
                                                            <td className="px-4 py-2 font-mono">
                                                                {item.terminalNumber}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                {item.currency !== '-' && (
                                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${item.currency === 'USD' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                                                        {item.currency}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 text-xs">
                                                                {item.sede ? <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded whitespace-nowrap">{item.sede}</span> : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic">
                                                            No se encontraron equipos con esa búsqueda.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- PESTAÑA 3 HISTORY ... --- */}
                    {activeTab === 'history' && (
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Historial de Etapas</h4>
                                <LeadTimeline history={activeLead.statusHistory} />
                            </div>
                            {relatedLeads.length > 0 && (
                                <div>
                                    <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Otras Oportunidades del Cliente</h4>
                                    <div className="space-y-3">
                                        {relatedLeads.map(relatedLead => {
                                            const relatedStage = getStageById(relatedLead.status);
                                            return (
                                                <div key={relatedLead.id} onClick={() => setActiveLeadId(relatedLead.id)} className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer transition-all hover:border-primary-400">
                                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 pr-8">{relatedLead.name}</h5>
                                                    <p className="text-sm mt-2"><strong className="text-gray-600 dark:text-gray-400">Etapa:</strong> {relatedStage?.name ?? 'N/A'}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div> 

                <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl sticky bottom-0 z-10 mt-2">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button variant="secondary" onClick={() => setIsDuplicateModalOpen(true)}>Duplicar</Button>
                    <Button onClick={() => setIsEditModalOpen(true)}>Editar Prospecto</Button>
                </div>
            </Modal>
            
            {isEditModalOpen && <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar ${activeLead.name}`}><LeadForm lead={activeLead} onSuccess={handleEditSuccess} /></Modal>}
            {isDuplicateModalOpen && <Modal isOpen={isDuplicateModalOpen} onClose={() => setIsDuplicateModalOpen(false)} title={`Duplicar a ${activeLead.name}`}><LeadForm duplicateFrom={activeLead} onSuccess={handleDuplicateSuccess} /></Modal>}
        </>
    );
};

export default LeadDetailsModal;