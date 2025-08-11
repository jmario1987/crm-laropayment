import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig'; // Importamos 'auth'
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth'; // Importamos funciones de Auth

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Firebase nos dirá quién está logueado
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Si hay un usuario de Firebase, buscamos su perfil en nuestra base de datos
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
        if (!userDocSnap.empty) {
            const userData = userDocSnap.docs[0].data() as User;
            setUser(userData);
        } else {
            // Esto no debería pasar si los datos están sincronizados
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpiamos el listener al desmontar
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      // Usamos la función oficial de Firebase para iniciar sesión
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error en el inicio de sesión de Firebase:", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth); // Usamos la función oficial para cerrar sesión
        navigate('/login');
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};