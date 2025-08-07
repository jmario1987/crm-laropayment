import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../hooks/useLeads';
import { db } from '../firebaseConfig'; // Importamos la conexión a Firestore
import { collection, query, where, getDocs } from 'firebase/firestore'; // Importamos funciones de consulta

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: Omit<User, 'password'>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  updateCurrentUser: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { dispatch } = useLeads();

  useEffect(() => {
    // Intenta cargar el usuario desde localStorage al iniciar la app
    try {
      const storedUser = localStorage.getItem('crm-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error al cargar usuario desde localStorage", error);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // LÓGICA CORREGIDA: Consultamos directamente a Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // No se encontró el usuario por email
        return false;
    }

    const foundUser = querySnapshot.docs[0].data() as User;

    if (foundUser.password === password) {
      const userWithLoginDate = { ...foundUser, lastLogin: new Date().toISOString() };
      
      // Actualizamos el usuario en el estado de LeadsContext para persistir la fecha de login en Firestore
      if (dispatch) {
        dispatch({ type: 'UPDATE_USER', payload: userWithLoginDate });
      }
      
      // No almacenar la contraseña en el estado local o en localStorage
      const { password: foundUserPassword, ...userToStore } = userWithLoginDate;
      setUser(userToStore);
      localStorage.setItem('crm-user', JSON.stringify(userToStore));
      return true;
    }

    return false; // La contraseña no coincide
  }, [dispatch]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('crm-user');
    navigate('/login');
  }, [navigate]);

  const updateCurrentUser = useCallback((updatedUser: Omit<User, 'password'>) => {
    setUser(updatedUser);
    localStorage.setItem('crm-user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};