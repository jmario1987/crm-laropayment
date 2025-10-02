import React, { useState, useMemo } from 'react';
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

const LeadDetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string | undefined | React.ReactNode, noTruncate?: boolean }> = ({ icon, label, value, noTruncate }) => (
    <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
        <div className="w-5 mr-3 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{icon}</div>
        <span className="font-semibold mr-2">{label}:</span>
        <div className={noTruncate ? 'whitespace-pre-wrap' : 'truncate'}>{value || 'N/A'}</div>
    </div>
);

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, isOpen, onClose }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { getUserById, products, getProviderById, getStageById, tags } = useLeads();

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        onClose(); 
    };
    
    const ownerName = getUserById(lead.ownerId)?.name;
    const providerName = getProviderById(lead.providerId || '')?.name;
    const stage = getStageById(lead.status);

    const interestedProducts = useMemo(() => {
        return (lead.productIds || [])
            .map(id => products.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => p != null);
    }, [lead.productIds, products]);

    const assignedTags = useMemo(() => {
        return (lead.tagIds || [])
            .map(id => tags.find(t => t.id === id))
            .filter((t): t is NonNullable<typeof t> => t != null);
    }, [lead.tagIds, tags]);


    if (!isOpen) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Detalles de ${lead.name}`}>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Información del Prospecto</h4>
                        <div className="space-y-2">
                           <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                                label="Nombre"
                                value={lead.name}
                            />
                            <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect x="2" y="20" width="20" height="4"/></svg>}
                                label="Empresa"
                                value={lead.company}
                            />
                             <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                                label="Email"
                                value={lead.email}
                            />
                             <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                                label="Teléfono"
                                value={lead.phone}
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
                                ) : 'N/A'}
                            />
                            <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                                label="Vendedor"
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
                                ) : 'N/A'}
                            />
                            <LeadDetailItem
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
                                label="Observaciones"
                                value={lead.observations}
                                noTruncate={true}
                            />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Historial de Etapas</h4>
                        <LeadTimeline history={lead.statusHistory} />
                    </div>

                </div>
                <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg sticky bottom-0">
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button onClick={() => setIsEditModalOpen(true)}>Editar Prospecto</Button>
                </div>
            </Modal>
            
            {isEditModalOpen && <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar ${lead.name}`}>
                <LeadForm lead={lead} onSuccess={handleEditSuccess} />
            </Modal>}
        </>
    );
};

export default LeadDetailsModal;