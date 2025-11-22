import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
        {/* Rutas protegidas por la simulación */}
        <Route 
             path="/" element={<ComandasPage />} 
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