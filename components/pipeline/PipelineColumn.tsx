import React from 'react';
import { Lead, Stage } from '../../types';
import LeadCard from './LeadCard';

interface PipelineColumnProps {
  stage: Stage;
  leads: Lead[];
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ stage, leads, handleDragEnd }) => {
  return (
    // --- CLASES MEJORADAS PARA EL SCROLL TÁCTIL ---
    // 'h-full': asegura que tenga una altura definida para hacer scroll
    // 'touch-action-pan-y': le dice al navegador que priorice el scroll vertical
    <div className="h-full flex-grow p-2 overflow-y-auto space-y-3 touch-action-pan-y">
      {leads.map(lead => (
        <LeadCard
          key={lead.id}
          lead={lead}
          stage={stage}
          handleDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};

export default PipelineColumn;