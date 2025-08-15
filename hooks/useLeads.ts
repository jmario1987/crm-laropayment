// hooks/useLeads.ts (Versión Corregida)

import { useContext } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES } from '../types';

export const useLeads = () => {
  // 1. Tomamos el contexto completo, que ahora incluye 'state', 'dispatch' y 'stagnantLeads'.
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, stagnantLeads } = context;

  // 2. Creamos funciones de ayuda para no tener que acceder a 'state' en todos los componentes.
  const sellers = state.users.filter(u => u.role === USER_ROLES.Vendedor);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);

  // 3. Devolvemos un solo objeto "plano" con toda la información que los componentes necesitan.
  return {
    ...state, // Esto incluye: leads, users, roles, products, providers, stages
    allLeads: state.leads, // Un alias para mayor claridad
    sellers,
    stagnantLeads, // <-- La nueva lista de notificaciones
    dispatch,
    getStageById,
    getProviderById,
    getUserById
  };
};