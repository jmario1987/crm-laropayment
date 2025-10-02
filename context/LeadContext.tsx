import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef, useMemo } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage, USER_ROLES, Tag } from '../types'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, writeBatch, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

type Action = | { type: 'SET_STATE'; payload: State } | { type: 'ADD_LEAD'; payload: Lead } | { type: 'UPDATE_LEAD'; payload: Lead } | { type: 'DELETE_LEAD'; payload: string } | { type: 'ADD_BULK_LEADS'; payload: Lead[] } | { type: 'ADD_USER'; payload: User } | { type: 'UPDATE_USER'; payload: User } | { type: 'ADD_ROLE'; payload: string } | { type: 'DELETE_ROLE'; payload: string } | { type: 'ADD_PRODUCT'; payload: Product } | { type: 'UPDATE_PRODUCT'; payload: Product } | { type: 'DELETE_PRODUCT'; payload: string } | { type: 'ADD_PROVIDER'; payload: Provider } | { type: 'UPDATE_PROVIDER'; payload: Provider } | { type: 'DELETE_PROVIDER'; payload: string } | { type: 'ADD_STAGE'; payload: Stage } | { type: 'UPDATE_STAGE'; payload: Stage } | { type: 'DELETE_STAGE'; payload: string } | { type: 'UPDATE_STAGES_ORDER'; payload: Stage[] };

interface State { 
  leads: Lead[]; 
  users: User[]; 
  roles: UserRole[]; 
  products: Product[]; 
  providers: Provider[]; 
  stages: Stage[]; 
  tags: Tag[]; 
}

const initialState: State = { 
  leads: [], 
  users: [], 
  roles: [], 
  products: [], 
  providers: [], 
  stages: [],
  tags: [] 
};

const leadReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_STATE': return { ...action.payload };
        case 'ADD_LEAD': setDoc(doc(db, 'leads', action.payload.id), action.payload); return { ...state, leads: [action.payload, ...state.leads] };
        case 'ADD_BULK_LEADS': { const batch = writeBatch(db); action.payload.forEach(lead => batch.set(doc(db, "leads", lead.id), lead)); batch.commit(); return { ...state, leads: [...action.payload, ...state.leads] }; }
        case 'UPDATE_LEAD': setDoc(doc(db, 'leads', action.payload.id), action.payload, { merge: true }); return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) };
        case 'DELETE_LEAD': deleteDoc(doc(db, 'leads', action.payload)); return { ...state, leads: state.leads.filter(l => l.id !== action.payload) };
        case 'ADD_USER': setDoc(doc(db, 'users', action.payload.id), action.payload); return { ...state, users: [...state.users, action.payload] };
        case 'UPDATE_USER': setDoc(doc(db, 'users', action.payload.id), action.payload, { merge: true }); return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
        case 'ADD_PRODUCT': setDoc(doc(db, 'products', action.payload.id), action.payload); return { ...state, products: [...state.products, action.payload] };
        case 'UPDATE_PRODUCT': setDoc(doc(db, 'products', action.payload.id), action.payload, { merge: true }); return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PRODUCT': deleteDoc(doc(db, 'products', action.payload)); return { ...state, products: state.products.filter(p => p.id !== action.payload) };
        case 'ADD_PROVIDER': setDoc(doc(db, 'providers', action.payload.id), action.payload); return { ...state, providers: [...state.providers, action.payload] };
        case 'UPDATE_PROVIDER': setDoc(doc(db, 'providers', action.payload.id), action.payload, { merge: true }); return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PROVIDER': deleteDoc(doc(db, 'providers', action.payload)); return { ...state, providers: state.providers.filter(p => p.id !== action.payload) };
        case 'ADD_STAGE': setDoc(doc(db, 'stages', action.payload.id), action.payload); return { ...state, stages: [...state.stages, action.payload] };
        case 'UPDATE_STAGE': setDoc(doc(db, 'stages', action.payload.id), action.payload, { merge: true }); return { ...state, stages: state.stages.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_STAGE': deleteDoc(doc(db, 'stages', action.payload)); return { ...state, stages: state.stages.filter(s => s.id !== action.payload) };
        case 'UPDATE_STAGES_ORDER': { const batch = writeBatch(db); action.payload.forEach(stage => batch.set(doc(db, "stages", stage.id), stage)); batch.commit(); return { ...state, stages: action.payload }; }
        default: return state;
    }
};

interface LeadContextType {
  state: State;
  dispatch: Dispatch<Action>;
  stagnantLeads: Lead[];
  sellerNotifications: Lead[];
  managerResponseNotifications: Lead[];
}

export const LeadContext = createContext<LeadContextType>({
  state: initialState,
  dispatch: () => null,
  stagnantLeads: [],
  sellerNotifications: [],
  managerResponseNotifications: [],
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const isDataLoaded = useRef(false);
  const { user, loading: authLoading } = useAuth();

  const stagnantLeads = useMemo(() => state.leads.filter(lead => {
      const stage = state.stages.find(s => s.id === lead.status);
      if (!stage || stage.type !== 'open') return false;
      const daysDifference = Math.floor((new Date().getTime() - new Date(lead.lastUpdate).getTime()) / (1000 * 3600 * 24));
      return daysDifference >= 8;
  }), [state.leads, state.stages]);

  const sellerNotifications = useMemo(() => {
    if (!user || user.role !== USER_ROLES.Vendedor) return [];
    return state.leads.filter(lead => lead.notificationForSeller && lead.ownerId === user.id);
  }, [state.leads, user]);

  const managerResponseNotifications = useMemo(() => {
    if (!user || (user.role !== USER_ROLES.Admin && user.role !== USER_ROLES.Supervisor)) return [];
    return state.leads.filter(lead => lead.sellerHasViewedNotification && lead.notificationForManagerId === user.id);
  }, [state.leads, user]);

  useEffect(() => {
    const initializeAndLoadData = async () => {
      if (authLoading || !user || isDataLoaded.current) return;
      isDataLoaded.current = true;
      try {
        console.log("Cargando datos (método final)... Rol:", user.role);
        const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
        
        // Cargar Usuarios
        let usersData: User[] = [];
        if (isManager) {
          const usersSnapshot = await getDocs(collection(db, "users"));
          usersData = usersSnapshot.docs.map(doc => doc.data() as User);
        } else {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            usersData = [userDoc.data() as User];
          }
        }

        // Cargar Prospectos
        const leadsQuery = isManager ? query(collection(db, "leads")) : query(collection(db, "leads"), where("ownerId", "==", user.id));
        const leadsSnapshot = await getDocs(leadsQuery);
        const leads = leadsSnapshot.docs.map(doc => doc.data() as Lead);

        // Cargar el resto de colecciones
        const stagesSnapshot = await getDocs(collection(db, "stages"));
        const stages = stagesSnapshot.docs.map(doc => doc.data() as Stage);

        const productsSnapshot = await getDocs(collection(db, "products"));
        const products = productsSnapshot.docs.map(doc => doc.data() as Product);

        const providersSnapshot = await getDocs(collection(db, "providers"));
        const providers = providersSnapshot.docs.map(doc => doc.data() as Provider);
        
        const tagsSnapshot = await getDocs(collection(db, "tags"));
        const tags = tagsSnapshot.docs.map(doc => doc.data() as Tag);

        // Guardar todo en el estado global
        dispatch({
          type: 'SET_STATE', payload: {
            leads,
            stages,
            products,
            providers,
            tags,
            users: usersData,
            roles: [USER_ROLES.Admin, USER_ROLES.Supervisor, USER_ROLES.Vendedor]
          }
        });
        console.log("¡Datos cargados exitosamente!");

      } catch (error) {
        console.error("Error definitivo al inicializar los datos: ", error);
      }
    };
    initializeAndLoadData();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user && !authLoading) {
      dispatch({ type: 'SET_STATE', payload: initialState });
      isDataLoaded.current = false;
    }
  }, [user, authLoading]);

  return (
    <LeadContext.Provider value={{ state, dispatch, stagnantLeads, sellerNotifications, managerResponseNotifications }}>
      {children}
    </LeadContext.Provider>
  );
};