// hooks/useLeads.ts (Versión Final y Completa)

import { useContext, useMemo } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  // 1. Tomamos el contexto completo, que ahora tiene las 3 listas de notificaciones.
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, stagnantLeads, sellerNotifications, managerResponseNotifications } = context;

  // 2. Lógica para obtener los IDs de etapas ganadas y perdidas (para el Dashboard).
  const wonStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'won').map(s => s.id),
    [state.stages]
  );

  const lostStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'lost').map(s => s.id),
    [state.stages]
  );

  // 3. El resto de las funciones de ayuda se mantienen igual.
  const sellers = state.users.filter(u => u.role === USER_ROLES.Vendedor);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);

  // 4. Devolvemos un solo objeto "plano" con TODA la información que los componentes necesitan.
  return {
    ...state,
    allLeads: state.leads,
    sellers,
    stagnantLeads,
    sellerNotifications, // <-- Se añade la nueva lista
    managerResponseNotifications, // <-- Se añade la nueva lista
    wonStageIds,
    lostStageIds,
    dispatch,
    getStageById,
    getProviderById,
    getUserById
  };
};