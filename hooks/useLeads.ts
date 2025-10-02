import { useContext, useMemo } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, stagnantLeads, sellerNotifications, managerResponseNotifications } = context;

  const wonStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'won').map(s => s.id),
    [state.stages]
  );

  const lostStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'lost').map(s => s.id),
    [state.stages]
  );

  const sellers = state.users.filter(u => u.role === USER_ROLES.Vendedor);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);
  
  // <-- CAMBIO: Se añade la función para obtener una etiqueta por su ID
  const getTagById = (id: string) => state.tags.find(t => t.id === id);

  return {
    ...state, // <-- CAMBIO: Esto ya incluye 'leads', 'stages', 'products', 'providers' y AHORA TAMBIÉN 'tags'
    allLeads: state.leads,
    sellers,
    stagnantLeads,
    sellerNotifications,
    managerResponseNotifications,
    wonStageIds,
    lostStageIds,
    dispatch,
    getStageById,
    getProviderById,
    getUserById,
    getTagById, // <-- CAMBIO: Se exporta la nueva función de ayuda
  };
};