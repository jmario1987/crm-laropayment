import React, { useState, useMemo } from 'react';
import { Lead, Stage } from '../../types';
import Modal from '../ui/Modal';
import LeadDetailsModal from '../leads/LeadDetailsModal';

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const daysInStage = useMemo(() => {
    if (!lead.statusHistory?.length) {
      const timeDiff = new Date().getTime() - new Date(lead.createdAt).getTime();
      return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }
    const lastChange = lead.statusHistory[lead.statusHistory.length - 1];
    const timeDiff = new Date().getTime() - new Date(lastChange.date).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }, [lead.statusHistory, lead.createdAt]);

  const getTimeBadge = () => {
    let badgeColorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (daysInStage >= 8) {
      badgeColorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    } else if (daysInStage >= 4) {
      badgeColorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    const displayText = daysInStage === 0 ? 'Hoy' : `${daysInStage}d`;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColorClass}`}>
        {displayText}
      </span>
    );
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('originalStatus', lead.status);
    e.currentTarget.classList.add('opacity-50');
  };

  const openDetailsModal = () => setIsDetailsModalOpen(true);

  const stageColor = stage?.color || '#cccccc';

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-md border-l-4"
        style={{ borderLeftColor: stageColor }}
      >
        <div onClick={openDetailsModal} className="cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{lead.name}</h4>
              <div className="flex items-center space-x-2 flex-shrink-0">
                  {stage.type === 'open' && getTimeBadge()}
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{lead.company}</p>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 truncate">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span className="truncate">{lead.email}</span>
          </div>
          {/* El botón de IA ha sido eliminado de aquí */}
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