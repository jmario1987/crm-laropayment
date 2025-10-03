import React, { useState, useMemo } from 'react';
import { Lead, Stage, Tag } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';

// --- Icono de Agarre (Drag Handle) ---
const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1H7zM7 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H7zM7 14a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H7zM12 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1h-1zM12 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1h-1zM12 14a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { allLeads, tags } = useLeads();
  
  const freshLead = useMemo(() => allLeads.find(l => l.id === lead.id) || lead, [allLeads, lead]);

  const daysInCurrentStage = useMemo(() => {
    try {
      if (!freshLead.statusHistory || freshLead.statusHistory.length === 0) {
        if (!freshLead.createdAt) return 0;
        const timeDiff = new Date().getTime() - new Date(freshLead.createdAt).getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      const lastStageEntry = freshLead.statusHistory[freshLead.statusHistory.length - 1];
      if (!lastStageEntry || !lastStageEntry.date) return 0;
      
      const timeDiff = new Date().getTime() - new Date(lastStageEntry.date).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating days in stage:", error);
      return 0;
    }
  }, [freshLead.statusHistory, freshLead.createdAt]);

  const lastUpdateDays = useMemo(() => {
    if (!freshLead.lastUpdate) return null;
    try {
      const timeDiff = new Date().getTime() - new Date(freshLead.lastUpdate).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating last update days:", error);
      return null;
    }
  }, [freshLead.lastUpdate]);

  const assignedTags = useMemo(() => {
    return (freshLead.tagIds || [])
      .map(id => tags.find(t => t.id === id))
      .filter((tag): tag is Tag => tag !== undefined);
  }, [freshLead.tagIds, tags, freshLead._version]);

  const getTimeBadge = () => {
    if (lastUpdateDays === null) return null;
    let bgColor = 'bg-green-500';
    if (lastUpdateDays > 3 && lastUpdateDays <= 7) bgColor = 'bg-yellow-500';
    else if (lastUpdateDays > 7) bgColor = 'bg-red-500';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full text-white ${bgColor}`}>
        {lastUpdateDays}d
      </span>
    );
  };
  
  return (
    <>
      {/* El contenedor principal ya NO es arrastrable */}
      <div 
        id={lead.id} 
        className="lead-card bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 mb-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 flex flex-col"
        onClick={() => setIsDetailsModalOpen(true)}
      >
        <div className="flex-grow cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{freshLead.name}</h4>
              
              {/* --- AGARRE PARA DRAG & DROP --- */}
              {/* Este es el único elemento arrastrable. Se detiene la propagación del click para no abrir el modal */}
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation(); // Previene que el evento afecte al contenedor padre
                  e.dataTransfer.setData('leadId', freshLead.id);
                  e.dataTransfer.setData('sourceStageId', stage.id);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  handleDragEnd(e);
                }}
                onClick={(e) => e.stopPropagation()} // Detiene el click para que no se abra el modal
                className="cursor-grab active:cursor-grabbing p-1 -mr-2 -mt-1"
              >
                <DragHandleIcon />
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{freshLead.company}</p>
            
            {assignedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {assignedTags.map(tag => (
                        <span key={tag.id} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div title={`Días en esta etapa: ${daysInCurrentStage}`} className="flex items-center space-x-1">
            <span></span>
            <span>{daysInCurrentStage}d en etapa</span>
          </div>
          <div className="flex items-center">
            {stage.type !== 'lost' && getTimeBadge()}
          </div>
        </div>
      </div>
      
      {isDetailsModalOpen && <LeadDetailsModal
        lead={freshLead}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />}
    </>
  );
};

export default LeadCard;