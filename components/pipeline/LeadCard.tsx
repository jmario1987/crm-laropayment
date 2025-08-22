// LeadCard.tsx

import React, { useState, useMemo } from 'react';
import { Lead, Stage } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // --- NUEVO CÁLCULO: Días totales en la etapa actual ---
  // Este cálculo se basa en el historial de etapas (statusHistory).
  const daysInCurrentStage = useMemo(() => {
    if (!lead.statusHistory || lead.statusHistory.length === 0) {
      // Si no hay historial, usamos la fecha de creación como referencia.
      const timeDiff = new Date().getTime() - new Date(lead.createdAt).getTime();
      return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    }
    // Buscamos la última entrada en el historial, que corresponde a la etapa actual.
    const lastStageEntry = lead.statusHistory[lead.statusHistory.length - 1];
    const timeDiff = new Date().getTime() - new Date(lastStageEntry.date).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }, [lead.statusHistory, lead.createdAt]);


  // --- CÁLCULO EXISTENTE: Días desde la última actualización general ---
  // Este cálculo se basa en el campo 'lastUpdate'.
  const daysSinceLastUpdate = useMemo(() => {
    const referenceDate = lead.lastUpdate || lead.createdAt;
    const timeDiff = new Date().getTime() - new Date(referenceDate).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }, [lead.lastUpdate, lead.createdAt]);

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
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.setData('originalStatus', lead.status);
    e.currentTarget.classList.add('opacity-50');
  };

  const openDetailsModal = () => setIsDetailsModalOpen(true);

  // --- LÓGICA DE VISUALIZACIÓN ACTUALIZADA ---
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
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{lead.name}</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{lead.company}</p>
        </div>

        {/* --- NUEVA SECCIÓN CON DOBLE INDICADOR --- */}
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
        lead={lead}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />}
    </>
  );
};

export default LeadCard;