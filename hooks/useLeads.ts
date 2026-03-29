import { useContext, useMemo } from 'react';
import { LeadContext } from '../context/LeadContext';
import { USER_ROLES, User } from '../types'; // Agregamos la importación de 'User'

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads debe ser usado dentro de un LeadProvider');
  }

  const { state, dispatch, reloadData, stagnantLeads, sellerNotifications, managerResponseNotifications } = context;

  const wonStageIds = useMemo(() => state.stages.filter(s => s.type === 'won').map(s => s.id), [state.stages]);
  const lostStageIds = useMemo(() => state.stages.filter(s => s.type === 'lost').map(s => s.id), [state.stages]);

  const sellers = useMemo(() => state.users.filter(u => u.role === USER_ROLES.Vendedor), [state.users]);
  const getStageById = (id: string) => state.stages.find(s => s.id === id);
  const getProviderById = (id: string) => state.providers.find(p => p.id === id);
  const getUserById = (id: string) => state.users.find(u => u.id === id);

  // --- NUEVA FUNCIÓN: EL GUARDIÁN DE VISIBILIDAD ---
  const getVisibleLeads = (currentUser: User | null) => {
      if (!currentUser) return [];
      
      const isManager = currentUser.role === USER_ROLES.Admin || currentUser.role === USER_ROLES.Supervisor;
      if (isManager) return state.leads; // Si es jefe, ve el 100% de la base de datos

      // LA NUEVA REGLA DE ORO PARA VENDEDORES:
      // Lo veo si soy el responsable actual (ownerId) O si yo fui quien lo trajo (creatorId)
      return state.leads.filter(lead => 
          lead.ownerId === currentUser.id || lead.creatorId === currentUser.id
      );
  };

  return {
    ...state,
    allLeads: state.leads,
    sellers,
    stagnantLeads,
    sellerNotifications,
    managerResponseNotifications,
    wonStageIds,
    lostStageIds,
    dispatch,
    reloadData,
    getStageById,
    getProviderById,
    getUserById,
    getVisibleLeads, // <-- Exportamos nuestra nueva herramienta
  };
};