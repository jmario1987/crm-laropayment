import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { USER_ROLES } from '../../types';
import PipelineColumn from './PipelineColumn';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import BulkImportModal from './BulkImportModal';

const Pipeline: React.FC = () => {
  const { leads, dispatch, sellers, stages } = useLeads();
  const { user } = useAuth();
  const [selectedSellerId, setSelectedSellerId] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const showFilter = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;
  const isAdmin = user?.role === USER_ROLES.Admin;
  
  const pipelineStages = useMemo(() => 
    stages.filter(s => s.type === 'open' || s.type === 'lost').sort((a,b) => a.order - b.order), 
  [stages]);

  const filteredLeads = useMemo(() => {
    if (!showFilter || selectedSellerId === 'all') {
        return leads;
    }
    return leads.filter(lead => lead.ownerId === selectedSellerId);
  }, [leads, selectedSellerId, showFilter]);

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedSellerId(e.target.value);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatusId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const originalStatus = e.dataTransfer.getData('originalStatus');
    
    document.querySelectorAll('.pipeline-column').forEach(col => col.classList.remove('bg-primary-100', 'dark:bg-primary-900'));
    
    if (newStatusId !== originalStatus) {
      const leadToUpdate = leads.find(lead => lead.id === leadId);
      if (leadToUpdate) {
        dispatch({
          type: 'UPDATE_LEAD',
          payload: { ...leadToUpdate, status: newStatusId },
        });
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-primary-100', 'dark:bg-primary-900');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary-100', 'dark:bg-primary-900');
  };

  return (
    <>
    <div className="h-full flex flex-col">
        {(showFilter || isAdmin) && (
             <div className="pb-4 flex justify-end items-center gap-4 flex-wrap">
                 {isAdmin && (
                     <Button onClick={() => setIsImportModalOpen(true)} variant="secondary">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                         Importar Prospectos
                     </Button>
                 )}
                 {showFilter && (
                     <div className="w-full sm:w-64">
                         <label htmlFor="seller-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Filtrar por vendedor
                         </label>
                         <select
                             id="seller-filter"
                             name="seller-filter"
                             className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                             value={selectedSellerId}
                             onChange={handleSellerChange}
                         >
                             <option value="all">Todos los vendedores</option>
                             {sellers.map((seller) => (
                             <option key={seller.id} value={seller.id}>
                                 {seller.name}
                             </option>
                             ))}
                         </select>
                     </div>
                 )}
             </div>
        )}
        {/* VOLVEMOS AL DISEÑO FLEX CON SCROLL HORIZONTAL */}
        <div className="flex-grow flex overflow-x-auto space-x-4 pb-4">
            {pipelineStages.map((stage) => {
                const leadsInStage = filteredLeads.filter((lead) => lead.status === stage.id);
                return (
                <div
                    key={stage.id}
                    // RESTAURAMOS EL ANCHO FIJO PARA CADA COLUMNA
                    className="pipeline-column flex-shrink-0 w-80 flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md transition-colors duration-300"
                    onDrop={(e) => handleDrop(e, stage.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e)}
                    onDragLeave={(e) => handleDragLeave(e)}
                >
                    <div className={`px-3 py-2 font-semibold text-lg text-gray-700 dark:text-gray-200 border-t-4 rounded-t-lg flex justify-between items-center bg-white dark:bg-gray-800`}
                         style={{ borderTopColor: stage.color }}
                    >
                        <span>{stage.name}</span>
                        <span className="px-2 py-1 text-sm font-bold rounded-full text-white" style={{ backgroundColor: stage.color }}>
                            {leadsInStage.length}
                        </span>
                    </div>
                    <PipelineColumn
                        stage={stage}
                        leads={leadsInStage}
                        handleDragEnd={handleDragEnd}
                    />
                </div>
                );
            })}
        </div>
    </div>
    {isImportModalOpen && (
        <BulkImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
        />
    )}
    </>
  );
};

export default Pipeline;