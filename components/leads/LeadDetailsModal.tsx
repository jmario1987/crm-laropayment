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
    // --- ESTADO PARA LAS PESTAÑAS ---
    const [activeTab, setActiveTab] = useState<'info' | 'equipments' | 'history'>('info');

    const { getUserById, products, getProviderById, getStageById, tags, allLeads } = useLeads();

    const [activeLeadId, setActiveLeadId] = useState(lead.id);

    useEffect(() => {
        setActiveLeadId(lead.id);
        // Reseteamos a la pestaña info cuando abrimos un cliente nuevo
        setActiveTab('info');
    }, [lead.id]);

    const activeLead = allLeads.find(l => l.id === activeLeadId) || lead;

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
    };

    const handleDuplicateSuccess = () => {
        setIsDuplicateModalOpen(false);
    };
    
    const ownerName = getUserById(activeLead.ownerId)?.name;
    const creatorName = activeLead.creatorId ? getUserById(activeLead.creatorId)?.name : null;
    const isCoOwned = activeLead.creatorId && activeLead.creatorId !== activeLead.ownerId;

    const providerName = getProviderById(activeLead.providerId ?? '')?.name; 
    const stage = getStageById(activeLead.status);

    const interestedProducts = useMemo(() => {
        return (activeLead.productIds || [])
            .map(id => products.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => p != null);
    }, [activeLead.productIds, products]);

    const assignedTags = useMemo(() => {
        return (activeLead.tagIds || [])
            .map(id => tags.find(t => t.id === id))
            .filter((t): t is NonNullable<typeof t> => t != null);
    }, [activeLead.tagIds, tags]);

    const relatedLeads = useMemo(() => {
        if (!activeLead.email) return [];
        return allLeads.filter(l => 
            l.email === activeLead.email && 
            l.id !== activeLead.id          
        );
    }, [allLeads, activeLead.email, activeLead.id]);

    const equipmentCount = activeLead.equipments?.length || 0;

    if (!isOpen) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de ${activeLead.name}`}>
                
                {/* --- NAVEGACIÓN DE PESTAÑAS (TABS) --- */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        Información
                    </button>
                    <button
                        onClick={() => setActiveTab('equipments')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipments' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        Equipos
                        {equipmentCount > 0 && (
                            <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                                {equipmentCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                    >
                        Historial & Oportunidades
                    </button>
                </div>

                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar">
                    
                    {/* --- PESTAÑA 1: INFORMACIÓN GENERAL --- */}
                    {activeTab === 'info' && (
                        <div>
                            <div className="space-y-3">
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                    label="Nombre"
                                    value={activeLead.name}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect x="2" y="20" width="20" height="4"/></svg>}
                                    label="Empresa"
                                    value={activeLead.company}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                                    label="Email"
                                    value={activeLead.email}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                                    label="Teléfono"
                                    value={activeLead.phone}
                                />

                                {activeLead.affiliateNumber && (
                                    <LeadDetailItem
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>}
                                        label="Número de Afiliado"
                                        value={
                                            <span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded-md">
                                                {activeLead.affiliateNumber}
                                            </span>
                                        }
                                    />
                                )}

                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3v-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1H5a1 1 0 110-2V4zm3 1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 01-1 1H8a1 1 0 01-1-1V5zm1 5a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm5-1a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 100 2h.01a1 1 0 100-2H9zm5 1a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                                    label="Oficina Asignada"
                                    value={activeLead.assignedOffice} 
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>}
                                    label="Etapa Principal"
                                    value={stage?.name}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}
                                    label="Sub-Etapa"
                                    value={assignedTags.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {assignedTags.map(tag => (
                                                <span key={tag.id} className="px-2 py-0.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : undefined} 
                                />
                                
                                {isCoOwned && (
                                    <LeadDetailItem
                                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                                        label="Creador (SDR)"
                                        value={creatorName}
                                    />
                                )}

                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isCoOwned ? "#3b82f6" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                                    label={isCoOwned ? "Responsable Actual" : "Vendedor"}
                                    value={ownerName}
                                />
                                
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z"/></svg>}
                                    label="Referido por" 
                                    value={providerName}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
                                    label="Productos"
                                    value={interestedProducts.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {interestedProducts.map(p => <li key={p.id}>{p.name}</li>)}
                                        </ul>
                                    ) : undefined}
                                />
                                <LeadDetailItem
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                                    label="Observaciones"
                                    value={activeLead.observations}
                                    noTruncate={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* --- PESTAÑA 2: EQUIPOS Y CONFIGURACIÓN --- */}
                    {activeTab === 'equipments' && (
                        <div>
                            {equipmentCount === 0 ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">Este cliente no tiene equipos registrados.</p>
                                    <Button onClick={() => setIsEditModalOpen(true)} className="mt-4 text-sm py-1.5">
                                        Agregar Equipo
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeLead.equipments?.map((eq, index) => (
                                        <div key={eq.id || index} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-3 border-b pb-2 dark:border-gray-700">
                                                <div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">Placa: {eq.placa}</span>
                                                    {eq.sede && (
                                                        <span className="ml-3 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 px-2.5 py-1 rounded-full font-semibold">
                                                            Sede: {eq.sede}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium px-2 py-1 rounded">
                                                    {eq.terminals?.length || 0} Terminal(es)
                                                </span>
                                            </div>
                                            
                                            {eq.terminals && eq.terminals.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {eq.terminals.map(term => (
                                                        <div key={term.id} className="flex items-center text-sm bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                            <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">{term.number}</span>
                                                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${term.currency === 'USD' ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800' : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800'}`}>
                                                                {term.currency}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">Sin terminales configuradas.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- PESTAÑA 3: HISTORIAL Y OPORTUNIDADES --- */}
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
                                            const relatedProducts = (relatedLead.productIds || [])
                                                .map(id => products.find(p => p.id === id))
                                                .filter((p): p is NonNullable<typeof p> => p != null);
                                            const relatedTags = (relatedLead.tagIds || [])
                                                .map(id => tags.find(t => t.id === id))
                                                .filter((t): t is NonNullable<typeof t> => t != null);
                                            
                                            return (
                                                <div 
                                                    key={relatedLead.id} 
                                                    onClick={() => setActiveLeadId(relatedLead.id)}
                                                    className="p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-primary-400 dark:hover:border-primary-500 relative overflow-hidden group"
                                                >
                                                    <div className="absolute top-4 right-4 text-gray-300 group-hover:text-primary-500 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                                                    </div>
                                                    
                                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 pr-8">{relatedLead.name}</h5>
                                                    <div className="text-sm mt-2 space-y-1">
                                                        <p><strong className="text-gray-600 dark:text-gray-400">Etapa:</strong> {relatedStage?.name ?? 'N/A'}</p>
                                                        <div className="flex items-center">
                                                            <strong className="text-gray-600 dark:text-gray-400 mr-1">Sub-Etapa:</strong>
                                                            {relatedTags.length > 0 ? ( 
                                                                <div className="flex flex-wrap gap-1">
                                                                    {relatedTags.map(t => (
                                                                        <span key={t.id} className="px-2 py-0.5 text-xs font-medium rounded-full text-white" style={{ backgroundColor: t.color }}>
                                                                            {t.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (<span className="ml-1 text-gray-500">N/A</span>)}
                                                        </div>
                                                        <div className="mt-1">
                                                            <strong className="text-gray-600 dark:text-gray-400">Productos:</strong>
                                                            {relatedProducts.length > 0 ?
                                                            ( <ul className="list-disc list-inside ml-4 mt-1 text-gray-700 dark:text-gray-300"> {relatedProducts.map(p => p && <li key={p.id}>{p.name}</li>)} </ul> ) : ( <span className="ml-1 text-gray-500">N/A</span> )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div> 

                {/* --- BOTONES FIJOS ABAJO --- */}
                <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl sticky bottom-0 z-10 mt-2">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button variant="secondary" onClick={() => setIsDuplicateModalOpen(true)}>Duplicar</Button>
                    <Button onClick={() => setIsEditModalOpen(true)}>Editar Prospecto</Button>
                </div>
            </Modal>
            
            {/* --- MODAL DE EDICIÓN --- */}
            {isEditModalOpen && (
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    title={`Editar ${activeLead.name}`}
                >
                    <LeadForm 
                        lead={activeLead} 
                        onSuccess={handleEditSuccess} 
                    /> 
                </Modal>
            )}

            {/* --- MODAL DE DUPLICACIÓN --- */}
            {isDuplicateModalOpen && (
                <Modal 
                    isOpen={isDuplicateModalOpen} 
                    onClose={() => setIsDuplicateModalOpen(false)} 
                    title={`Duplicar a ${activeLead.name}`}
                >
                    <LeadForm 
                        duplicateFrom={activeLead} 
                        onSuccess={handleDuplicateSuccess} 
                    /> 
                </Modal>
            )}
        </>
    );
};

export default LeadDetailsModal;