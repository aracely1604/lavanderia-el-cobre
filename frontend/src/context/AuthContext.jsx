import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // Ajusta la ruta si es necesario

const AuthContext = createContext();

const SESSION_KEY = 'lavanderia_cobre_session';

export const AuthProvider = ({ children }) => {
  // Inicializar leyendo del localStorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const saveUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  };

  const clearUserSession = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // --- NUEVO: Función para entrar como Invitado ---
  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest-user-eq2',
      name: 'Usuario de Prueba (Eq. 2)',
      email: 'prueba@elcobre.cl',
      role: 'Administrador' // Rol alto para probar todo
    };
    saveUserSession(guestUser);
    setLoading(false);
  };
  // ------------------------------------------------

  const loginWithToken = async (uid) => {
    if (!uid) {
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.activo === true) {
           const rol = (userData.rol || '').toLowerCase();
           // Mapeo simple
           const appRole = (rol === 'administrador' || rol === 'admin') 
             ? 'Administrador' 
             : 'Recepcionista';

           const formattedUser = {
             uid,
             name: userData.nombre || userData.displayName || 'Usuario',
             email: userData.email || userData.correo,
             role: appRole
           };

           updateDoc(userDocRef, { ultimo_acceso: serverTimestamp() }).catch(console.error);
           saveUserSession(formattedUser);
           setLoading(false);
           return true;
        }
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    }
    setLoading(false);
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
         if (!user || user.uid !== firebaseUser.uid) {
            // Lógica opcional para recargar datos si es necesario
         }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    clearUserSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, loginAsGuest, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}