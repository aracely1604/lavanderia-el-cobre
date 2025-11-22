import React, { useState, useEffect } from "react";
import { db, auth } from "./firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Comandas.css";
import logoSrc from "./assets/Logo lavanderia.jpeg";
import axios from "axios";

import { 
  FaEye, FaFilePdf, FaWhatsapp, FaTrash, FaTruck, 
  FaBoxOpen, FaSignOutAlt, FaPlus, FaFilter, FaCheck, FaClock, FaExclamationTriangle 
} from "react-icons/fa";

export default function ComandasPage() {
  const navigate = useNavigate();
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("todos");

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

  const comandasRetiro = comandas.filter((c) => c.tipoEntrega === "Retiro");
  const comandasDespacho = comandas.filter((c) => c.tipoEntrega === "Despacho");

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // 1. AL HACER CLIC EN LA "X", SOLO ABRIMOS EL MODAL
  const handleClickCancelar = (id) => {
    setIdToDelete(id);
    setShowCancelModal(true);
  };

  // 2. SI CONFIRMA EN EL MODAL, EJECUTAMOS LA LÓGICA
  const confirmarCancelacion = async () => {
    if (!idToDelete) return;

    try {
      const comandaRef = doc(db, "comandas_2", idToDelete);
      await updateDoc(comandaRef, {
        estado: "Cancelada",
      });
      // Cerramos modal y limpiamos ID
      setShowCancelModal(false);
      setIdToDelete(null);
    } catch (error) {
      console.error("Error al cancelar:", error);
      alert("Error al cancelar la comanda.");
    }
  };

  // 3. SI CANCELA O CIERRA
  const cerrarModal = () => {
    setShowCancelModal(false);
    setIdToDelete(null);
  };

  // --- FUNCIONES DE NOTIFICACIÓN ---
  const enviarNotificacion = async (comanda) => {
    try {
      if (!comanda.telefono) {
        alert("La comanda no tiene teléfono registrado.");
        return;
      }
      if (!comanda.facturaPDF) {
        alert("Esta comanda no tiene factura generada.");
        return;
      }

      const payload = {
        numero: comanda.telefono.startsWith("+")
          ? comanda.telefono
          : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF,
        mensaje:
          `¡Hola ${comanda.nombreCliente}!\n\n` +
          `Tu pedido correspondiente a la orden *${comanda.numeroOrden}* ya está *listo para retiro* en Lavandería El Cobre SPA.\n\n` +
          `🔗 https://lavanderia-el-cobre-spa.vercel.app\n\n` +
          `Presenta tu N° de Orden para retirar tu pedido.\n\n` +
          `¡Gracias por preferir Lavandería El Cobre SPA!`,
      };

      await axios.post(
        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
        payload
      );

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
      if (!comanda.telefono) {
        alert("Sin teléfono");
        return;
      }
      if (!comanda.facturaPDF) {
        alert("Sin factura");
        return;
      }
      const payload = {
        numero: comanda.telefono.startsWith("+")
          ? comanda.telefono
          : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF,
        mensaje:
          `Hola ${comanda.nombreCliente},\n\n` +
          `Tu pedido correspondiente a la orden *${comanda.numeroOrden}* lleva *15 días* listo para retiro.\n\n` +
          `Te solicitamos gestionar el retiro a la brevedad.\n\n` +
          `Gracias.`,
      };
      await axios.post(
        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
        payload
      );
      await updateDoc(doc(db, "comandas_2", comanda.id), {
        notificado15: true,
        fechaNotificacion15: new Date(),
      });
    } catch (err) {
      console.error(err);
      alert("Error al notificar");
    }
  };

  const enviarNotificacionAtraso30 = async (comanda) => {
    try {
      if (!comanda.telefono) {
        alert("Sin teléfono");
        return;
      }
      if (!comanda.facturaPDF) {
        alert("Sin factura");
        return;
      }
      const payload = {
        numero: comanda.telefono.startsWith("+")
          ? comanda.telefono
          : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF,
        mensaje:
          `Hola ${comanda.nombreCliente},\n\n` +
          `Tu pedido correspondiente a la orden *${comanda.numeroOrden}* lleva *30 días* sin ser retirado.\n\n` +
          `La empresa no se hace responsable por prendas después de este periodo.\n\n` +
          `Gracias.`,
      };
      await axios.post(
        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
        payload
      );
      await updateDoc(doc(db, "comandas_2", comanda.id), {
        notificado30: true,
        fechaNotificacion30: new Date(),
      });
    } catch (err) {
      console.error(err);
      alert("Error al notificar");
    }
  };

  const enviarNotificacionDespachoEnCamino = async (comanda) => {
    try {
      if (!comanda.telefono) {
        alert("La comanda no tiene teléfono registrado.");
        return;
      }
      if (!comanda.codigoDespacho) {
        alert("Esta comanda no tiene código de despacho registrado.");
        return;
      }

      const payload = {
        numero: comanda.telefono.startsWith("+")
          ? comanda.telefono
          : `+56${comanda.telefono.replace(/\D/g, "")}`,
        enlace: comanda.facturaPDF || "",
        mensaje:
          `¡Hola ${comanda.nombreCliente}!\n\n` +
          `Tu pedido correspondiente a la orden *${comanda.numeroOrden}* ya va en camino 🚚.\n\n` +
          `*Código de entrega:* ${comanda.codigoDespacho}\n\n` +
          `🔗 https://lavanderia-el-cobre-spa.vercel.app\n\n` +
          `Por favor ten este código a mano cuando recibas el despacho.\n\n` +
          `¡Gracias por preferir Lavandería El Cobre SPA!`,
      };

      await axios.post(
        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
        payload
      );

      await updateDoc(doc(db, "comandas_2", comanda.id), {
        notificadoEnCamino: true,
        fechaNotificacionEnCamino: new Date(),
      });
    } catch (err) {
      console.error("Error al enviar notificación de despacho:", err);
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
    const rowStyle = isCancelada
      ? { backgroundColor: "#ffebee", color: "#999" }
      : {};

return (
      <tr key={comanda.id} style={rowStyle}>
        <td data-label="Detalle" className="center-content">
          <button 
             className="icon-btn view-btn"
             title="Ver detalle"
             onClick={() => navigate(`/detalle/${comanda.id}`)}
             disabled={isCancelada}
          >
            <FaEye />
          </button>
        </td>
        <td data-label="N° Orden">{comanda.numeroOrden}</td>
        <td data-label="Cliente">{comanda.nombreCliente}</td>
        <td data-label="Tipo">{comanda.tipoCliente}</td>
        <td data-label="Fecha">
          {comanda.fechaIngreso?.toDate
            ? comanda.fechaIngreso.toDate().toLocaleDateString("es-CL")
            : "Inválida"}
        </td>
        <td data-label="Hora">{comanda.horaIngreso || "--:--"}</td>
        <td data-label="Total" style={{ textDecoration: isCancelada ? "line-through" : "none" }}>
          ${new Intl.NumberFormat("es-CL").format(comanda.montoTotal || 0)}
        </td>

        <td data-label="Acciones" className="actions-cell">
            <div className="actions-wrapper">
                <button
                    className="btn-accion btn-descargar"
                    onClick={() => handleDescargarFactura(comanda.facturaPDF)}
                    disabled={isCancelada}
                    title="Descargar PDF"
                >
                    <FaFilePdf /> <span className="btn-text">PDF</span>
                </button>

                {comanda.tipoEntrega === "Despacho" && (
                    <button
                    className={`btn-accion ${comanda.notificadoEnCamino ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => enviarNotificacionDespachoEnCamino(comanda)}
                    disabled={comanda.notificadoEnCamino || isCancelada}
                    >
                    <FaTruck /> <span className="btn-text">{comanda.notificadoEnCamino ? "ENVIADO" : "CAMINO"}</span>
                    </button>
                )}

                {mostrarBotonesNotificacion && (
                    <>
                    <button
                        className={`btn-accion ${comanda.notificado ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => enviarNotificacion(comanda)}
                        disabled={comanda.notificado || isCancelada}
                    >
                        <FaWhatsapp /> <span className="btn-text">{comanda.notificado ? "LISTO" : "LISTO"}</span>
                    </button>

                    {/* Botones extra colapsados en móvil si se desea, o mostrados así */}
                    <button
                        className={`btn-accion btn-small ${comanda.notificado15 ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => enviarNotificacionAtraso15(comanda)}
                        disabled={comanda.notificado15 || isCancelada}
                        title="Notificar 15 días"
                    >
                        <FaClock /> 15
                    </button>

                    <button
                        className={`btn-accion btn-small ${comanda.notificado30 ? 'btn-success' : 'btn-warning'}`}
                        onClick={() => enviarNotificacionAtraso30(comanda)}
                        disabled={comanda.notificado30 || isCancelada}
                        title="Notificar 30 días"
                    >
                        <FaExclamationTriangle /> 30
                    </button>
                    </>
                )}

                {!isCancelada ? (
                    <button
                    className="btn-icon-cancel"
                    onClick={() => handleClickCancelar(comanda.id)}
                    title="Cancelar pedido"
                    >
                    <FaTrash />
                    </button>
                ) : (
                    <span className="cancelada-badge">CANCELADA</span>
                )}
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
          <button onClick={handleLogout} className="btn-logout">
            <FaSignOutAlt /> Cerrar Sesión
          </button>

          <div className="filters">
            <div className="date-filter">
                <FaFilter className="filter-icon"/>
                <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="filter-input"
                />
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
            <h2 className="section-header retiros"><FaBoxOpen /> Retiro en Local</h2>
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
                  {!loading && comandasRetiro.length === 0 && <tr><td colSpan="8" className="center-text">No hay datos.</td></tr>}
                  {comandasRetiro.map((comanda) => renderFila(comanda, true))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(viewMode === "todos" || viewMode === "despacho") && (
          <>
            <h2 className="section-header despachos"><FaTruck /> Despacho a Domicilio</h2>
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
                  {!loading && comandasDespacho.length === 0 && <tr><td colSpan="8" className="center-text">No hay datos.</td></tr>}
                  {comandasDespacho.map((comanda) => renderFila(comanda, false))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
