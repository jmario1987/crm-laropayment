import { useContext, useMemo, useCallback } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  const context = useContext(LeadContext);
  
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch } = context;
  const { leads, users, products, providers, stages, roles } = state;

  const sellers = useMemo(() => users.filter(u => u.role === USER_ROLES.Vendedor), [users]);

  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getProductById = useCallback((id: string) => products.find(p => p.id === id), [products]);
  const getProviderById = useCallback((id: string) => providers.find(p => p.id === id), [providers]);
  const getStageById = useCallback((id: string) => stages.find(s => s.id === id), [stages]);

  const wonStageIds = useMemo(() => stages.filter(s => s.type === 'won').map(s => s.id), [stages]);
  const lostStageIds = useMemo(() => stages.filter(s => s.type === 'lost').map(s => s.id), [stages]);

  return { 
    allLeads: leads, // Ahora solo devolvemos la lista completa
    users,
    sellers,
    roles,
    products,
    providers,
    stages,
    getUserById,
    getProductById,
    getProviderById,
    getStageById,
    wonStageIds,
    lostStageIds,
    dispatch 
  };
};