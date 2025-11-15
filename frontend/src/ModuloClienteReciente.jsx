import { useState } from "react";
import { db, storage } from "./firebaseConfig";
import { collection, query, where, limit, getDocs } from "firebase/firestore";

// SOLUCIÓN: Usar la sintaxis de función tradicional para exportación por defecto
export default function ModuloClienteRecientes ({ isOpen, onClose, onClientFound }) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleSearch = async () => {
        setErrorMessage('');
        const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, '').trim();

        if (!normalizedPhone || normalizedPhone.length < 8) {
        setErrorMessage('Número inválido.');
        return;
        }

    try {
        const comandasRef = collection(db, "comandas");
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
        setErrorMessage('Error al buscar.');
    }
    };

    return (
        <div className="modal-overlay">
        <div className="modal-content">
            <h3>Buscar Cliente por Teléfono</h3>

            <input
            type="tel"
            placeholder="+56912345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            />

            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

            <div className="modal-actions">
            <button onClick={onClose}>Cancelar</button>
            <button onClick={handleSearch}>Buscar</button>
            </div>
        </div>
        </div>
    );
}