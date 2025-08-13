// components/pipeline/Pipeline.tsx (Versión Corregida y Final)

import React, { useState, useMemo } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { USER_ROLES, Lead } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import BulkImportModal from './BulkImportModal';
import PipelineColumn from './PipelineColumn';
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

const Pipeline: React.FC = () => {
  const { allLeads, dispatch, sellers, stages } = useLeads();
  const { user } = useAuth();
  const [selectedSellerId, setSelectedSellerId] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;
  const isAdmin = user?.role === USER_ROLES.Admin;

  const pipelineStages = useMemo(() => stages.filter(s => s.type === 'open').sort((a, b) => a.order - b.order), [stages]);

  const visibleLeads = useMemo(() => {
    if (!isManager) return allLeads.filter(lead => lead.ownerId === user?.id);
    if (selectedSellerId === 'all') return allLeads;
    return allLeads.filter(lead => lead.ownerId === selectedSellerId);
  }, [allLeads, user, isManager, selectedSellerId]);

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSellerId(e.target.value);
  };

  // La nueva función onDragEnd que maneja toda la lógica
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const leadToMove = allLeads.find(lead => lead.id === draggableId);

    if (leadToMove) {
      const oldHistory = leadToMove.statusHistory || [];
      const newHistoryEntry = { status: destination.droppableId, date: new Date().toISOString() };
      const newStatusHistory = [...oldHistory, newHistoryEntry];
      const updatedLead = {
        ...leadToMove,
        status: destination.droppableId,
        statusHistory: newStatusHistory,
        lastUpdate: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_LEAD', payload: updatedLead });
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {(isManager || isAdmin) && (
          <div className="pb-4 flex justify-end items-center gap-4 flex-wrap">
            {isAdmin && <Button onClick={() => setIsImportModalOpen(true)}>Importar Prospectos</Button>}
            {isManager && (
              <div className="w-full sm:w-64">
                <select
                  id="seller-filter"
                  value={selectedSellerId}
                  onChange={handleSellerChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">Todos los vendedores</option>
                  {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
        
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-grow flex space-x-4 pb-4 overflow-x-auto">
            {pipelineStages.map((stage) => {
              const leadsInStage = visibleLeads.filter((lead) => lead.status === stage.id);
              return (
                <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col bg-transparent rounded-lg">
                  <div className={`px-3 py-2 font-semibold text-lg text-gray-700 dark:text-gray-200 border-t-4 rounded-t-lg flex justify-between items-center bg-white dark:bg-gray-800`} style={{ borderTopColor: stage.color }}>
                    <span>{stage.name}</span>
                    <span className="px-2 py-1 text-sm font-bold rounded-full text-white" style={{ backgroundColor: stage.color }}>{leadsInStage.length}</span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-b-lg flex-1">
                    <PipelineColumn stage={stage} leads={leadsInStage} />
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {isImportModalOpen && <BulkImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />}
    </>
  );
};

export default Pipeline;