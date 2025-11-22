import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// Asumo que tienes un archivo de configuración de Firebase en '../firebaseConfig'
import { db } from '../firebaseConfig'; 

const AuthContext = createContext();

// Clave para guardar sesión en el navegador
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

  // Guardar sesión en localStorage
  const saveUserSession = (userData) => {
    setUser(userData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  };

  // Función principal para validar el token (UID) contra Firestore
  const loginWithToken = async (uid) => {
    if (!uid) {
      setLoading(false);
      return false;
    }

    setLoading(true);

    try {
      // Usamos 'usuarios' que es la colección estándar de tu Intranet
      const userDocRef = doc(db, 'usuarios', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // 1. VALIDACIÓN: ¿Está activo?
        if (userData.activo !== true) {
          console.error('Acceso denegado: Usuario inactivo');
          setLoading(false);
          return false;
        }

        // 2. Mapeo de Roles
        const rol = (userData.rol || '').toLowerCase();
        const rolesPermitidos = ['administrador', 'admin', 'recepcionista'];

        if (rolesPermitidos.includes(rol)) {
          // Mapeo a los roles de la App de Comandas: Administrador o Recepcionista
          const appRole = (rol === 'administrador' || rol === 'admin') 
            ? 'Administrador' 
            : 'Recepcionista';

          const formattedUser = {
            uid,
            name: userData.nombre || userData.displayName || 'Usuario',
            email: userData.email || userData.correo,
            role: appRole
          };

          // Actualizar último acceso en segundo plano
          updateDoc(userDocRef, { ultimo_acceso: serverTimestamp() }).catch(console.error);

          saveUserSession(formattedUser);
          setLoading(false);
          return true;
        } else {
          console.error('Rol no autorizado:', rol);
        }
      } else {
        console.error('Usuario no encontrado en base de datos');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    }

    setLoading(false);
    return false;
  };

  // Efecto inicial: Si recarga la página y hay token guardado, re-validamos
  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored && !user) {
        const parsed = JSON.parse(stored);
        await loginWithToken(parsed.uid);
      } else {
        setLoading(false);
      }
    };
    initAuth();
  // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Se declara y exporta UNA SOLA VEZ
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}