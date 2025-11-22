import React, { useState } from "react";
import { db } from "./firebaseConfig";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
// 1. Importamos los iconos y el CSS
import { FaSearch, FaTimes, FaPhone, FaExclamationCircle } from "react-icons/fa";
import "./RegistroComanda.css"; 

export default function ModuloClienteRecientes({ isOpen, onClose, onClientFound }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false); // Estado visual para carga

  if (!isOpen) return null;

  const handleSearch = async () => {
    setErrorMessage('');
    const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, '').trim();

    if (!normalizedPhone || normalizedPhone.length < 8) {
      setErrorMessage('Número inválido (mínimo 8 dígitos).');
      return;
    }

    setIsSearching(true); // Activar carga visual

    try {
      const comandasRef = collection(db, "comandas_2");
      const q = query(comandasRef, where("telefono", "==", normalizedPhone), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const foundClientData = querySnapshot.docs[0].data();
        onClientFound(normalizedPhone, foundClientData);
        setPhoneNumber('');
        setErrorMessage('');
        onClose();
      } else {
        setErrorMessage('Cliente no encontrado.');
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage('Error de conexión.');
    } finally {
      setIsSearching(false); // Desactivar carga
    }
  };

  return (
    <div className="modal-overlay">
      <div className="search-modal-content">
        
        {/* Título con Icono */}
        <h3 className="search-modal-title">
            <FaPhone style={{marginRight: '10px', color: '#cd853f'}}/>
            Buscar por Teléfono
        </h3>

        {/* Input Estilizado */}
        <div className="search-input-container">
            <input
            type="tel"
            className="search-input"
            placeholder="+569 1234 5678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
            />
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
            <p style={{ color: "#dc3545", fontWeight: "bold", marginBottom: "15px", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <FaExclamationCircle /> {errorMessage}
            </p>
        )}

        {/* Botones a las orillas (Gracias a la clase search-modal-actions) */}
        <div className="search-modal-actions">
          <button className="btn-modal cancel" onClick={onClose}>
            <FaTimes style={{ marginRight: '5px' }}/> Cancelar
          </button>
          
          <button className="btn-modal confirm" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "..." : "Buscar"} <FaSearch style={{ marginLeft: '5px' }}/>
          </button>
        </div>

      </div>
    </div>
  );
}