
import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage } from '../types';
import { initialLeads, initialUsers, initialRoles, initialProducts, initialProviders, initialStages } from '../data/mockData';

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

const initialState: State = {
  leads: [],
  users: [],
  roles: [],
  products: [],
  providers: [],
  stages: [],
};

const leadReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_STATE':
        return {
            ...initialState,
            ...action.payload,
        };
    case 'ADD_LEAD':
      return { ...state, leads: [action.payload, ...state.leads] };
    case 'ADD_BULK_LEADS':
      return { ...state, leads: [...action.payload, ...state.leads] };
    case 'UPDATE_LEAD': {
      const updatedLeadPayload = action.payload;
      const leadToUpdate = state.leads.find(l => l.id === updatedLeadPayload.id);

      if (!leadToUpdate) return state;

      const finalPayload = { ...updatedLeadPayload };

      if (leadToUpdate.status !== finalPayload.status) {
        const newHistoryEntry = {
          status: finalPayload.status,
          date: new Date().toISOString()
        };
        const currentHistory = leadToUpdate.statusHistory || [{ status: leadToUpdate.status, date: leadToUpdate.createdAt }];
        finalPayload.statusHistory = [...currentHistory, newHistoryEntry];
      } else {
        finalPayload.statusHistory = leadToUpdate.statusHistory || [{ status: leadToUpdate.status, date: leadToUpdate.createdAt }];
      }

      return {
        ...state,
        leads: state.leads.map((lead) =>
          lead.id === finalPayload.id ? finalPayload : lead
        ),
      };
    }
    case 'DELETE_LEAD':
      return {
        ...state,
        leads: state.leads.filter((lead) => lead.id !== action.payload),
      };
    case 'ADD_USER':
        return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
        return {
          ...state,
          users: state.users.map((user) =>
            user.id === action.payload.id ? { ...user, ...action.payload } : user
          ),
        };
    case 'ADD_ROLE':
        if (state.roles.includes(action.payload)) return state;
        return { ...state, roles: [...state.roles, action.payload] };
    case 'DELETE_ROLE':
        return { ...state, roles: state.roles.filter(role => role !== action.payload) };
    case 'ADD_PRODUCT':
        return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
        return {
            ...state,
            products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
        };
    case 'DELETE_PRODUCT':
        return {
            ...state,
            products: state.products.filter(p => p.id !== action.payload),
        };
    case 'ADD_PROVIDER':
        return { ...state, providers: [...state.providers, action.payload] };
    case 'UPDATE_PROVIDER':
        return {
            ...state,
            providers: state.providers.map(p => p.id === action.payload.id ? action.payload : p),
        };
    case 'DELETE_PROVIDER':
        return {
            ...state,
            providers: state.providers.filter(p => p.id !== action.payload),
        };
    case 'ADD_STAGE':
        return { ...state, stages: [...state.stages, action.payload] };
    case 'UPDATE_STAGE':
        return {
            ...state,
            stages: state.stages.map(s => s.id === action.payload.id ? action.payload : s),
        };
    case 'DELETE_STAGE':
        return {
            ...state,
            stages: state.stages.filter(s => s.id !== action.payload),
        };
    case 'UPDATE_STAGES_ORDER':
        return { ...state, stages: action.payload };
    default:
      return state;
  }
};


export const LeadContext = createContext<{ state: State; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const isInitialized = useRef(false);

  useEffect(() => {
    const initialData = {
        leads: initialLeads,
        users: initialUsers,
        roles: initialRoles,
        products: initialProducts,
        providers: initialProviders,
        stages: initialStages,
    };

    let finalState: State;

    try {
        const localDataString = localStorage.getItem('crm-data');
        if (localDataString) {
            const storedData = JSON.parse(localDataString);
            finalState = {
                leads: storedData.leads || initialData.leads,
                users: storedData.users || initialData.users,
                roles: storedData.roles || initialData.roles,
                products: storedData.products || initialData.products,
                providers: storedData.providers || initialData.providers,
                stages: storedData.stages || initialData.stages,
            };
        } else {
            finalState = initialData;
        }
    } catch (error) {
        console.error("Error al procesar datos de localStorage. Se restaurarán los valores iniciales.", error);
        finalState = initialData;
    }
    
    dispatch({ type: 'SET_STATE', payload: finalState });
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
        try {
            const stateToSave = JSON.stringify(state);
            localStorage.setItem('crm-data', stateToSave);
        } catch (error) {
            console.error("No se pudo guardar el estado en localStorage", error);
        }
    }
  }, [state]);


  return (
    <LeadContext.Provider value={{ state, dispatch }}>
      {children}
    </LeadContext.Provider>
  );
};