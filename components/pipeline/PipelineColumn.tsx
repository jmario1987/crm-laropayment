
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
    <div className="p-2 space-y-3 overflow-y-auto h-[calc(100%-4rem)]">
      {leads.map((lead) => (
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
