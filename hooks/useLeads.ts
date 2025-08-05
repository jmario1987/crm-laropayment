
import { useContext, useMemo, useCallback } from 'react';
import { LeadContext } from '../context/LeadContext';
import { useAuth } from './useAuth';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  const context = useContext(LeadContext);
  const { user } = useAuth();
  
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch } = context;

  const visibleLeads = useMemo(() => {
    if (!user) return [];
    if (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor) {
      return state.leads;
    }
    return state.leads.filter(lead => lead.ownerId === user.id);
  }, [state.leads, user]);
  
  const users = state.users;
  const sellers = useMemo(() => users.filter(u => u.role === USER_ROLES.Vendedor), [users]);

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  const getProductById = useCallback((id: string) => {
    return state.products.find(p => p.id === id);
  }, [state.products]);

  const getProviderById = useCallback((id: string) => {
    return state.providers.find(p => p.id === id);
  }, [state.providers]);
  
  const getStageById = useCallback((id: string) => {
    return state.stages.find(s => s.id === id);
  }, [state.stages]);

  const wonStageIds = useMemo(() => 
    state.stages.filter(s => s.type === 'won').map(s => s.id),
  [state.stages]);

  const lostStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'lost').map(s => s.id),
  [state.stages]);

  return { 
    leads: visibleLeads, 
    allLeads: state.leads,
    users,
    sellers,
    roles: state.roles,
    products: state.products,
    providers: state.providers,
    stages: state.stages,
    getUserById,
    getProductById,
    getProviderById,
    getStageById,
    wonStageIds,
    lostStageIds,
    dispatch 
  };
};
