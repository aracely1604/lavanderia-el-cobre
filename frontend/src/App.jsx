import React, { useState } from 'react';
import AuthPage from './AuthPage';
import ComandasPage from './ComandasPage'; // Importa la nueva página

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Estado para mostrar/ocultar la página de crear comanda
  const [showCreate, setShowCreate] = useState(false); 

  // Si el usuario no ha iniciado sesión, muestra la página de Auth
  if (!isLoggedIn) {
    return <AuthPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }
  
  // --- Si el usuario SÍ inició sesión ---
  
  // Si showCreate es true, mostramos la pág. de crear (que haremos después)
  if (showCreate) {
    // Esto es un placeholder para el siguiente paso
    return (
      <div>
        <h1>Página de Crear Comanda (Próximo paso)</h1>
        <button onClick={() => setShowCreate(false)}>Volver a la lista</button>
      </div>
    );
  }

  // Por defecto, muestra la lista de Comandas
  return (
    <ComandasPage 
      onLogout={() => setIsLoggedIn(false)} 
      onShowCreate={() => setShowCreate(true)} 
    />
  );
}

export default App;
