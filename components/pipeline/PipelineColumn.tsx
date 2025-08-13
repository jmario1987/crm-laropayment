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
    // Contenedor simple que renderiza las tarjetas
    <div className="flex-grow p-2 overflow-y-auto space-y-3">
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