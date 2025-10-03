import React, { useState, useMemo } from 'react';
import { Lead, Stage, Tag } from '../../types'; // Se puede añadir Tag para mayor claridad
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { tags } = useLeads();

  const daysInCurrentStage = useMemo(() => {
    try {
      if (!lead.statusHistory || lead.statusHistory.length === 0) {
        if (!lead.createdAt) return 0;
        const timeDiff = new Date().getTime() - new Date(lead.createdAt).getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      const lastStageEntry = lead.statusHistory[lead.statusHistory.length - 1];
      if (!lastStageEntry || !lastStageEntry.date) return 0;
      
      const timeDiff = new Date().getTime() - new Date(lastStageEntry.date).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating days in stage:", error);
      return 0;
    }
  }, [lead.statusHistory, lead.createdAt]);

  const lastUpdateDays = useMemo(() => {
    if (!lead.lastUpdate) return null;
    try {
      const timeDiff = new Date().getTime() - new Date(lead.lastUpdate).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating last update days:", error);
      return null;
    }
  }, [lead.lastUpdate]);

  const assignedTags = useMemo(() => {
    // CORRECCIÓN: Se usa (lead.tagIds || []) para asegurar que siempre sea un array.
    // Se mapea y filtra para encontrar los objetos Tag completos.
    return (lead.tagIds || [])
      .map(id => tags.find(t => t.id === id))
      .filter((tag): tag is Tag => tag !== undefined); // Filtra los nulos y asegura el tipo
  }, [lead.tagIds, tags]);

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
      <div 
        id={lead.id} 
        className="lead-card bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 mb-3 cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
        draggable
        onDragEnd={handleDragEnd}
        onDragStart={(e) => {
          e.dataTransfer.setData('leadId', lead.id);
          e.dataTransfer.setData('sourceStageId', stage.id);
        }}
        onClick={() => setIsDetailsModalOpen(true)}
      >
        <div className="cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{lead.name}</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{lead.company}</p>
            
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
        lead={lead}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />}
    </>
  );
};

export default LeadCard;