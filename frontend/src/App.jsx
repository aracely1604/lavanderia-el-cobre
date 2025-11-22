import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importa tus páginas
import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';

// URL de la Intranet Principal
const MAIN_INTRANET_URL = "https://lavanderia-cobre-landingpage.vercel.app/intranet/dashboard";

// --- COMPONENTE DE PROTECCIÓN (Lógica y Estilo del Repo TSX) ---
const ProtectedRoute = ({ children }) => {
  const { user, loginWithToken, loading } = useAuth();
  const location = useLocation();
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'error', 'success'
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Obtener el token de la URL (si existe)
  const params = new URLSearchParams(location.search);
  const authToken = params.get('auth_token');

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const verifyAccess = async () => {
      // 1. Configurar un Timeout de seguridad (8 segundos)
      timeoutId = setTimeout(() => {
        if (isMounted && status === 'verifying') {
          setErrorMessage('Tiempo de espera agotado. No se pudo validar.');
          setStatus('error');
          // Redirigir después de mostrar el error brevemente (2s)
          setTimeout(() => window.location.href = MAIN_INTRANET_URL, 2000);
        }
      }, 8000); // 8 segundos para el timeout

      try {
        // CASO A: Viene token en URL (login principal)
        if (authToken) {
          if (!user || user.uid !== authToken) {
            const success = await loginWithToken(authToken);
            if (!isMounted) return;

            if (!success) {
              setErrorMessage('Credenciales inválidas o acceso denegado.');
              setStatus('error');
              setTimeout(() => window.location.href = MAIN_INTRANET_URL, 2000);
              return;
            }
          }
          // Login OK
          if (isMounted) {
            window.history.replaceState({}, document.title, location.pathname);
            setStatus('success');
          }
          return;
        }

        // CASO B: Ya tiene sesión guardada (al recargar)
        if (user) {
          if (isMounted) setStatus('success');
          return;
        }

        // CASO C: Nada (ni token ni sesión) -> Redirigir inmediatamente
        if (!loading) {
          if (isMounted) {
             window.location.href = MAIN_INTRANET_URL;
          }
        }

      } catch (err) {
        console.error(err);
        if (isMounted) {
          setErrorMessage('Error de conexión al validar.');
          setStatus('error');
          setTimeout(() => window.location.href = MAIN_INTRANET_URL, 2000);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line
  }, [authToken, user, loading]); 

  // --- PANTALLA DE CARGA / ERROR (Estilo IDÉNTICO al repo enviado) ---
  if (loading || status === 'verifying' || status === 'error') {
    // Colores de tu paleta: orange-100/200/500/600
    const ORANGE_100 = '#ffedd5'; 
    const ORANGE_200 = '#fed7aa'; 
    const ORANGE_500 = '#f97316'; 
    const ORANGE_600 = '#ea580c'; 
    const RED_600 = '#dc2626';

    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: `linear-gradient(to bottom right, ${ORANGE_100}, ${ORANGE_200})`,
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem' 
        }}>
          
          {/* Spinner o Icono de Error */}
          {status === 'error' ? (
            <div style={{ fontSize: '3rem', color: RED_600 }}>⚠️</div>
          ) : (
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: `4px solid ${ORANGE_500}`, 
              borderTopColor: 'transparent', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          )}
          
          {/* Texto */}
          <div style={{ 
            fontSize: '1.25rem',
            fontWeight: '600',
            color: status === 'error' ? RED_600 : ORANGE_600 
          }}>
            {status === 'error' ? errorMessage : 'Validando credenciales...'}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Si pasa todas las validaciones
  return user ? children : null;
};

// --- APP PRINCIPAL ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Todas las rutas del Equipo 2 protegidas */}
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