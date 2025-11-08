import React, { useState } from 'react';
import './Auth.css';
import logoSrc from './assets/Logo lavanderia.jpeg';

// Recibe la función 'onLogin' desde App.jsx
export default function AuthPage({ onLogin }) {
  const [view, setView] = useState('login'); // 'login', 'create', 'reset'

  // Simulación de Login
  const handleLoginClick = () => {
    // Aquí podrías validar si los campos están llenos si quisieras,
    // pero para la simulación, simplemente dejamos entrar.
    onLogin(); 
  };

  // --- Vistas internas (Simuladas) ---
  const LoginScreen = () => (
    <>
      <h2>INICIAR SESIÓN</h2>
      <div className="form-group">
        <label>USUARIO (EMAIL)</label>
        <input type="text" placeholder="juan.perez@correo.com" />
      </div>
      <div className="form-group">
        <label>CONTRASEÑA</label>
        <input type="password" placeholder="********" />
      </div>
      <button onClick={handleLoginClick} className="btn btn-primary">INGRESAR</button>
      <button onClick={() => setView('reset')} className="btn btn-link">¿Olvidaste tu contraseña?</button>
      <span className="form-divider">O</span>
      <button onClick={() => setView('create')} className="btn btn-secondary">CREAR CUENTA</button>
    </>
  );

  const CreateScreen = () => (
    <>
      <button onClick={() => setView('login')} className="btn-back">REGRESAR</button>
      <h2>CREAR CUENTA</h2>
      {/* Campos solo visuales */}
      <div className="form-group"><label>USUARIO</label><input type="text" /></div>
      <div className="form-group"><label>CONTRASEÑA</label><input type="password" /></div>
      <button onClick={() => { alert('Cuenta simulada creada'); setView('login'); }} className="btn btn-primary">CREAR CUENTA</button>
    </>
  );

  const ResetScreen = () => (
    <>
      <button onClick={() => setView('login')} className="btn-back">REGRESAR</button>
      <h2>RECUPERAR CONTRASEÑA</h2>
      <p className="reset-info">Ingresa tu email de usuario.</p>
      <div className="form-group"><label>EMAIL</label><input type="text" /></div>
      <button onClick={() => { alert('Correo simulado enviado'); setView('login'); }} className="btn btn-primary">CONFIRMAR</button>
    </>
  );

  return (
    <div className="auth-container">
      <header className="auth-header">
        <img src={logoSrc} alt="Logo" className="auth-logo" />
        <h1>Lavandería El Cobre Spa</h1>
      </header>
      <main className="auth-form-container">
        <div className="auth-form">
          {view === 'login' && <LoginScreen />}
          {view === 'create' && <CreateScreen />}
          {view === 'reset' && <ResetScreen />}
        </div>
      </main>
    </div>
  );
}