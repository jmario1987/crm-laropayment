import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { initialUsers } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../hooks/useLeads';

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
    // En una aplicación real, esto sería una llamada a la API.
    // Aquí simulamos la búsqueda en nuestros datos de ejemplo.
    const data = localStorage.getItem('crm-data');
    const users = data ? JSON.parse(data).users : initialUsers;
    const foundUser = users.find((u: User) => u.email === email && u.password === password);

    if (foundUser) {
      const userWithLoginDate = { ...foundUser, lastLogin: new Date().toISOString() };
      
      // Actualizamos el usuario en el estado global para persistir la fecha de login
      dispatch({ type: 'UPDATE_USER', payload: userWithLoginDate });
      
      // No almacenar la contraseña en el estado o en localStorage
      const { password: foundUserPassword, ...userToStore } = userWithLoginDate;
      setUser(userToStore);
      localStorage.setItem('crm-user', JSON.stringify(userToStore));
      return true;
    }
    return false;
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