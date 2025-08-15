// components/notifications/Notifications.tsx (Versión Corregida)

import React from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../types';

const Notifications: React.FC = () => {
  const { stagnantLeads } = useLeads();
  const { user } = useAuth();

  const isManager = user?.role === USER_ROLES.Admin || user?.role === USER_ROLES.Supervisor;

  if (!isManager) {
    return null;
  }

  const notificationCount = stagnantLeads.length;

  return (
    <div className="relative">
      <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
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
    </div>
  );
};

export default Notifications;