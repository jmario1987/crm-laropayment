import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef, useMemo, useState } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage, USER_ROLES, Tag } from '../types'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, writeBatch, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

type Action = | { type: 'SET_STATE'; payload: State } | { type: 'ADD_LEAD'; payload: Lead } | { type: 'UPDATE_LEAD'; payload: Lead } | { type: 'DELETE_LEAD'; payload: string };

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
        default: return state;
    }
};

interface LeadContextType {
  state: State;
  dispatch: Dispatch<Action>;
  reloadData: () => void;
}

export const LeadContext = createContext<LeadContextType>({
  state: initialState,
  dispatch: () => null,
  reloadData: () => {}, 
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const { user, loading: authLoading } = useAuth();
  
  const [version, setVersion] = useState(0);
  const reloadData = () => setVersion(v => v + 1);

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
    <LeadContext.Provider value={{ state, dispatch, reloadData }}>
      {children}
    </LeadContext.Provider>
  );
};