// components/notifications/Notifications.tsx (Versión Final Interactiva)

import React, { useState, useEffect, useRef } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, Lead } from '../../types';

interface NotificationsProps {
  onLeadSelect: (lead: Lead) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onLeadSelect }) => {
  const { stagnantLeads, getStageById } = useLeads();
  const { user } = useAuth();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

  // Efecto para cerrar el panel si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isManager) {
    return null;
  }

  const notificationCount = stagnantLeads.length;

  const handleNotificationClick = (lead: Lead) => {
    onLeadSelect(lead);
    setIsPanelOpen(false); // Cierra el panel después de seleccionar
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>

      {notificationCount > 0 && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}

      {/* Panel Desplegable de Notificaciones */}
      {isPanelOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700">
          <div className="p-3 border-b dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Notificaciones</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationCount > 0 ? (
              <ul>
                {stagnantLeads.map(lead => {
                  const daysInStage = Math.floor((new Date().getTime() - new Date(lead.lastUpdate).getTime()) / (1000 * 3600 * 24));
                  return (
                    <li 
                      key={lead.id} 
                      onClick={() => handleNotificationClick(lead)}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{lead.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-red-500">{daysInStage} días</span> en la etapa "{getStageById(lead.status)?.name || 'Desconocida'}"
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay notificaciones nuevas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;