import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAcceso = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('auth_token');
      const storedToken = localStorage.getItem('app_auth_token');
      
      const uid = urlToken || storedToken;

      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        // Verificar usuario en Firestore
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Filtramos solo los roles permitidos para este equipo
          const rolesPermitidos = ['Administrador', 'Recepcionista'];
          
          if (rolesPermitidos.includes(userData.role)) {
            setUser({ uid, ...userData });
            localStorage.setItem('app_auth_token', uid);
            
            // Limpiamos la URL para estética
            if (urlToken) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            console.error('Acceso denegado: Rol no autorizado para esta aplicación.');
            localStorage.removeItem('app_auth_token');
          }
        } else {
          console.error('Usuario no encontrado en base de datos.');
          localStorage.removeItem('app_auth_token');
        }
      } catch (error) {
        console.error('Error verificando usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    verificarAcceso();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};