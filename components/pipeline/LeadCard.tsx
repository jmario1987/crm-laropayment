import React, { useState, useMemo } from 'react';
import { Lead, Stage, Tag } from '../../types'; 
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';

// Eliminamos la interfaz del DragHandleIcon porque ya no se usa

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  // Eliminamos handleDragEnd de los Props
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { allLeads, tags, products, getUserById } = useLeads(); 
  const { user } = useAuth(); 
  
  const freshLead = useMemo(() => allLeads.find(l => l.id === lead.id) || lead, [allLeads, lead.id, lead]); 

  // --- LÓGICA DE ETIQUETAS DE CO-PROPIEDAD ---
  const isCoOwned = freshLead.creatorId && freshLead.creatorId !== freshLead.ownerId;
  
  let coOwnerBadge = null;
  if (isCoOwned && user) {
      if (user.id === freshLead.creatorId) {
          const ownerName = getUserById(freshLead.ownerId)?.name || 'otro vendedor';
          coOwnerBadge = (
              <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full border border-yellow-200" title="Tú trajiste este cliente, pero lo está gestionando alguien más.">
                  Asignado a: {ownerName}
              </span>
          );
      } else if (user.id === freshLead.ownerId) {
          const creatorName = getUserById(freshLead.creatorId || '')?.name || 'un SDR';
          coOwnerBadge = (
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200" title="Este cliente fue prospectado por otro compañero.">
                  Traído por: {creatorName}
              </span>
          );
      }
  }

  const daysInCurrentStage = useMemo(() => {
    try {
      if (!freshLead.statusHistory || freshLead.statusHistory.length === 0) {
        if (!freshLead.createdAt) return 0;
        const timeDiff = new Date().getTime() - new Date(freshLead.createdAt).getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      const currentStageEntries = freshLead.statusHistory.filter(h => h.status === freshLead.status);
      const lastStageEntry = currentStageEntries.pop(); 
      
      if (!lastStageEntry || !lastStageEntry.date) {
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
  }, [freshLead.tagIds, tags, freshLead._version]); 

  const interestedProductNames = useMemo(() => {
    return (freshLead.productIds || [])
      .map(id => products.find(p => p.id === id)?.name) 
      .filter((name): name is string => name !== undefined) 
      .join(', '); 
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
        id={lead.id} 
        // Eliminamos la propiedad draggable
        className="lead-card bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 mb-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer"
        onClick={() => setIsDetailsModalOpen(true)}
      >
        <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-2">
                  <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{freshLead.name}</h4>
                  {coOwnerBadge}
              </div>
              
              {/* Se eliminó el div que contenía el DragHandleIcon y los eventos de DragStart/End */}

            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">{freshLead.company}</p>
            
            {interestedProductNames && (
              <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 001 1h10a1 1 0 001-1V8l-.007-.117A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="truncate" title={interestedProductNames}>
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