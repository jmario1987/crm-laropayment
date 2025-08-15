// components/notifications/Notifications.tsx (Versión Final y Completa)

import React, { useState, useEffect, useRef } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES, Lead } from '../../types';

interface NotificationsProps {
  onLeadSelect: (lead: Lead) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onLeadSelect }) => {
  const { stagnantLeads, sellerNotifications, managerResponseNotifications, getStageById, users } = useLeads();
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

  if (!user) return null; // No mostrar nada si no hay usuario

  // Calculamos el número total de notificaciones según el rol
  const notificationCount = isManager 
    ? stagnantLeads.length + managerResponseNotifications.length 
    : sellerNotifications.length;

  const handleNotificationClick = (lead: Lead) => {
    onLeadSelect(lead);
    setIsPanelOpen(false);
  };
  
  const getManagerName = (managerId: string) => {
    return users.find(u => u.id === managerId)?.name || 'Un manager';
  }

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

      {isPanelOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border dark:border-gray-700">
          <div className="p-3 border-b dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">Notificaciones</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notificationCount > 0 ? (
              <ul>
                {/* Notificaciones para Managers */}
                {isManager && stagnantLeads.map(lead => {
                  const days = Math.floor((new Date().getTime() - new Date(lead.lastUpdate).getTime()) / (1000 * 3600 * 24));
                  return (
                    <li key={`stagnant-${lead.id}`} onClick={() => handleNotificationClick(lead)} className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">Prospecto Estancado</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <b>{lead.name}</b> lleva <span className="font-bold text-red-500">{days} días</span> en "{getStageById(lead.status)?.name}".
                      </p>
                    </li>
                  );
                })}
                {isManager && managerResponseNotifications.map(lead => (
                    <li key={`response-${lead.id}`} onClick={() => handleNotificationClick(lead)} className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">Respuesta Recibida</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <b>{users.find(u => u.id === lead.ownerId)?.name}</b> ha actualizado el prospecto <b>{lead.name}</b>.
                      </p>
                    </li>
                ))}
                
                {/* Notificaciones para Vendedores */}
                {!isManager && sellerNotifications.map(lead => (
                    <li key={`mention-${lead.id}`} onClick={() => handleNotificationClick(lead)} className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">Nueva Mención</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <b>{getManagerName(lead.notificationForManagerId || '')}</b> te ha dejado una nota en <b>{lead.name}</b>.
                      </p>
                    </li>
                ))}
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