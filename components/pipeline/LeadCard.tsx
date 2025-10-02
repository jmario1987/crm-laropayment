import React, { useState, useMemo } from 'react';
import { Lead, Stage } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';

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
      return isNaN(days) ? 0 : days;
    } catch (error) {
      console.error("Error calculando días en etapa:", error);
      return 0;
    }
  }, [freshLead.statusHistory, freshLead.createdAt]);


  const daysSinceLastUpdate = useMemo(() => {
    const referenceDate = freshLead.lastUpdate || freshLead.createdAt;
    if (!referenceDate) return 0;
    const timeDiff = new Date().getTime() - new Date(referenceDate).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }, [freshLead.lastUpdate, freshLead.createdAt]);

  const assignedTags = useMemo(() => {
    return (freshLead.tagIds || [])
        .map(id => tags.find(t => t.id === id))
        .filter((t): t is NonNullable<typeof t> => t != null);
  // <-- SE AÑADE LA VERSIÓN COMO DEPENDENCIA PARA FORZAR EL RE-CÁLCULO
  }, [freshLead.tagIds, tags, freshLead._version]);


  const getTimeBadge = () => {
    let badgeColorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (daysSinceLastUpdate >= 8) {
      badgeColorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (daysSinceLastUpdate >= 4) {
      badgeColorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    const displayText = daysSinceLastUpdate === 0 ? 'Hoy' : `${daysSinceLastUpdate}d`;

    return (
      <span title={`Última actualización: hace ${daysSinceLastUpdate} día(s)`} className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColorClass}`}>
        ✍️ {displayText}
      </span>
    );
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', freshLead.id);
    e.dataTransfer.setData('originalStatus', freshLead.status);
    e.currentTarget.classList.add('opacity-50');
  };

  const openDetailsModal = () => setIsDetailsModalOpen(true);

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border-l-4"
        style={{ borderLeftColor: stage?.color || '#cccccc' }}
      >
        <div onClick={openDetailsModal} className="cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{freshLead.name}</h4>
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
            <span>🗓️</span>
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