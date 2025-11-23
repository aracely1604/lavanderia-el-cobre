import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importa tus páginas
import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';

// Componente de Protección Simplificado
const ProtectedRoute = ({ children }) => {
  const { user, loginWithToken, loginAsGuest } = useAuth();
  const location = useLocation();
  
  // Obtener token
  const params = new URLSearchParams(location.search);
  const authToken = params.get('auth_token');

  useEffect(() => {
    const initAuth = async () => {
      // CASO 1: Viene token en URL
      if (authToken && (!user || user.uid !== authToken)) {
        const success = await loginWithToken(authToken);
        if (success) {
          // Limpiar URL
          window.history.replaceState({}, document.title, location.pathname);
        } else {
          // Falló el token -> Entrar como invitado
          console.warn("Token inválido, entrando como invitado...");
          loginAsGuest();
        }
      } 
      // CASO 2: Sin token y sin usuario -> Entrar como invitado directo
      else if (!user && !authToken) {
        console.log("Acceso directo, entrando como invitado...");
        loginAsGuest();
      }
    };

    initAuth();
    // eslint-disable-next-line
  }, [authToken, user]); 

  // Pantalla blanca momentánea (muy rápida) para evitar parpadeos
  if (!user) {
    return <div style={{ minHeight: '100vh', background: 'white' }}></div>;
  }

  // Si ya tiene usuario (o invitado), muestra la app
  return children;
};

// --- APP PRINCIPAL ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ComandasPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/registro-comanda" 
            element={
              <ProtectedRoute>
                <RegistroComandaPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/detalle/:id" 
            element={
              <ProtectedRoute>
                <DetalleComandaPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;