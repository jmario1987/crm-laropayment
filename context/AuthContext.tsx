import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // La nueva señal
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: Omit<User, 'password'>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true, // Empieza como 'cargando'
  login: async () => false,
  logout: () => {},
  updateCurrentUser: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('crm-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error al cargar usuario", error);
      setUser(null);
    } finally {
      setLoading(false); // Termina de cargar
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return false;

    const foundUser = querySnapshot.docs[0].data() as User;
    if (foundUser.password === password) {
      const userWithLoginDate = { ...foundUser, lastLogin: new Date().toISOString() };

      // Actualiza la fecha de login en Firestore
      await setDoc(doc(db, 'users', userWithLoginDate.id), userWithLoginDate, { merge: true });

      const { password: _, ...userToStore } = userWithLoginDate;
      setUser(userToStore);
      localStorage.setItem('crm-user', JSON.stringify(userToStore));
      return true;
    }
    return false;
  }, [navigate]);

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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};