import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'sans-serif',
        color: '#666'
      }}>
        Cargando credenciales...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'sans-serif',
        color: '#d32f2f',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Acceso Restringido</h2>
        <p>Debes ingresar desde la Intranet corporativa.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;