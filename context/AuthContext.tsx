import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
// IMPORTANTE: Agregamos doc y updateDoc aquí
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateCurrentUser: (updatedUser: Omit<User, 'password'>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ success: false }),
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
            
            if (userData.isActive === false) {
                await signOut(auth);
                setUser(null);
            } else {
                setUser(userData);
            }
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

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocSnap = await getDocs(query(collection(db, "users"), where("id", "==", firebaseUser.uid)));
      
      if (!userDocSnap.empty) {
          const userDoc = userDocSnap.docs[0];
          const userData = userDoc.data() as User;
          
          if (userData.isActive === false) {
              await signOut(auth); 
              return { success: false, message: "Tu cuenta ha sido desactivada. Contacta al administrador." };
          }

          // --- AQUÍ ESTÁ LA MAGIA DEL ÚLTIMO LOGIN ---
          // 1. Capturamos la fecha y hora actual en formato ISO
          const currentLoginTime = new Date().toISOString();
          
          // 2. Apuntamos al documento de este usuario en Firestore
          const userRef = doc(db, "users", userDoc.id); 
          
          // 3. Guardamos silenciosamente la fecha en la base de datos
          await updateDoc(userRef, { lastLogin: currentLoginTime });

          // 4. Actualizamos nuestro estado local para que la app sepa la fecha de inmediato
          const updatedUserData = { ...userData, lastLogin: currentLoginTime };

          setUser(updatedUserData);
          return { success: true };
      }
      
      await signOut(auth);
      return { success: false, message: "No se encontró el perfil de usuario." };
    } catch (error: any) {
      console.error("Error en el inicio de sesión de Firebase:", error);
      
      let errorMessage = "Credenciales incorrectas.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          errorMessage = "Correo o contraseña incorrectos.";
      } else if (error.code === 'auth/too-many-requests') {
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
      }

      return { success: false, message: errorMessage };
    } finally {
        setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
        await signOut(auth);
        setUser(null);
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