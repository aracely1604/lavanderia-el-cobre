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
      // 1. Obtener el token (UID) de la URL o del LocalStorage
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('auth_token');
      const storedToken = localStorage.getItem('app_auth_token');
      
      const uid = urlToken || storedToken;

      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        // 2. Conexión a la Base de Datos de la INTRANET
        // IMPORTANTE: Buscamos en la colección 'usuarios' (no 'users')
        const userDocRef = doc(db, 'usuarios', uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // 3. Verificaciones de Seguridad
          
          // A. ¿El usuario está activo?
          if (!userData.activo) {
            console.error("Usuario inactivo en Intranet");
            localStorage.removeItem('app_auth_token');
            setLoading(false);
            return;
          }

          // B. ¿El rol es válido para ESTA aplicación?
          // La Intranet usa roles en minúsculas: 'administrador', 'recepcionista', 'operario'
          const rolIntranet = userData.rol || ''; 
          
          // Definimos roles permitidos (Admin y Recepcionista)
          const rolesPermitidos = ['administrador', 'recepcionista'];

          if (rolesPermitidos.includes(rolIntranet)) {
            // 4. Éxito: Normalizamos los datos para usarlos en la App
            const roleCapitalized = rolIntranet.charAt(0).toUpperCase() + rolIntranet.slice(1);
            
            setUser({ 
                uid, 
                name: userData.nombre, 
                role: roleCapitalized, // Lo guardamos como 'Administrador' o 'Recepcionista'
                email: userData.email,
                ...userData 
            });
            
            // Persistir sesión
            localStorage.setItem('app_auth_token', uid);
            
            // Limpiar URL para que no se vea el token
            if (urlToken) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else {
            console.error(`Acceso denegado. Rol "${rolIntranet}" no tiene permisos aquí.`);
            localStorage.removeItem('app_auth_token');
          }
        } else {
          console.error('UID no encontrado en la colección "usuarios".');
          localStorage.removeItem('app_auth_token');
        }
      } catch (error) {
        console.error('Error de conexión con Firebase:', error);
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