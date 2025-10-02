import React from 'react';
import { StatusHistoryEntry } from '../../types';
import { useLeads } from '../../hooks/useLeads';

const TimelineIcon: React.FC<{ color: string }> = ({ color }) => (
    <span 
        className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3.5 ring-4 ring-white dark:ring-gray-800"
        style={{ backgroundColor: color }}
    >
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
    </span>
);


const LeadTimeline: React.FC<{ history: StatusHistoryEntry[] | undefined }> = ({ history }) => {
    const { getStageById } = useLeads();
    
    // <-- CAMBIO CLAVE: Se maneja el caso de que el historial sea undefined de forma más segura.
    if (!history || history.length === 0) {
        return <p className="text-gray-500 dark:text-gray-400">No hay historial de etapas disponible.</p>;
    }
    
    // Se ordena el historial del más reciente al más antiguo
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-4">                  
            {sortedHistory.map((entry, index) => {
                // <-- CAMBIO CLAVE: Se añade una comprobación para evitar errores si una entrada del historial es inválida.
                if (!entry || !entry.status) {
                    return null; // No renderiza nada si la entrada no es correcta
                }

                const stage = getStageById(entry.status);
                const stageName = stage?.name || `Etapa (ID: ${entry.status})`;
                const stageColor = stage?.color || '#9ca3af';

                return (
                    <li key={index} className="mb-6 ml-6">
                        <TimelineIcon color={stageColor} />
                        <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900 dark:text-white">
                            {stageName}
                        </h3>
                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                            {new Date(entry.date).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </time>
                    </li>
                );
            })}
        </ol>
    );
};

export default LeadTimeline;