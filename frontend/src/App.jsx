import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ComandasPage from './ComandasPage';
import RegistroComandaPage from './RegistroComandaPage';
import DetalleComandaPage from './DetalleComandaPage';


function App() {

return (
    <Router>
      <Routes>
        <Route path="/" element={<ComandasPage />} />
        
        {/* --- CAMBIO AQUÍ: Quitamos la condición de protección --- */}
        <Route path="/registro-comanda" element={<RegistroComandaPage />} />
        
        {/* --- CAMBIO AQUÍ: Quitamos la condición de protección --- */}
        <Route path="/detalle/:id" element={<DetalleComandaPage />} />
      </Routes>
    </Router>
  );
}
export default App;