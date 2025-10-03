import React, { useState, useMemo, useRef } from 'react';
import { Lead, Stage, Tag } from '../../types';
import LeadDetailsModal from '../leads/LeadDetailsModal';
import { useLeads } from '../../hooks/useLeads';

interface LeadCardProps {
  lead: Lead;
  stage: Stage;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, stage, handleDragEnd }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { allLeads, tags } = useLeads();

  // --- LÓGICA DE GESTOS MEJORADA ---
  const [isDraggable, setIsDraggable] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false); // Ref para detectar si hubo scroll

  const handlePressStart = () => {
    hasMoved.current = false;
    pressTimer.current = setTimeout(() => {
      // Si el temporizador se completa, entramos en modo arrastre
      if (!hasMoved.current) {
        setIsDraggable(true);
      }
    }, 300); // 300ms de espera
  };

  const handlePressEnd = () => {
    // Siempre se limpia el temporizador al soltar
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    // Si estábamos en modo arrastre, lo desactivamos después de un breve instante
    if (isDraggable) {
      setTimeout(() => setIsDraggable(false), 100);
    }
  };

  const handleMove = () => {
    // Si el dedo se mueve antes de que se complete el temporizador, es un scroll
    hasMoved.current = true;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleClick = () => {
    // Un click solo es válido si no hubo movimiento y no se activó el modo arrastre
    if (!hasMoved.current && !isDraggable) {
      setIsDetailsModalOpen(true);
    }
  };
  // --- FIN DE LA LÓGICA DE GESTOS ---
  
  const freshLead = useMemo(() => allLeads.find(l => l.id === lead.id) || lead, [allLeads, lead]);

  const daysInCurrentStage = useMemo(() => {
    try {
      if (!freshLead.statusHistory || freshLead.statusHistory.length === 0) {
        if (!freshLead.createdAt) return 0;
        const timeDiff = new Date().getTime() - new Date(freshLead.createdAt).getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      }
      const lastStageEntry = freshLead.statusHistory[freshLead.statusHistory.length - 1];
      if (!lastStageEntry || !lastStageEntry.date) return 0;
      
      const timeDiff = new Date().getTime() - new Date(lastStageEntry.date).getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : 0;
    } catch (error) {
      console.error("Error calculating days in stage:", error);
      return 0;
    }
  }, [freshLead.statusHistory, freshLead.createdAt]);

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
        className={`lead-card bg-white dark:bg-gray-800 rounded-md shadow-sm p-3 mb-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 select-none ${isDraggable ? 'cursor-grabbing opacity-80' : 'cursor-grab'}`}
        // --- ATRIBUTOS Y EVENTOS ACTUALIZADOS ---
        draggable={isDraggable}
        // Eventos Táctiles
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handleMove}
        // Eventos de Ratón (usan la misma lógica)
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseMove={handleMove}
        onMouseLeave={handlePressEnd} // Importante para cancelar si el ratón sale
        // Evento de Click
        onClick={handleClick}
        // Bloquea el menú contextual del navegador
        onContextMenu={(e) => e.preventDefault()}
        // Eventos de Arrastre Nativos
        onDragStart={(e) => {
          e.dataTransfer.setData('leadId', freshLead.id);
          e.dataTransfer.setData('sourceStageId', stage.id);
          // Opcional: añade una clase mientras se arrastra
          e.currentTarget.classList.add('dragging');
        }}
        onDragEnd={(e) => {
            e.currentTarget.classList.remove('dragging');
            handlePressEnd(); // Asegura que todo se reinicie
            handleDragEnd(e); // Llama a la función del padre
        }}
      >
        <div className="pointer-events-none">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 dark:text-white flex-1 pr-2">{freshLead.name}</h4>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{freshLead.company}</p>
            
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

        <div className="pointer-events-none mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div title={`Días en esta etapa: ${daysInCurrentStage}`} className="flex items-center space-x-1">
            <span></span>
            <span>{daysInCurrentStage}d en etapa</span>
          </div>
          <div className="flex items-center">
            {stage.type !== 'lost' && getTimeBadge()}
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