import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef, useMemo, useState } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage, USER_ROLES, Tag } from '../types'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, writeBatch, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

type Action = 
  | { type: 'SET_STATE'; payload: State } 
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
  roles: [], 
  products: [], 
  providers: [], 
  stages: [],
  tags: [] 
};

const leadReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_STATE': return action.payload;
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
  stagnantLeads: Lead[];
  sellerNotifications: Lead[];
  managerResponseNotifications: Lead[];
}

export const LeadContext = createContext<LeadContextType>({
  state: initialState,
  dispatch: () => null,
  reloadData: () => {}, 
  stagnantLeads: [],
  sellerNotifications: [],
  managerResponseNotifications: [],
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const { user, loading: authLoading } = useAuth();
  
  const [version, setVersion] = useState(0);
  const reloadData = () => setVersion(v => v + 1);

  const stagnantLeads = useMemo(() => {
    return state.leads.filter(lead => {
      const stage = state.stages.find(s => s.id === lead.status);
      if (!stage || stage.type !== 'open' || !lead.lastUpdate) return false;
      const daysDifference = Math.floor((new Date().getTime() - new Date(lead.lastUpdate).getTime()) / (1000 * 3600 * 24));
      return daysDifference >= 8;
    });
  }, [state.leads, state.stages]);

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
      if (authLoading || !user) return;
      try {
        const isManager = user.role === USER_ROLES.Admin || user.role === USER_ROLES.Supervisor;
        
        let usersData: User[] = [];
        if (isManager) {
          const usersSnapshot = await getDocs(collection(db, "users"));
          usersData = usersSnapshot.docs.map(doc => doc.data() as User);
        } else {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) { usersData = [userDoc.data() as User]; }
        }

        const leadsQuery = isManager ? query(collection(db, "leads")) : query(collection(db, "leads"), where("ownerId", "==", user.id));
        
        const [leadsSnapshot, stagesSnapshot, productsSnapshot, providersSnapshot, tagsSnapshot] = await Promise.all([
            getDocs(leadsQuery),
            getDocs(collection(db, "stages")),
            getDocs(collection(db, "products")),
            getDocs(collection(db, "providers")),
            getDocs(collection(db, "tags")),
        ]);

        dispatch({ type: 'SET_STATE', payload: {
            leads: leadsSnapshot.docs.map(doc => doc.data() as Lead),
            stages: stagesSnapshot.docs.map(doc => doc.data() as Stage),
            products: productsSnapshot.docs.map(doc => doc.data() as Product),
            providers: providersSnapshot.docs.map(doc => doc.data() as Provider),
            tags: tagsSnapshot.docs.map(doc => doc.data() as Tag),
            users: usersData,
            roles: [USER_ROLES.Admin, USER_ROLES.Supervisor, USER_ROLES.Vendedor]
        }});
      } catch (error) {
        console.error("Error al inicializar los datos: ", error);
      }
    };
    initializeAndLoadData();
  }, [user, authLoading, version]);

  return (
    <LeadContext.Provider value={{ state, dispatch, reloadData, stagnantLeads, sellerNotifications, managerResponseNotifications }}>
      {children}
    </LeadContext.Provider>
  );
};