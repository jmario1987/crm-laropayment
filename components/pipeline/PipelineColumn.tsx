import React from 'react';
import { Lead, Stage } from '../../types';
import LeadCard from './LeadCard';

interface PipelineColumnProps {
  stage: Stage;
  leads: Lead[];
  // Ya no necesitamos handleDragEnd aquí
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ stage, leads }) => {
  return (
    <div className="h-full flex-grow p-2 overflow-y-auto space-y-3 touch-action-pan-y">
      {leads.map(lead => (
        <LeadCard
          key={lead.id}
          lead={lead}
          stage={stage}
          // Ya no le pasamos handleDragEnd a la tarjeta
        />
      ))}
    </div>
  );
};

export default PipelineColumn;