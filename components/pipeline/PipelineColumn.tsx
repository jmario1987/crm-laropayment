// components/pipeline/PipelineColumn.tsx (Versión Corregida)

import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Lead, Stage } from '../../types';
import LeadCard from './LeadCard';

interface PipelineColumnProps {
  stage: Stage;
  leads: Lead[];
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ stage, leads }) => {
  return (
    <div className="flex-grow min-h-[100px] px-2 pt-2 overflow-y-auto">
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`h-full transition-colors duration-300 rounded-md ${snapshot.isDraggingOver ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-900'}`}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} stage={stage} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default PipelineColumn;