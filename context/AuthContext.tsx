import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
        if (!userDocSnap.empty) {
            const userData = userDocSnap.docs[0].data() as User;
            setUser(userData);
        } else {
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true); // Ponemos en estado de carga
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Inmediatamente después del login, buscamos el perfil del usuario
      const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
      if (!userDocSnap.empty) {
          const userData = userDocSnap.docs[0].data() as User;
          setUser(userData); // Actualizamos el estado del usuario ANTES de redirigir
          return true;
      }
      // Si no se encuentra el perfil, el login falla
      await signOut(auth);
      return false;
    } catch (error) {
      console.error("Error en el inicio de sesión de Firebase:", error);
      return false;
    } finally {
        setLoading(false); // Quitamos el estado de carga
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setUser(null); // Limpiamos el usuario localmente
        navigate('/login');
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
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