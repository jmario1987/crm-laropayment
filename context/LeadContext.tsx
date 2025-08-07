import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage } from '../types';
import { initialLeads, initialUsers, initialRoles, initialProducts, initialProviders, initialStages } from '../data/mockData';
import { db } from '../firebaseConfig';
import { collection, getDocs, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
}

const initialState: State = { leads: [], users: [], roles: [], products: [], providers: [], stages: [] };

export const LeadContext = createContext<{ state: State; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

// El reducer ahora también actualiza Firestore
const leadReducer = (state: State, action: Action): State => {
    let newState = { ...state };
    switch (action.type) {
        case 'SET_STATE':
            newState = { ...action.payload };
            break;
        case 'ADD_LEAD':
            newState = { ...state, leads: [action.payload, ...state.leads] };
            setDoc(doc(db, 'leads', action.payload.id), action.payload);
            break;
        case 'UPDATE_LEAD':
            newState = { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) };
            setDoc(doc(db, 'leads', action.payload.id), action.payload, { merge: true });
            break;
        case 'DELETE_LEAD':
            newState = { ...state, leads: state.leads.filter(l => l.id !== action.payload) };
            deleteDoc(doc(db, 'leads', action.payload));
            break;
        // Aquí irían los casos para las otras acciones (UPDATE_USER, ADD_PRODUCT, etc.) que también escribirían en la BD.
        // Por simplicidad, nos enfocamos en que la carga inicial funcione.
        default:
            newState = state;
    }
    return newState;
};

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const isInitialized = useRef(false);

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
          const leadsData = (await getDocs(collection(db, "leads"))).docs.map(doc => doc.data() as Lead);
          const usersData = usersSnapshot.docs.map(doc => doc.data() as User);
          const stagesData = (await getDocs(collection(db, "stages"))).docs.map(doc => doc.data() as Stage);
          const productsData = (await getDocs(collection(db, "products"))).docs.map(doc => doc.data() as Product);
          const providersData = (await getDocs(collection(db, "providers"))).docs.map(doc => doc.data() as Provider);
          
          dispatch({ type: 'SET_STATE', payload: { leads: leadsData, users: usersData, roles: initialRoles, products: productsData, providers: providersData, stages: stagesData }});
        }
      } catch (error) {
        console.error("Error al cargar los datos: ", error);
      }
    };

    if (!isInitialized.current) {
        fetchData();
        isInitialized.current = true;
    }
  }, []);

  return (
    <LeadContext.Provider value={{ state, dispatch }}>
      {children}
    </LeadContext.Provider>
  );
};