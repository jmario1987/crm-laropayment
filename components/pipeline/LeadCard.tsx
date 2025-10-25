import React, { useState, useMemo } from 'react';
// --- 1. IMPORTAMOS Product ---
import { Lead, Stage, Tag, Product } from '../../types'; 
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';

const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1H7zM7 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H7zM7 14a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1H7zM12 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1h-1zM12 8a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1h-1zM12 14a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  // --- 2. OBTENEMOS LA LISTA DE PRODUCTOS DEL CONTEXTO ---
  const { allLeads, tags, products } = useLeads(); 
  
  // Usamos freshLead para asegurarnos de tener la última versión del lead
  const freshLead = useMemo(() => allLeads.find(l => l.id === lead.id) || lead, [allLeads, lead.id, lead]); // Añadido lead.id y lead como dependencias

  const daysInCurrentStage = useMemo(() => {
    try {
      if (!freshLead.statusHistory || freshLead.statusHistory.length === 0) {
        if (!freshLead.createdAt) return 0;
        const timeDiff = new Date().getTime() - new Date(freshLead.createdAt).getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      // Busca la última entrada para la etapa actual
      const currentStageEntries = freshLead.statusHistory.filter(h => h.status === freshLead.status);
      const lastStageEntry = currentStageEntries.pop(); // Obtiene la más reciente
      
      if (!lastStageEntry || !lastStageEntry.date) {
         // Si no hay historial para esta etapa, calcula desde createdAt
         if (!freshLead.createdAt) return 0;
         const timeDiff = new Date().getTime() - new Date(freshLead.createdAt).getTime();
         return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      
      const timeDiff = new Date().getTime() - new Date(lastStageEntry.date).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating days in stage for lead:", freshLead.id, error);
      return 0;
    }
    // Añadida dependencia freshLead.status
  }, [freshLead.statusHistory, freshLead.createdAt, freshLead.status]); 

  const lastUpdateDays = useMemo(() => {
    if (!freshLead.lastUpdate) return null;
    try {
      const timeDiff = new Date().getTime() - new Date(freshLead.lastUpdate).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating last update days:", error);
      return null;
    }
  }, [freshLead.lastUpdate]);

  const assignedTags = useMemo(() => {
    return (freshLead.tagIds || [])
      .map(id => tags.find(t => t.id === id))
      .filter((tag): tag is Tag => tag !== undefined);
  // Añadida dependencia freshLead._version si la usas para forzar re-render
  }, [freshLead.tagIds, tags, freshLead._version]); 

  // --- 3. CALCULAMOS LOS NOMBRES DE LOS PRODUCTOS ---
  const interestedProductNames = useMemo(() => {
    return (freshLead.productIds || [])
      .map(id => products.find(p => p.id === id)?.name) // Obtenemos el nombre
      .filter((name): name is string => name !== undefined) // Filtramos si no se encontró
      .join(', '); // Unimos los nombres con comas
  }, [freshLead.productIds, products]);

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
        id={lead.id} // Usamos lead.id original para drag & drop estable
        className="lead-card bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 mb-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 flex flex-col"
        onClick={() => setIsDetailsModalOpen(true)}
      >
        <div className="flex-grow cursor-pointer">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{freshLead.name}</h4>
              
              <div
                draggable
                onDragStart={(e) => {
                  e.stopPropagation(); 
                  e.dataTransfer.setData('leadId', lead.id); // Usar lead.id original
                  e.dataTransfer.setData('sourceStageId', stage.id);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  handleDragEnd(e);
                }}
                onClick={(e) => e.stopPropagation()} 
                className="cursor-grab active:cursor-grabbing p-1 -mr-2 -mt-1"
              >
                <DragHandleIcon />
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{freshLead.company}</p>
            
            {/* --- 4. MOSTRAMOS LOS PRODUCTOS --- */}
            {interestedProductNames && (
              <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 001 1h10a1 1 0 001-1V8l-.007-.117A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="truncate" title={interestedProductNames}> {/* Truncate si es muy largo */}
                  {interestedProductNames}
                </span>
              </div>
            )}
            
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
            {/* Icono de Calendario */}
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{daysInCurrentStage}d en etapa</span>
          </div>
          <div className="flex items-center" title={`Última actualización hace ${lastUpdateDays} días`}>
            {stage.type !== 'lost' && stage.type !== 'won' && getTimeBadge()} 
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