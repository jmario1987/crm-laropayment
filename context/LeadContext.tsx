import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useState, useMemo } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage, USER_ROLES, Tag } from '../types'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

type Action = 
  | { type: 'SET_STATE'; payload: Partial<State> } 
  | { type: 'ADD_LEAD'; payload: Lead } 
  | { type: 'UPDATE_LEAD'; payload: Lead } 
  | { type: 'DELETE_LEAD'; payload: string } 
  | { type: 'ADD_BULK_LEADS'; payload: Lead[] } 
  | { type: 'ADD_USER'; payload: User } 
  | { type: 'UPDATE_USER'; payload: User } 
  | { type: 'ADD_ROLE'; payload: string } 
  | { type: 'DELETE_ROLE'; payload: string } 
  | { type: 'ADD_PRODUCT'; payload: Product } 
  | { type: 'UPDATE_PRODUCT'; payload: Product } 
  | { type: 'DELETE_PRODUCT'; payload: string } 
  | { type: 'ADD_PROVIDER'; payload: Provider } 
  | { type: 'UPDATE_PROVIDER'; payload: Provider } 
  | { type: 'DELETE_PROVIDER'; payload: string } 
  | { type: 'ADD_STAGE'; payload: Stage } 
  | { type: 'UPDATE_STAGE'; payload: Stage } 
  | { type: 'DELETE_STAGE'; payload: string } 
  | { type: 'UPDATE_STAGES_ORDER'; payload: Stage[] };

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
  roles: Object.values(USER_ROLES), 
  products: [], 
  providers: [], 
  stages: [],
  tags: [] 
};

const leadReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_STATE': return { ...state, ...action.payload };
        case 'ADD_LEAD': return { ...state, leads: [action.payload, ...state.leads] };
        case 'UPDATE_LEAD': return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) };
        case 'DELETE_LEAD': return { ...state, leads: state.leads.filter(l => l.id !== action.payload) };
        case 'ADD_USER': return { ...state, users: [...state.users, action.payload] };
        case 'UPDATE_USER': return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
        case 'ADD_PRODUCT': return { ...state, products: [...state.products, action.payload] };
        case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
        case 'ADD_PROVIDER': return { ...state, providers: [...state.providers, action.payload] };
        case 'UPDATE_PROVIDER': return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PROVIDER': return { ...state, providers: state.providers.filter(p => p.id !== action.payload) };
        case 'ADD_STAGE': return { ...state, stages: [...state.stages, action.payload] };
        case 'UPDATE_STAGE': return { ...state, stages: state.stages.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_STAGE': return { ...state, stages: state.stages.filter(s => s.id !== action.payload) };
        case 'UPDATE_STAGES_ORDER': return { ...state, stages: action.payload };
        default: return state;
    }
};

interface LeadContextType {
  state: State;
  dispatch: Dispatch<Action>;
  reloadData: () => void;
  allLeads: Lead[];
  stagnantLeads: Lead[];
  sellerNotifications: Lead[];
  managerResponseNotifications: Lead[];
  sellers: User[];
  tags: Tag[];
}

export const LeadContext = createContext<LeadContextType>({
  state: initialState,
  dispatch: () => null,
  reloadData: () => {}, 
  allLeads: [],
  stagnantLeads: [],
  sellerNotifications: [],
  managerResponseNotifications: [],
  sellers: [],
  tags: [],
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  // --- CAMBIO 1: Este es el "reloj despertador" que se actualiza cada minuto ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 60000); // 60000ms = 1 minuto
    return () => clearInterval(timerId);
  }, []);
  
  const [version, setVersion] = useState(0);
  const reloadData = () => setVersion(v => v + 1);

  useEffect(() => {
    const initializeAndLoadData = async () => {
      if (authLoading || !user) return;
      try {
        const collectionsToFetch = {
          stages: collection(db, "stages"),
          products: collection(db, "products"),
          providers: collection(db, "providers"),
          tags: collection(db, "tags"),
        };
        
        const [stagesSnap, productsSnap, providersSnap, tagsSnap] = await Promise.all(
          Object.values(collectionsToFetch).map(getDocs)
        );

        const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
        const leadsQuery = isManager 
          ? collection(db, "leads") 
          : query(collection(db, "leads"), where("ownerId", "==", user.id));
        const leadsSnapshot = await getDocs(leadsQuery);
        
        let usersData: User[] = [];
        if (isManager) {
          const usersSnapshot = await getDocs(collection(db, "users"));
          usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as User);
        } else if(user) {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            usersData = [({ ...userDoc.data(), id: userDoc.id }) as User];
          }
        }
        
        dispatch({ type: 'SET_STATE', payload: {
            leads: leadsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Lead),
            stages: stagesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Stage),
            products: productsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Product),
            providers: providersSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Provider),
            tags: tagsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Tag),
            users: usersData,
        }});
      } catch (error) {
        console.error("Error al inicializar los datos: ", error);
      }
    };
    initializeAndLoadData();
  }, [user, authLoading, version]);

  const contextValue = useMemo(() => {
    const sellers = state.users.filter(u => u.role === USER_ROLES.Vendedor);
    
    const stagnantLeads = state.leads.filter(lead => {
      const stage = state.stages.find(s => s.id === lead.status);
      if (!stage || stage.type !== 'open' || !lead.lastUpdate) return false;
      const daysDifference = Math.floor((new Date().getTime() - new Date(lead.lastUpdate).getTime()) / (1000 * 3600 * 24));
      return daysDifference >= 8;
    });

    const sellerNotifications = user && user.role === USER_ROLES.Vendedor 
      ? state.leads.filter(lead => lead.notificationForSeller && lead.ownerId === user.id) 
      : [];
    
    const managerResponseNotifications = user && (user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor)
      ? state.leads.filter(lead => lead.sellerHasViewedNotification && lead.notificationForManagerId === user.id)
      : [];

    return { 
      state, 
      dispatch, 
      reloadData, 
      allLeads: state.leads, 
      stagnantLeads, 
      sellerNotifications, 
      managerResponseNotifications,
      sellers,
      tags: state.tags
    };
  // --- CAMBIO 2: Añadimos 'currentTime' aquí para que el cálculo se re-ejecute cada minuto ---
  }, [state, user, currentTime]);

  return (
    <LeadContext.Provider value={contextValue}>
      {children}
    </LeadContext.Provider>
  );
};