import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Comandas.css';
import logoSrc from './assets/Logo lavanderia.jpeg';

export default function ComandasPage() {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroFecha, setFiltroFecha] = useState(() => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    return new Date(hoy.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
  });
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, "comandas"), orderBy("fechaIngreso", "desc"));

    // Filtro de Tipo de Cliente
    if (filtroTipo !== 'Todos') {
      q = query(q, where("tipoCliente", "==", filtroTipo));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const comandasList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const comandasFiltradas = comandasList.filter(comanda => {
        if (!filtroFecha) return true;
        const fechaComanda = comanda.fechaIngreso?.toDate().toISOString().split('T')[0];
        return fechaComanda === filtroFecha;
      });

      setComandas(comandasFiltradas);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar comandas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filtroFecha, filtroTipo]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="comandas-container">
      <header className="auth-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <img src={logoSrc} alt="Logo" className="auth-logo" />
            <h1>Lavandería El Cobre Spa</h1>
        </div>
      </header>
      
      <main className="comandas-main">
        <div className="comandas-toolbar">
          <button onClick={handleLogout} className="btn-logout">CERRAR SESIÓN</button>
          
          <div className="filters">
            <input 
              type="date" 
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="filter-input"
            />
            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="filter-select"
            >
              <option value="Todos">Todos los tipos</option>
              <option value="Particular">Particular</option>
              {/* Quitamos Empresa, dejamos solo Hotel */}
              <option value="Hotel">Hotel</option>
            </select>
          </div>

          <button onClick={() => navigate('/registro-comanda')} className="btn-crear-comanda">
            CREAR COMANDA
          </button>
        </div>

        <h2>COMANDAS GENERADAS</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>NÚMERO ORDEN</th>
                <th>CLIENTE</th>
                <th>TIPO CLIENTE</th> {/* Nueva Columna */}
                <th>FECHA INGRESO</th>
                <th>MONTO TOTAL</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Cargando comandas...</td></tr>}
              {!loading && comandas.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>No hay comandas para esta fecha/tipo.</td></tr>}
              
              {comandas.map((comanda) => (
                <tr key={comanda.id}>
                  <td 
                  className="action-icon" 
                  title="Ver detalle"
                  onClick={() => navigate(`/detalle/${comanda.id}`)} /* <--- ESTO FALTABA */
                  style={{ cursor: 'pointer' }} /* Para que el mouse se vea como manito */
                  >
                    👁️
                  </td>
                  <td>{comanda.numeroOrden}</td>
                  <td>{comanda.nombreCliente}</td>
                  {/* Nueva celda para mostrar el tipo */}
                  <td>{comanda.tipoCliente}</td>
                  <td>
                    {comanda.fechaIngreso?.toDate 
                      ? comanda.fechaIngreso.toDate().toLocaleDateString('es-CL') 
                      : 'Fecha inválida'}
                  </td>
                  <td>${new Intl.NumberFormat('es-CL').format(comanda.montoTotal || 0)}</td>
                  <td className="actions-cell">
                    <button className="btn-accion btn-descargar">DESCARGAR</button>
                    <button className="btn-accion btn-notificar">NOTIFICAR</button>
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