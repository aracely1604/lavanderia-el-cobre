import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig'; //  Importamos la base de datos
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // Funciones para leer datos
import './Comandas.css'; // Un CSS nuevo para esta página
import logoSrc from './assets/Logo lavanderia.jpeg'; 

// Este componente recibe "onLogout" y "onShowCreate" desde App.jsx
export default function ComandasPage({ onLogout, onShowCreate }) {
  
  // Estados para guardar los datos y saber si está cargando
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect se ejecuta automáticamente cuando el componente carga
  useEffect(() => {
    // Esta función se conecta a Firebase para traer los datos
    const fetchComandas = async () => {
      setLoading(true);
      try {
        //  "Trae todo de la colección 'comandas', ordenado por fecha"
        const comandasRef = collection(db, "comandas");
        const q = query(comandasRef, orderBy("fechaIngreso", "desc")); // Ordena por fecha (¡importante!)

        // Ejecuta la consulta
        const querySnapshot = await getDocs(q);
        
        // Convierte los datos de Firebase a un array que React entiende
        const comandasList = querySnapshot.docs.map(doc => ({
          id: doc.id, // El ID único del documento
          ...doc.data() // Todos los demás datos (numeroOrden, tipoCliente, etc.)
        }));

        // Guarda los datos en el estado
        setComandas(comandasList);

      } catch (error) {
        console.error("Error al cargar comandas: ", error);
      }
      setLoading(false); // Deja de cargar
    };

    fetchComandas();
  }, []); // El [] vacío significa que esto se ejecuta solo 1 vez

  return (
    <div className="comandas-container">
      {/* Header (reutilizado) */}
      <header className="auth-header">
        <img src={logoSrc} alt="Logo" className="auth-logo" />
        <h1>Lavandería El Cobre Spa</h1>
      </header>
      
      <main className="comandas-main">
        {/* Barra de herramientas superior */}
        <div className="comandas-toolbar">
          <button onClick={onLogout} className="btn-logout">Cerrar sesión</button>
          <div className="filters">
            <input type="date" />
            <select>
              <option value="">Todo tipo</option>
              <option value="Particular">Particular</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>
          <button onClick={onShowCreate} className="btn-crear-comanda">Crear comanda</button>
        </div>

        <h2>COMANDAS GENERADAS</h2>

        {/* Contenedor de la tabla */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th> {/* Columna para el ícono de ojo */}
                <th>Número orden</th>
                <th>Tipo cliente</th>
                <th>Fecha ingreso</th>
                <th>Monto total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* --- Lógica para mostrar datos --- */}
              {loading && (
                <tr><td colSpan="6">Cargando comandas...</td></tr>
              )}

              {!loading && comandas.length === 0 && (
                <tr><td colSpan="6">No hay comandas registradas. ¡Crea la primera!</td></tr>
              )}

              {!loading && comandas.map((comanda) => (
                <tr key={comanda.id}>
                  <td className="action-icon">👁️</td> {/* Icono de ojo  */}
                  <td>{comanda.numeroOrden}</td>
                  <td>{comanda.tipoCliente}</td>
                  {/*guardar la fecha como string (ej. "27-10-2025")  */}
                  <td>{comanda.fechaIngreso.toDate ? comanda.fechaIngreso.toDate().toLocaleDateString('es-CL') : comanda.fechaIngreso}</td>
                  <td>${new Intl.NumberFormat('es-CL').format(comanda.montoTotal)}</td>
                  <td className="actions-cell">
                    <button className="btn-accion btn-descargar">Descargar</button>
                    <button className="btn-accion btn-notificar">Notificar al cliente</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}