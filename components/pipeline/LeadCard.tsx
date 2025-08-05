
import React, { useState, useMemo } from 'react';
import { Lead, Stage } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { generateFollowUpEmail } from '../../services/geminiService';
import Spinner from '../ui/Spinner';
import LeadDetailsModal from '../leads/LeadDetailsModal';

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGenerateEmail = async () => {
    setIsLoading(true);
    setEmailContent('');
    try {
      const content = await generateFollowUpEmail(lead);
      setEmailContent(content);
    } catch (error) {
        if(error instanceof Error) {
            setEmailContent(`Error: ${error.message}`);
        } else {
            setEmailContent(`Ha ocurrido un error inesperado.`);
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
    handleGenerateEmail();
  };

  const openDetailsModal = () => setIsDetailsModalOpen(true);

  const stageColor = stage?.color || '#cccccc';
  const stageName = stage?.name || 'Desconocido';

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md border-l-4"
        style={{ borderLeftColor: stageColor }}
      >
        <div onClick={openDetailsModal} className="cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{lead.name}</h4>
              <div className="flex items-center space-x-2 flex-shrink-0">
                  {stage.type === 'open' && getTimeBadge()}
                  <span 
                      className="px-2 py-1 text-xs font-bold rounded-full text-white"
                      style={{ backgroundColor: stageColor }}
                  >
                      {stageName}
                  </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{lead.company}</p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 truncate">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span className="truncate">{lead.email}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={handleOpenEmailModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2v0Z"/><path d="M12 18a6 6 0 0 0 6-6c0-2-1-3.9-3-5"/><path d="m9 9 3 3L9 6"/></svg>
            IA
          </Button>
        </div>
      </div>
      
      {isDetailsModalOpen && <LeadDetailsModal
        lead={lead}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />}

      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={`Sugerencia de Correo para ${lead.name}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Spinner />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Generando correo con IA...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
                {emailContent}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigator.clipboard.writeText(emailContent)}>Copiar Texto</Button>
              </div>
            </div>
          )}
      </Modal>
    </>
  );
};

export default LeadCard;
