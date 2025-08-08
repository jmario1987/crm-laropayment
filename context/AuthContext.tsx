import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { initialLeads, initialUsers, initialStages, initialProducts, initialProviders } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: Omit<User, 'password'>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
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
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            const allUsersSnapshot = await getDocs(usersRef);
            if (allUsersSnapshot.empty) {
                console.log("Base de datos vacía. Subiendo datos iniciales...");
                const batch = writeBatch(db);
                initialUsers.forEach(u => batch.set(doc(db, "users", u.id), u));
                initialLeads.forEach(l => batch.set(doc(db, "leads", l.id), l));
                initialStages.forEach(s => batch.set(doc(db, "stages", s.id), s));
                initialProducts.forEach(p => batch.set(doc(db, "products", p.id), p));
                initialProviders.forEach(p => batch.set(doc(db, "providers", p.id), p));
                await batch.commit();
                alert("La base de datos ha sido inicializada. Por favor, intente iniciar sesión de nuevo.");
                return false;
            }
            return false;
        }

        const foundUser = querySnapshot.docs[0].data() as User;
        if (foundUser.password === password) {
          const userWithLoginDate = { ...foundUser, lastLogin: new Date().toISOString() };
          await setDoc(doc(db, 'users', userWithLoginDate.id), userWithLoginDate, { merge: true });
          const { password: _, ...userToStore } = userWithLoginDate;
          setUser(userToStore);
          localStorage.setItem('crm-user', JSON.stringify(userToStore));
          return true;
        }
    } catch (error) {
        console.error("Error en el login:", error);
        alert("Ocurrió un error al intentar iniciar sesión. Verifique las reglas de seguridad de Firebase.");
        return false;
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