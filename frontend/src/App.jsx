import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;