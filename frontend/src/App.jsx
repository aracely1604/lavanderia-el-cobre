import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importa tus páginas
import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';

// URL de la Intranet Principal
const MAIN_INTRANET_URL = "https://lavanderia-cobre-landingpage.vercel.app/intranet/dashboard";

// --- COMPONENTE DE PROTECCIÓN ---
const ProtectedRoute = ({ children }) => {
  const { user, loginWithToken, loading } = useAuth();
  const location = useLocation();
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'error', 'success'
  const [errorMessage, setErrorMessage] = useState('');

  // Token de la URL
  const params = new URLSearchParams(location.search);
  const authToken = params.get('auth_token');

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const verifyAccess = async () => {
      // 1. Configurar un Timeout de seguridad (5 segundos)
      // Si Firebase no responde en 5s, mostramos error para no dejarlo pegado.
      timeoutId = setTimeout(() => {
        if (isMounted && status === 'verifying') {
          setErrorMessage('Tiempo de espera agotado. No se pudo validar.');
          setStatus('error');
          // Redirigir después de mostrar el error brevemente
          setTimeout(() => window.location.href = MAIN_INTRANET_URL, 2000);
        }
      }, 8000);

      try {
        // CASO A: Viene token en URL
        if (authToken) {
          if (!user || user.uid !== authToken) {
            const success = await loginWithToken(authToken);
            if (!isMounted) return;

            if (!success) {
              setErrorMessage('Credenciales inválidas o usuario inactivo.');
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

        // CASO B: Ya tiene sesión
        if (user) {
          if (isMounted) setStatus('success');
          return;
        }

        // CASO C: Nada
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
  // Colores Tailwind 'orange': 100:#ffedd5, 200:#fed7aa, 500:#f97316, 600:#ea580c
  
  if (loading || status === 'verifying' || status === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(to bottom right, #ffedd5, #fed7aa)', // from-orange-100 to-orange-200
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          
          {/* Spinner o Icono de Error */}
          {status === 'error' ? (
            <div style={{ fontSize: '3rem' }}>⚠️</div>
          ) : (
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '4px solid #f97316', // border-orange-500
              borderTopColor: 'transparent', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          )}
          
          {/* Texto */}
          <div style={{ 
            fontSize: '1.25rem', // text-xl
            fontWeight: '600', // font-semibold
            color: status === 'error' ? '#dc2626' : '#ea580c' // text-red-600 o text-orange-600
          }}>
            {status === 'error' ? errorMessage : 'Validando credenciales...'}
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? children : null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ProtectedRoute><ComandasPage /></ProtectedRoute>} />
          <Route path="/registro-comanda" element={<ProtectedRoute><RegistroComandaPage /></ProtectedRoute>} />
          <Route path="/detalle/:id" element={<ProtectedRoute><DetalleComandaPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;