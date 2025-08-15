// hooks/useLeads.ts (Versión Final y Corregida)

import { useContext, useMemo } from 'react'; // Se añade 'useMemo' para mayor eficiencia
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, stagnantLeads } = context;

  // --- LÓGICA RE-INTEGRADA ---
  // Se vuelven a calcular los IDs de las etapas ganadas y perdidas,
  // ya que el Dashboard los necesita para sus estadísticas.
  const wonStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'won').map(s => s.id),
    [state.stages]
  );

  const lostStageIds = useMemo(() =>
    state.stages.filter(s => s.type === 'lost').map(s => s.id),
    [state.stages]
  );

  // El resto de las funciones de ayuda se mantienen igual.
  const sellers = state.users.filter(u => u.role === USER_ROLES.Vendedor);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);

  // Se devuelven todos los datos que los componentes necesitan.
  return {
    ...state,
    allLeads: state.leads,
    sellers,
    stagnantLeads,
    wonStageIds, // <-- Se añade de nuevo
    lostStageIds, // <-- Se añade de nuevo
    dispatch,
    getStageById,
    getProviderById,
    getUserById
  };
};