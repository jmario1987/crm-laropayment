import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useRef } from 'react';
import { Lead, User, UserRole, Product, Provider, Stage } from '../types';
import { initialLeads, initialUsers, initialRoles, initialProducts, initialProviders, initialStages } from '../data/mockData';
import { db } from '../firebaseConfig'; // 1. Importamos la conexión a la base de datos
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore'; // 2. Importamos funciones de Firestore

// Las acciones (Action) y el estado (State) se mantienen igual
type Action =
  | { type: 'SET_STATE'; payload: State }
  | { type: 'ADD_LEAD'; payload: Lead }
  | { type: 'UPDATE_LEAD'; payload: Lead }
  | { type: 'DELETE_LEAD'; payload: string }
  // ... (todas las demás acciones que ya teníamos) ...
  ;

interface State {
    leads: Lead[];
    users: User[];
    roles: UserRole[];
    products: Product[];
    providers: Provider[];
    stages: Stage[];
}
const initialState: State = { leads: [], users: [], roles: [], products: [], providers: [], stages: [] };

// El Reducer para manejar cambios en el estado se mantiene igual
const leadReducer = (state: State, action: Action): State => {
    // ... (todo el switch case que ya teníamos se queda igual) ...
};

export const LeadContext = createContext<{ state: State; dispatch: Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

export const LeadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(leadReducer, initialState);
  const isDataLoaded = useRef(false);

  useEffect(() => {
    // Esta función se ejecutará solo una vez al cargar la app
    const fetchData = async () => {
      try {
          // 3. Apuntamos a la colección de 'users' en Firestore
          const usersSnapshot = await getDocs(collection(db, "users"));

          // 4. Verificamos si la base de datos está vacía
          if (usersSnapshot.empty) {
            console.log("Base de datos vacía. Subiendo datos iniciales...");
            const batch = writeBatch(db);

            // Subimos todos los datos de prueba
            initialUsers.forEach(user => batch.set(doc(db, "users", user.id), user));
            initialLeads.forEach(lead => batch.set(doc(db, "leads", lead.id), lead));
            initialStages.forEach(stage => batch.set(doc(db, "stages", stage.id), stage));
            initialProducts.forEach(product => batch.set(doc(db, "products", product.id), product));
            initialProviders.forEach(provider => batch.set(doc(db, "providers", provider.id), provider));
            // La colección 'roles' se puede manejar de forma diferente si es necesario
            await batch.commit(); // Ejecutamos la subida de datos
            console.log("Datos iniciales subidos con éxito.");

            // Cargamos el estado con los datos recién subidos
            dispatch({ type: 'SET_STATE', payload: {
                leads: initialLeads,
                users: initialUsers,
                roles: initialRoles,
                products: initialProducts,
                providers: initialProviders,
                stages: initialStages
            }});

          } else {
            console.log("Cargando datos desde Firestore...");
            // 5. Si ya hay datos, los leemos de la base de datos
            const leadsData = (await getDocs(collection(db, "leads"))).docs.map(doc => doc.data() as Lead);
            const usersData = usersSnapshot.docs.map(doc => doc.data() as User);
            const stagesData = (await getDocs(collection(db, "stages"))).docs.map(doc => doc.data() as Stage);
            const productsData = (await getDocs(collection(db, "products"))).docs.map(doc => doc.data() as Product);
            const providersData = (await getDocs(collection(db, "providers"))).docs.map(doc => doc.data() as Provider);

            // Cargamos el estado con los datos de la nube
             dispatch({ type: 'SET_STATE', payload: {
                leads: leadsData,
                users: usersData,
                roles: initialRoles, // Los roles los mantenemos locales por simplicidad
                products: productsData,
                providers: providersData,
                stages: stagesData
            }});
          }
      } catch (error) {
        console.error("Error al cargar los datos: ", error);
      }
    };

    if(!isDataLoaded.current) {
        fetchData();
        isDataLoaded.current = true;
    }
  }, []);

  // El useEffect para guardar en localStorage ya no es necesario, lo eliminamos.

  return (
    <LeadContext.Provider value={{ state, dispatch }}>
      {children}
    </LeadContext.Provider>
  );
};