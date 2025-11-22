import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AuthContext = createContext();

const SESSION_KEY = 'lavanderia_cobre_session';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(true);

  const loginWithToken = async (uid) => {
    if (!uid) { setLoading(false); return false; }
    setLoading(true);

    try {
      const userDocRef = doc(db, 'usuarios', uid);
      // Intentamos obtener el documento
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Validar activo
        if (userData.activo !== true) {
          console.error('Usuario inactivo');
          setLoading(false);
          return false;
        }

        // Validar Rol
        const rol = (userData.rol || '').toLowerCase();
        const rolesPermitidos = ['administrador', 'admin', 'recepcionista'];

        if (rolesPermitidos.includes(rol)) {
          // Mapeo de Roles
          const appRole = (rol === 'administrador' || rol === 'admin') ? 'Administrador' : 'Recepcionista';

          const formattedUser = {
            uid,
            name: userData.nombre || userData.displayName || 'Usuario',
            email: userData.email,
            role: appRole
          };

          // Actualizar acceso (sin await para no bloquear)
          updateDoc(userDocRef, { ultimo_acceso: serverTimestamp() }).catch(() => {});

          setUser(formattedUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(formattedUser));
          setLoading(false);
          return true;
        }
      }
    } catch (error) {
      console.error('Error en AuthContext:', error);
    }

    // Si llegamos aquí es que algo falló
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "https://lavanderia-cobre-landingpage.vercel.app/intranet/dashboard";
  };

  useEffect(() => {
    // Validación rápida al recargar si hay sesión guardada
    const init = async () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Opcional: revalidar token en segundo plano
        // await loginWithToken(parsed.uid); 
        if(parsed) setUser(parsed);
      }
      setLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};