import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Comandas.css";
import logoSrc from "./assets/LogoLavanderia.png";
import axios from "axios";

import { 
  FaEye, FaFilePdf, FaWhatsapp, FaTrash, FaTruck, 
  FaBoxOpen, FaPlus, FaFilter, FaClock, FaExclamationTriangle, FaChevronDown 
} from "react-icons/fa";

export default function ComandasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("todos");

  // --- NUEVO ESTADO PARA PAGINACIÓN ---
  const [cantidadVisible, setCantidadVisible] = useState(5);

  // --- ESTADOS PARA EL MODAL DE CANCELAR ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  // Estado para la FECHA
  const [filtroFecha, setFiltroFecha] = useState(() => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    return new Date(hoy.getTime() - offset * 60 * 1000)
      .toISOString()
      .split("T")[0];
  });

  useEffect(() => {
    setLoading(true);
    let q = query(
      collection(db, "comandas_2"),
      orderBy("fechaIngreso", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const comandasList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const comandasFiltradas = comandasList.filter((comanda) => {
          if (!filtroFecha) return true;
          const fechaComanda = comanda.fechaIngreso
            ?.toDate()
            .toISOString()
            .split("T")[0];
          return fechaComanda === filtroFecha;
        });

        setComandas(comandasFiltradas);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar comandas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filtroFecha]);

  // --- REINICIAR CONTADOR AL CAMBIAR FILTROS ---
  useEffect(() => {
    setCantidadVisible(5);
  }, [filtroFecha, viewMode]);

  // Filtramos las listas completas
  const todasRetiro = comandas.filter((c) => c.tipoEntrega === "Retiro");
  const todasDespacho = comandas.filter((c) => c.tipoEntrega === "Despacho");

  // Recortamos las listas según la cantidad visible
  const comandasRetiroVisibles = todasRetiro.slice(0, cantidadVisible);
  const comandasDespachoVisibles = todasDespacho.slice(0, cantidadVisible);

  // Lógica para saber si mostrar el botón "Mostrar más"
  const hayMasRetiro = todasRetiro.length > cantidadVisible;
  const hayMasDespacho = todasDespacho.length > cantidadVisible;
  
  // Dependiendo del modo de vista, decidimos si mostramos el botón
  let mostrarBotonCargarMas = false;
  if (viewMode === 'todos' && (hayMasRetiro || hayMasDespacho)) mostrarBotonCargarMas = true;
  if (viewMode === 'retiro' && hayMasRetiro) mostrarBotonCargarMas = true;
  if (viewMode === 'despacho' && hayMasDespacho) mostrarBotonCargarMas = true;

  const cargarMasComandas = () => {
    setCantidadVisible(prev => prev + 5);
  };

  // --- LOGICA CANCELAR (Igual que antes) ---
  const handleClickCancelar = (id) => {
    setIdToDelete(id);
    setShowCancelModal(true);
  };

  const confirmarCancelacion = async () => {
    if (!idToDelete) return;
    try {
      const comandaRef = doc(db, "comandas_2", idToDelete);
      await updateDoc(comandaRef, { estado: "Cancelada" });
      setShowCancelModal(false);
      setIdToDelete(null);
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("Error al cancelar la comanda.");
    }
  };

  const cerrarModal = () => {
    setShowCancelModal(false);
    setIdToDelete(null);
  };

  // --- FUNCIONES DE NOTIFICACIÓN (Sin cambios) ---
  const enviarNotificacion = async (comanda) => {
    try {
      if (!comanda.telefono) return alert("Sin teléfono");
      if (!comanda.facturaPDF) return alert("Sin factura");

      const payload = {
        numero: comanda.telefono.startsWith("+") ? comanda.telefono : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF,
        mensaje: `¡Hola ${comanda.nombreCliente}!\n\nTu pedido correspondiente a la orden *${comanda.numeroOrden}* ya está *listo para retiro en Lavandería El Cobre SPA*.\n\n🔗 https://lavanderia-el-cobre-spa.vercel.app\n\nPresenta tu N° de Orden para retirar tu pedido.\n\n¡Gracias por preferir Lavandería El Cobre SPA!`,
      };

      await axios.post("https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura", payload);

      await updateDoc(doc(db, "comandas_2", comanda.id), {
        notificado: true,
        fechaNotificacion: new Date(),
      });
    } catch (err) {
      console.error("Error al notificar:", err);
      alert("Error al notificar.");
    }
  };

  const enviarNotificacionAtraso15 = async (comanda) => {
    try {
        const payload = {
            numero: comanda.telefono.startsWith("+") ? comanda.telefono : `+56${comanda.telefono.replace(/\D/g, "")}`,
            enlace: comanda.facturaPDF,
            mensaje: `Hola ${comanda.nombreCliente},\n\nTu pedido correspondiente a la orden *${comanda.numeroOrden}* lleva *15 días* listo para retiro.\n\nTe solicitamos gestionar el retiro a la brevedad.\n\nGracias.`,
        };
        await axios.post("https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura", payload);
        await updateDoc(doc(db, "comandas_2", comanda.id), { notificado15: true, fechaNotificacion15: new Date() });
    } catch (err) { console.error(err); alert("Error notificar 15 días"); }
  };

  const enviarNotificacionAtraso30 = async (comanda) => {
    try {
        const payload = {
            numero: comanda.telefono.startsWith("+") ? comanda.telefono : `+56${comanda.telefono.replace(/\D/g, "")}`,
            enlace: comanda.facturaPDF,
            mensaje: `Hola ${comanda.nombreCliente},\n\nTu pedido correspondiente a la orden *${comanda.numeroOrden}* lleva *30 días* sin ser retirado.\n\nLa empresa no se hace responsable por prendas después de este periodo.\n\nGracias.`,
        };
        await axios.post("https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura", payload);
        await updateDoc(doc(db, "comandas_2", comanda.id), { notificado30: true, fechaNotificacion30: new Date() });
    } catch (err) { console.error(err); alert("Error notificar 30 días"); }
  };

  const enviarNotificacionDespachoEnCamino = async (comanda) => {
    try {
      if (!comanda.telefono || !comanda.codigoDespacho) return alert("Datos incompletos para despacho");
      const payload = {
        numero: comanda.telefono.startsWith("+") ? comanda.telefono : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF || "",
        mensaje: `¡Hola ${comanda.nombreCliente}!\n\nTu pedido *${comanda.numeroOrden}* va en camino 🚚.\n\n*Recuerda tu código de entrega:* ${comanda.codigoDespacho}\n\nGracias!`,
      };
      await axios.post("https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura", payload);
      await updateDoc(doc(db, "comandas_2", comanda.id), {
        notificadoEnCamino: true,
        fechaNotificacionEnCamino: new Date(),
      });
    } catch (err) {
      console.error("Error despacho:", err);
      alert("Error al notificar despacho.");
    }
  };

  const handleDescargarFactura = (urlFactura) => {
    window.open(urlFactura, "_blank");
  };

  const getFilterButtonStyle = (mode) => {
    const isActive = viewMode === mode;
    return {
      padding: "8px 16px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
      backgroundColor: isActive ? "#004080" : "#e0e0e0",
      color: isActive ? "white" : "#333",
      transition: "all 0.2s",
    };
  };

  const renderFila = (comanda, mostrarBotonesNotificacion) => {
    const isCancelada = comanda.estado === "Cancelada";
    const rowStyle = isCancelada ? { backgroundColor: "#ffebee", color: "#999" } : {};
    const puedeCancelar = user?.role === 'Administrador';

    return (
      <tr key={comanda.id} style={rowStyle}>
        <td data-label="Detalle" className="center-content">
          <button className="icon-btn view-btn" title="Ver detalle" onClick={() => navigate(`/detalle/${comanda.id}`)} disabled={isCancelada}>
            <FaEye />
          </button>
        </td>
        <td data-label="N° Orden">{comanda.numeroOrden}</td>
        <td data-label="Cliente">{comanda.nombreCliente}</td>
        <td data-label="Tipo">{comanda.tipoCliente}</td>
        <td data-label="Fecha">
          {comanda.fechaIngreso?.toDate ? comanda.fechaIngreso.toDate().toLocaleDateString("es-CL") : "Inválida"}
        </td>
        <td data-label="Hora">{comanda.horaIngreso || "--:--"}</td>
        <td data-label="Total" style={{ textDecoration: isCancelada ? "line-through" : "none" }}>
          ${new Intl.NumberFormat("es-CL").format(comanda.montoTotal || 0)}
        </td>
        <td data-label="Acciones" className="actions-cell">
            <div className="actions-wrapper">
                <button className="btn-accion btn-descargar" onClick={() => handleDescargarFactura(comanda.facturaPDF)} disabled={isCancelada} title="Descargar PDF">
                    <FaFilePdf /> <span className="btn-text">PDF</span>
                </button>
                {comanda.tipoEntrega === "Despacho" && (
                    <button className={`btn-accion ${comanda.notificadoEnCamino ? 'btn-success' : 'btn-warning'}`} onClick={() => enviarNotificacionDespachoEnCamino(comanda)} disabled={comanda.notificadoEnCamino || isCancelada}>
                    <FaTruck /> <span className="btn-text">{comanda.notificadoEnCamino ? "ENVIADO" : "CAMINO"}</span>
                    </button>
                )}
                {mostrarBotonesNotificacion && (
                    <>
                    <button className={`btn-accion ${comanda.notificado ? 'btn-success' : 'btn-warning'}`} onClick={() => enviarNotificacion(comanda)} disabled={comanda.notificado || isCancelada}>
                        <FaWhatsapp /> <span className="btn-text">{comanda.notificado ? "LISTO" : "LISTO"}</span>
                    </button>
                    <button className={`btn-accion btn-small ${comanda.notificado15 ? 'btn-success' : 'btn-warning'}`} onClick={() => enviarNotificacionAtraso15(comanda)} disabled={comanda.notificado15 || isCancelada} title="Notificar 15 días">
                        <FaClock /> 15
                    </button>
                    <button className={`btn-accion btn-small ${comanda.notificado30 ? 'btn-success' : 'btn-warning'}`} onClick={() => enviarNotificacionAtraso30(comanda)} disabled={comanda.notificado30 || isCancelada} title="Notificar 30 días">
                        <FaExclamationTriangle /> 30
                    </button>
                    </>
                )}
                {!isCancelada && puedeCancelar && (
                    <button className="btn-icon-cancel" onClick={() => handleClickCancelar(comanda.id)} title="Cancelar pedido">
                    <FaTrash />
                    </button>
                )}
                {isCancelada && <span className="cancelada-badge">CANCELADA</span>}
            </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="comandas-container">
      {/* MODAL CANCELAR */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="error-text"><FaExclamationTriangle /> Cancelar Comanda</h3>
            <p>¿Estás seguro de que quieres cancelar esta comanda?</p>
            <div className="modal-actions">
              <button onClick={cerrarModal} className="btn-modal-cancel">Regresar</button>
              <button onClick={confirmarCancelacion} className="btn-modal-confirm danger">Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <header className="auth-header">
        <div className="header-brand">
          <img src={logoSrc} alt="Logo" className="auth-logo" />
          <h1>Lavandería El Cobre Spa</h1>
        </div>
      </header>

      <main className="comandas-main">
        <div className="comandas-toolbar">
          <div className="user-info-display" style={{color: '#555', fontWeight: '500'}}>
             Hola, {user?.name || 'Usuario'} ({user?.role})
          </div>
          <div className="filters">
            <div className="date-filter">
                <FaFilter className="filter-icon"/>
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="filter-input"/>
            </div>
            <div className="filter-buttons">
              <button onClick={() => setViewMode("todos")} className="filter-btn" style={getFilterButtonStyle("todos")}>TODOS</button>
              <button onClick={() => setViewMode("retiro")} className="filter-btn" style={getFilterButtonStyle("retiro")}>RETIRO</button>
              <button onClick={() => setViewMode("despacho")} className="filter-btn" style={getFilterButtonStyle("despacho")}>DESPACHO</button>
            </div>
          </div>
          <button onClick={() => navigate("/registro-comanda")} className="btn-crear-comanda">
            <FaPlus /> Crear Comanda
          </button>
        </div>

        {(viewMode === "todos" || viewMode === "retiro") && (
          <>
            <h2 className="section-header retiros"><FaBoxOpen /> Retiro en Local ({comandasRetiroVisibles.length}/{todasRetiro.length})</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ver</th>
                    <th>N° Orden</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="8" className="center-text">Cargando...</td></tr>}
                  {!loading && comandasRetiroVisibles.length === 0 && <tr><td colSpan="8" className="center-text">No hay datos.</td></tr>}
                  {comandasRetiroVisibles.map((comanda) => renderFila(comanda, true))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(viewMode === "todos" || viewMode === "despacho") && (
          <>
            <h2 className="section-header despachos"><FaTruck /> Despacho a Domicilio ({comandasDespachoVisibles.length}/{todasDespacho.length})</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ver</th>
                    <th>N° Orden</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="8" className="center-text">Cargando...</td></tr>}
                  {!loading && comandasDespachoVisibles.length === 0 && <tr><td colSpan="8" className="center-text">No hay datos.</td></tr>}
                  {comandasDespachoVisibles.map((comanda) => renderFila(comanda, false))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- BOTÓN MOSTRAR MÁS --- */}
        {mostrarBotonCargarMas && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '40px' }}>
            <button className="btn-mostrar-mas" onClick={cargarMasComandas}>
              <FaChevronDown /> Mostrar más ({cantidadVisible} mostrados)
            </button>
          </div>
        )}

      </main>
    </div>
  );
}