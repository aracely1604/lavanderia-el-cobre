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
        <td
          className="action-icon"
          title="Ver detalle"
          onClick={() => navigate(`/detalle/${comanda.id}`)}
          style={{ cursor: "pointer", opacity: isCancelada ? 0.5 : 1 }}
        >
          👁️
        </td>
        <td>{comanda.numeroOrden}</td>
        <td>{comanda.nombreCliente}</td>
        <td>{comanda.tipoCliente}</td>
        <td>
          {comanda.fechaIngreso?.toDate
            ? comanda.fechaIngreso.toDate().toLocaleDateString("es-CL")
            : "Fecha inválida"}
        </td>
        <td>{comanda.horaIngreso || "--:--"}</td>
        <td style={{ textDecoration: isCancelada ? "line-through" : "none" }}>
          ${new Intl.NumberFormat("es-CL").format(comanda.montoTotal || 0)}
        </td>

        <td className="actions-cell">
          <button
            className="btn-accion btn-descargar"
            onClick={() => handleDescargarFactura(comanda.facturaPDF)}
            disabled={isCancelada}
            style={{ opacity: isCancelada ? 0.5 : 1 }}
          >
            DESCARGAR
          </button>
          {comanda.tipoEntrega === "Despacho" && (
            <button
              className="btn-accion btn-notificar"
              onClick={() => enviarNotificacionDespachoEnCamino(comanda)}
              disabled={comanda.notificadoEnCamino || isCancelada}
              style={{
                opacity: isCancelada
                  ? 0.5
                  : comanda.notificadoEnCamino
                  ? 0.6
                  : 1,
                backgroundColor: comanda.notificadoEnCamino
                  ? "#28a745"
                  : "#d68a31",
              }}
            >
              {comanda.notificadoEnCamino ? "✔ EN CAMINO" : "EN CAMINO"}
            </button>
          )}

          {mostrarBotonesNotificacion && (
            <>
              <button
                className="btn-accion btn-notificar"
                onClick={() => enviarNotificacion(comanda)}
                disabled={comanda.notificado || isCancelada}
                style={{
                  opacity: isCancelada ? 0.5 : comanda.notificado ? 0.6 : 1,
                  backgroundColor: comanda.notificado ? "#28a745" : "#d68a31",
                }}
              >
                {comanda.notificado ? "✔ ENVIADO" : "NOTIFICAR"}
              </button>

              <button
                className="btn-accion btn-notificar"
                onClick={() => enviarNotificacionAtraso15(comanda)}
                disabled={comanda.notificado15 || isCancelada}
                style={{
                  opacity: isCancelada ? 0.5 : comanda.notificado15 ? 0.6 : 1,
                  backgroundColor: comanda.notificado15 ? "#28a745" : "#d68a31",
                }}
              >
                {comanda.notificado15 ? "✔ 15 DIAS" : "15 DIAS"}
              </button>

              <button
                className="btn-accion btn-notificar"
                onClick={() => enviarNotificacionAtraso30(comanda)}
                disabled={comanda.notificado30 || isCancelada}
                style={{
                  opacity: isCancelada ? 0.5 : comanda.notificado30 ? 0.6 : 1,
                  backgroundColor: comanda.notificado30 ? "#28a745" : "#d68a31",
                }}
              >
                {comanda.notificado30 ? "✔ 30 DIAS" : "30 DIAS"}
              </button>
            </>
          )}

          {!isCancelada ? (
            <button
              className="btn-icon-cancel"
              // AQUÍ CAMBIAMOS: En vez de borrar directo, abrimos modal
              onClick={() => handleClickCancelar(comanda.id)}
              title="Cancelar pedido"
              style={{
                marginLeft: "5px",
                background: "none",
                border: "2px solid #dc3545",
                color: "#dc3545",
                borderRadius: "50%",
                width: "25px",
                height: "25px",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          ) : (
            <span
              style={{
                color: "red",
                fontWeight: "bold",
                fontSize: "0.7em",
                marginLeft: "5px",
              }}
            >
              CANCELADA
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="comandas-container">
      {/* --- MODAL PERSONALIZADO DE CONFIRMACIÓN --- */}
      {showCancelModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ textAlign: "center", maxWidth: "400px" }}
          >
            <h3 style={{ color: "#dc3545", marginTop: 0 }}>
              ⚠️ Cancelar Comanda
            </h3>
            <p style={{ fontSize: "1.1em", margin: "20px 0" }}>
              ¿Estás seguro de que quieres cancelar esta comanda?
              <br />
              <span style={{ fontSize: "0.9em", color: "#666" }}>
                Esta acción marcará la orden como cancelada.
              </span>
            </p>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginTop: "20px",
              }}
            >
              <button
                onClick={cerrarModal}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #ccc",
                  background: "white",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                No, Regresar
              </button>
              <button
                onClick={confirmarCancelacion}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  background: "#dc3545",
                  color: "white",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                }}
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="auth-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={logoSrc} alt="Logo" className="auth-logo" />
          <h1>Lavandería El Cobre Spa</h1>
        </div>
      </header>

      <main className="comandas-main">
        <div className="comandas-toolbar">
          <button onClick={handleLogout} className="btn-logout">
            CERRAR SESIÓN
          </button>

          <div
            className="filters"
            style={{ display: "flex", gap: "15px", alignItems: "center" }}
          >
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="filter-input"
            />
            <div style={{ display: "flex", gap: "5px" }}>
              <button
                onClick={() => setViewMode("todos")}
                style={getFilterButtonStyle("todos")}
              >
                TODOS
              </button>
              <button
                onClick={() => setViewMode("retiro")}
                style={getFilterButtonStyle("retiro")}
              >
                RETIRO
              </button>
              <button
                onClick={() => setViewMode("despacho")}
                style={getFilterButtonStyle("despacho")}
              >
                DESPACHO
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate("/registro-comanda")}
            className="btn-crear-comanda"
          >
            CREAR COMANDA
          </button>
        </div>

        {(viewMode === "todos" || viewMode === "retiro") && (
          <>
            <h2 style={{ marginTop: "20px", color: "#004080" }}>
              📦 COMANDAS PARA RETIRO (LOCAL)
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>N° ORDEN</th>
                    <th>CLIENTE</th>
                    <th>TIPO</th>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th>TOTAL</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!loading && comandasRetiro.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No hay comandas de Retiro.
                      </td>
                    </tr>
                  )}
                  {comandasRetiro.map((comanda) => renderFila(comanda, true))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(viewMode === "todos" || viewMode === "despacho") && (
          <>
            <h2 style={{ marginTop: "40px", color: "#d68a31" }}>
              🚚 COMANDAS PARA DESPACHO
            </h2>
            <div className="table-container" style={{ marginBottom: "50px" }}>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>N° ORDEN</th>
                    <th>CLIENTE</th>
                    <th>TIPO</th>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th>TOTAL</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        Cargando...
                      </td>
                    </tr>
                  )}
                  {!loading && comandasDespacho.length === 0 && (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No hay comandas de Despacho.
                      </td>
                    </tr>
                  )}
                  {comandasDespacho.map((comanda) =>
                    renderFila(comanda, false)
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
