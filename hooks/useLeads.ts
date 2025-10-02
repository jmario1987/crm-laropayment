import { useContext, useMemo } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, reloadData } = context;

  const sellers = useMemo(() => state.users.filter(u => u.role === USER_ROLES.Vendedor), [state.users]);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);

  return {
    ...state,
    allLeads: state.leads,
    sellers,
    dispatch,
    reloadData,
    getStageById,
    getProviderById,
    getUserById,
  };
};