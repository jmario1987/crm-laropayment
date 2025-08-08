import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage } from '../types';
import { initialLeads, initialUsers, initialRoles, initialProducts, initialProviders, initialStages } from '../data/mockData';
import { db } from '../firebaseConfig';
import { collection, getDocs, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

// Lista completa de acciones
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

// Definición del estado
interface State {
  leads: Lead[];
  users: User[];
  roles: UserRole[];
  products: Product[];
  providers: Provider[];
  stages: Stage[];
}

const initialState: State = { leads: [], users: [], roles: [], products: [], providers: [], stages: [] };

export const LeadContext = createContext<{ state: State; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

// Reducer COMPLETO con guardado en Firestore para CADA ACCIÓN
const leadReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_STATE':
        return { ...action.payload };
    case 'ADD_LEAD':
      setDoc(doc(db, 'leads', action.payload.id), action.payload);
      return { ...state, leads: [action.payload, ...state.leads] };
    case 'ADD_BULK_LEADS': {
      const batch = writeBatch(db);
      action.payload.forEach(lead => batch.set(doc(db, "leads", lead.id), lead));
      batch.commit();
      return { ...state, leads: [...action.payload, ...state.leads] };
    }
    case 'UPDATE_LEAD':
      setDoc(doc(db, 'leads', action.payload.id), action.payload, { merge: true });
      return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LEAD':
      deleteDoc(doc(db, 'leads', action.payload));
      return { ...state, leads: state.leads.filter(l => l.id !== action.payload) };
    case 'ADD_USER':
      setDoc(doc(db, 'users', action.payload.id), action.payload);
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      setDoc(doc(db, 'users', action.payload.id), action.payload, { merge: true });
      return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
    case 'ADD_PRODUCT':
      setDoc(doc(db, 'products', action.payload.id), action.payload);
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      setDoc(doc(db, 'products', action.payload.id), action.payload, { merge: true });
      return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT':
      deleteDoc(doc(db, 'products', action.payload));
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'ADD_PROVIDER':
      setDoc(doc(db, 'providers', action.payload.id), action.payload);
      return { ...state, providers: [...state.providers, action.payload] };
    case 'UPDATE_PROVIDER':
      setDoc(doc(db, 'providers', action.payload.id), action.payload, { merge: true });
      return { ...state, providers: state.providers.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PROVIDER':
      deleteDoc(doc(db, 'providers', action.payload));
      return { ...state, providers: state.providers.filter(p => p.id !== action.payload) };
    case 'ADD_STAGE':
      setDoc(doc(db, 'stages', action.payload.id), action.payload);
      return { ...state, stages: [...state.stages, action.payload] };
    case 'UPDATE_STAGE':
      setDoc(doc(db, 'stages', action.payload.id), action.payload, { merge: true });
      return { ...state, stages: state.stages.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STAGE':
      deleteDoc(doc(db, 'stages', action.payload));
      return { ...state, stages: state.stages.filter(s => s.id !== action.payload) };
    case 'UPDATE_STAGES_ORDER': {
      const batch = writeBatch(db);
      action.payload.forEach(stage => batch.set(doc(db, "stages", stage.id), stage));
      batch.commit();
      return { ...state, stages: action.payload };
    }
    default:
      return state;
  }
};

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const isInitialized = useRef(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        if (usersSnapshot.empty) {
          console.log("Base de datos vacía. Subiendo datos iniciales...");
          const batch = writeBatch(db);
          initialUsers.forEach(user => batch.set(doc(db, "users", user.id), user));
          initialLeads.forEach(lead => batch.set(doc(db, "leads", lead.id), lead));
          initialStages.forEach(stage => batch.set(doc(db, "stages", stage.id), stage));
          initialProducts.forEach(product => batch.set(doc(db, "products", product.id), product));
          initialProviders.forEach(provider => batch.set(doc(db, "providers", provider.id), provider));
          await batch.commit();
          dispatch({ type: 'SET_STATE', payload: { leads: initialLeads, users: initialUsers, roles: initialRoles, products: initialProducts, providers: initialProviders, stages: initialStages }});
        } else {
          console.log("Cargando datos desde Firestore...");
          const allData = await Promise.all([
            getDocs(collection(db, "leads")),
            getDocs(collection(db, "users")),
            getDocs(collection(db, "stages")),
            getDocs(collection(db, "products")),
            getDocs(collection(db, "providers"))
          ]);
          dispatch({ type: 'SET_STATE', payload: { 
            leads: allData[0].docs.map(doc => doc.data() as Lead), 
            users: allData[1].docs.map(doc => doc.data() as User), 
            stages: allData[2].docs.map(doc => doc.data() as Stage),
            products: allData[3].docs.map(doc => doc.data() as Product), 
            providers: allData[4].docs.map(doc => doc.data() as Provider),
            roles: initialRoles 
          }});
        }
      } catch (error) {
        console.error("Error al cargar los datos: ", error);
      }
    };

    if (!authLoading && user && !isInitialized.current) {
        fetchData();
        isInitialized.current = true;
    }
  }, [user, authLoading]);

  return (
    <LeadContext.Provider value={{ state, dispatch }}>
      {children}
    </LeadContext.Provider>
  );
};