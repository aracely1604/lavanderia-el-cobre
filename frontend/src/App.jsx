import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';


function App() {
  // Usamos localStorage para que si refrescas la página no te saque
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('simulatedLogin') === 'true'
  );

  // Función para simular el INGRESO
  const handleLogin = () => {
    localStorage.setItem('simulatedLogin', 'true');
    setIsLoggedIn(true);
  };

  // Función para simular el CIERRE DE SESIÓN
  const handleLogout = () => {
    localStorage.removeItem('simulatedLogin');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {/* Si no está "logueado", muestra AuthPage y le pasa la función handleLogin */}
        <Route 
          path="/" 
          element={!isLoggedIn ? <AuthPage onLogin={handleLogin} /> : <Navigate to="/comandas" replace />} 
        />
        
        {/* Rutas protegidas por la simulación */}
        <Route 
          path="/comandas" 
          element={isLoggedIn ? <ComandasPage onLogout={handleLogout} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/registro-comanda" 
          element={isLoggedIn ? <RegistroComandaPage /> : <Navigate to="/" replace />} 
        />
        <Route 
            path="/detalle/:id" 
            element={isLoggedIn ? <DetalleComandaPage /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}
export default App;