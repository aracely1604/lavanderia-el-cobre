import React, { useState } from 'react';
import './Auth.css';
import logoSrc from './assets/Logo lavanderia.jpeg'; // <--- 1. IMPORTA TU LOGO

// --- Componente de Inicio de Sesión ---
function LoginScreen({ onLogin, setView }) {
  // ... (El código de esta función no cambia)
  return (
    <>
      <h2>INICIAR SESIÓN</h2>
      <div className="form-group">
        <label htmlFor="login-email">USUARIO</label>
        <input type="text" id="login-email" placeholder="Juan Perez" />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">CONTRASEÑA</label>
        <input type="password" id="login-password" placeholder="********" />
      </div>
      <button onClick={onLogin} className="btn btn-primary">
        INGRESAR
      </button>
      <button onClick={() => setView('reset')} className="btn btn-link">
        ¿Olvidaste tu contraseña?
      </button>
      <span className="form-divider">O</span>
      <button onClick={() => setView('create')} className="btn btn-secondary">
        CREAR CUENTA
      </button>
    </>
  );
}

// --- Componente de Crear Cuenta ---
function CreateAccountScreen({ setView }) {
  // ... (El código de esta función no cambia)
  const handleCreate = () => {
    alert('¡Cuenta creada!'); 
    setView('login');
  };

  return (
    <>
      <button onClick={() => setView('login')} className="btn-back">
        REGRESAR
      </button>
      <h2>CREAR CUENTA</h2>
      <div className="form-group">
        <label htmlFor="create-user">USUARIO</label>
        <input type="text" id="create-user" placeholder="Juan Perez" />
      </div>
      <div className="form-group">
        <label htmlFor="create-password">CONTRASEÑA</label>
        <input type="password" id="create-password" placeholder="********" />
      </div>
      <button onClick={handleCreate} className="btn btn-primary">
        CREAR CUENTA
      </button>
    </>
  );
}

// --- Componente de Recuperar Contraseña ---
function ResetPasswordScreen({ setView }) {
  // ... (El código de esta función no cambia)
  const handleReset = () => {
    alert('Instrucciones enviadas'); 
    setView('login'); 
  };

  return (
    <>
      <button onClick={() => setView('login')} className="btn-back">
        REGRESAR
      </button>
      <h2>RECUPERAR CONTRASEÑA</h2>
      <p className="reset-info">Ingresa tu usuario para reestablecer la contraseña.</p>
      <div className="form-group">
        <label htmlFor="reset-user">USUARIO</label>
        <input
          type="text"
          id="reset-user"
          placeholder="Juan Perez"
        />
      </div>
      <button onClick={handleReset} className="btn btn-primary">
        CONFIRMAR
      </button>
    </>
  );
}


// --- Componente Principal que controla todo ---
export default function AuthPage({ onLoginSuccess }) {
  const [view, setView] = useState('login'); 

  const renderView = () => {
    switch (view) {
      case 'create':
        return <CreateAccountScreen setView={setView} />;
      case 'reset':
        return <ResetPasswordScreen setView={setView} />;
      case 'login':
      default:
        return <LoginScreen onLogin={onLoginSuccess} setView={setView} />;
    }
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        {/* v--- 2. AQUÍ ESTÁ EL CAMBIO ---v */}
        <img src={logoSrc} alt="Logo Lavandería El Cobre" className="auth-logo" />
        <h1>Lavandería El Cobre Spa</h1>
        {/* ^--- 2. AQUÍ ESTÁ EL CAMBIO ---^ */}
      </header>
      <main className="auth-form-container">
        <div className="auth-form">
          {renderView()}
        </div>
      </main>
    </div>
  );
}