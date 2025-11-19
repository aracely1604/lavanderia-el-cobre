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

  // Solo mantenemos el estado para la FECHA
  const [filtroFecha, setFiltroFecha] = useState(() => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    return new Date(hoy.getTime() - offset * 60 * 1000)
      .toISOString()
      .split("T")[0];
  });

  useEffect(() => {
    setLoading(true);

    // Consulta básica: Trae todo ordenado por fecha
    let q = query(collection(db, "comandas"), orderBy("fechaIngreso", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const comandasList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtramos aquí solo por la fecha seleccionada
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
  }, [filtroFecha]); // Solo se vuelve a ejecutar si cambias la fecha

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleCancelar = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres cancelar esta comanda?")) {
      try {
        const comandaRef = doc(db, "comandas", id);
        await updateDoc(comandaRef, {
          estado: "Cancelada",
        });
      } catch (error) {
        console.error("Error al cancelar:", error);
        alert("Error al cancelar la comanda.");
      }
    }
  };

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
        mensaje: `Hola ${comanda.nombreCliente}, tu ropa está lista para retiro. Gracias por preferir Lavandería El Cobre.`,
      };

      // Enviar WhatsApp
      await axios.post(
        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
        payload
      );

      // Marcar como notificado en Firestore
      await updateDoc(doc(db, "comandas", comanda.id), {
        notificado: true,
        fechaNotificacion: new Date(),
      });
    } catch (err) {
      console.error("Error al enviar notificación:", err);
      alert("Error al enviar la notificación.");
    }
  };

  const handleDescargarFactura = (urlFactura) => {
    window.open(urlFactura, "_blank"); // abre el PDF en nueva pestaña
  };

  return (
    <div className="comandas-container">
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

          <div className="filters">
            {/* ÚNICO FILTRO: FECHA */}
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="filter-input"
            />
          </div>

          <button
            onClick={() => navigate("/registro-comanda")}
            className="btn-crear-comanda"
          >
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
                <th>TIPO</th>
                <th>FECHA</th>
                <th>HORA</th>
                <th>MONTO TOTAL</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    Cargando comandas...
                  </td>
                </tr>
              )}
              {!loading && comandas.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No hay comandas para esta fecha.
                  </td>
                </tr>
              )}

              {comandas.map((comanda) => {
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
                      style={{
                        cursor: "pointer",
                        opacity: isCancelada ? 0.5 : 1,
                      }}
                    >
                      👁️
                    </td>
                    <td>{comanda.numeroOrden}</td>
                    <td>{comanda.nombreCliente}</td>
                    <td>{comanda.tipoCliente}</td>
                    <td>
                      {comanda.fechaIngreso?.toDate
                        ? comanda.fechaIngreso
                            .toDate()
                            .toLocaleDateString("es-CL")
                        : "Fecha inválida"}
                    </td>
                    <td>{comanda.horaIngreso || "--:--"}</td>
                    <td
                      style={{
                        textDecoration: isCancelada ? "line-through" : "none",
                      }}
                    >
                      $
                      {new Intl.NumberFormat("es-CL").format(
                        comanda.montoTotal || 0
                      )}
                    </td>

                    <td className="actions-cell">
                      <button
                        className="btn-accion btn-descargar"
                        onClick={() =>
                          handleDescargarFactura(comanda.facturaPDF)
                        }
                        disabled={isCancelada}
                        style={{ opacity: isCancelada ? 0.5 : 1 }}
                      >
                        DESCARGAR
                      </button>

                      <button
                        className="btn-accion btn-notificar"
                        onClick={() => enviarNotificacion(comanda)}
                        disabled={comanda.notificado || isCancelada}
                        style={{
                          opacity: isCancelada
                            ? 0.5
                            : comanda.notificado
                            ? 0.6
                            : 1,
                          backgroundColor: comanda.notificado
                            ? "#28a745"
                            : "#d68a31",
                        }}
                      >
                        {comanda.notificado ? "✔ ENVIADO" : "NOTIFICAR"}
                      </button>

                      {!isCancelada ? (
                        <button
                          className="btn-icon-cancel"
                          onClick={() => handleCancelar(comanda.id)}
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
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
