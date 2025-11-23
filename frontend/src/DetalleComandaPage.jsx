import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './DetalleComandaPage.css';

export default function DetalleComandaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComanda = async () => {
      try {
        const docRef = doc(db, "comandas_2", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setComanda({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("No se encontró la comanda");
          navigate('/');
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComanda();
  }, [id, navigate]);

  if (loading) return <div className="loading-text">Cargando detalle...</div>;
  if (!comanda) return null;

  // Formateador de dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  };

  // Formateador de fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('es-CL', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="detalle-page-wrapper">
      <div className="detalle-container">
        {/* --- ENCABEZADO --- */}
        <div className="detalle-header">
          <button className="btn-back" onClick={() => navigate('/')}>
            VOLVER
          </button>
          <div className="header-info">
            <span className="status-badge">{comanda.estado || 'ACTIVA'}</span>
            <h2 className="numero-orden">{comanda.numeroOrden}</h2>
          </div>
        </div>

        {/* --- TARJETAS DE INFORMACIÓN (GRID) --- */}
        <div className="info-grid">
          {/* Tarjeta Cliente */}
          <div className="info-card">
            <h3 className="card-title">👤 Datos del Cliente</h3>
            <div className="info-row">
              <span className="label">Nombre:</span>
              <span className="value">{comanda.nombreCliente}</span>
            </div>
            <div className="info-row">
              <span className="label">Teléfono:</span>
              <span className="value highlight">{comanda.telefono}</span>
            </div>
            <div className="info-row">
              <span className="label">Dirección:</span>
              <span className="value">{comanda.direccion || 'No registrada'}</span>
            </div>
            <div className="info-row">
              <span className="label">Tipo Cliente:</span>
              <span className="value">{comanda.tipoCliente}</span>
            </div>
          </div>

          {/* Tarjeta Orden */}
          <div className="info-card">
            <h3 className="card-title">📋 Detalles de Orden</h3>
            <div className="info-row">
              <span className="label">Fecha Ingreso:</span>
              <span className="value">{formatDate(comanda.fechaIngreso)}</span>
            </div>
            <div className="info-row">
              <span className="label">Hora:</span>
              <span className="value">{comanda.horaIngreso || '--:--'}</span>
            </div>
            <div className="info-row">
              <span className="label">Tipo Entrega:</span>
              <span className="value badge-entrega">
                {comanda.tipoEntrega} 
                {comanda.tipoEntrega === 'Despacho' && comanda.codigoDespacho && (
                  <span className="codigo-seguridad"> (Cód: {comanda.codigoDespacho})</span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="label">N° Boucher:</span>
              <span className="value">{comanda.numeroBoucher || 'Pendiente'}</span>
            </div>
             {comanda.servicioExpress && (
               <div className="express-alert">⚡ SERVICIO EXPRESS</div>
             )}
          </div>
        </div>

        {/* --- TABLA DE PRENDAS --- */}
        <div className="table-section">
          <h3 className="section-title">Prendas Ingresadas</h3>
          <table className="tabla-detalle">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Artículo</th>
                <th>Detalle / Daño</th>
                <th className="derecha">P. Unitario</th>
              </tr>
            </thead>
            <tbody>
              {comanda.prendas?.map((item, index) => (
                <tr key={index}>
                  <td className="cant-col">{item.cantidad}</td>
                  <td className="nombre-prenda">{item.nombre}</td>
                  <td className="detalle-prenda">{item.detalle || '-'}</td>
                  <td className="derecha">{formatMoney(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- FOTOS Y TOTALES --- */}
        <div className="footer-grid">
          {/* Sección Fotos */}
          <div className="fotos-section">
            {comanda.fotos && comanda.fotos.length > 0 ? (
              <>
                <h4>📸 Fotos Adjuntas</h4>
                <div className="gallery">
                  {comanda.fotos.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="img-link">
                      <img src={url} alt="Evidencia" />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p className="no-fotos">No hay fotos adjuntas.</p>
            )}
          </div>

          {/* Sección Totales */}
          <div className="totales-card">
            <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatMoney(comanda.montoSubtotal)}</span>
            </div>
            {comanda.servicioExpress && (
                 <div className="total-row express">
                    <span>Recargo Express (50%):</span>
                    <span>+ {formatMoney(comanda.montoSubtotal * 0.5)}</span>
                 </div>
            )}
            {comanda.tipoEntrega === 'Despacho' && (
                 <div className="total-row">
                    <span>Costo Despacho:</span>
                    {/* CORREGIDO: De 1.500 a 3.000 */}
                    <span>+ $3.000</span>
                 </div>
            )}
            <div className="total-final">
                <span>TOTAL:</span>
                <span>{formatMoney(comanda.montoTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}