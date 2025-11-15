import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // 👈 nuevo
import { db, storage } from "./firebaseConfig";
import { 
    collection, 
    addDoc, 
    Timestamp, 
    query, 
    where, 
    getDocs, 
    limit 
} from "firebase/firestore";
// import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./RegistroComanda.css";
import logoSrc from "./assets/Logo lavanderia.jpeg";
import generarFactura from "./FacturaGenerador";
import ModuloClienteRecientes from "./ModuloClienteReciente";

export default function RegistroComandaPage() {
  const navigate = useNavigate();

  const generarNumeroOrden = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${dia}${mes}-${random}`;
  };

  const getFechaLocal = () => {
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const fechaLocal = new Date(hoy.getTime() - offset * 60 * 1000);
    return fechaLocal.toISOString().split("T")[0];
  };

  // --- Estados ---
  const [numeroOrden, setNumeroOrden] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState(getFechaLocal());
  const [nombreCliente, setNombreCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoCliente, setTipoCliente] = useState("Particular");
  const [servicioExpress, setServicioExpress] = useState(false);
  const [numeroBoucher, setNumeroBoucher] = useState('');
  const [prendas, setPrendas] = useState([
    { cantidad: 1, nombre: "", valor: "", detalle: "" },
  ]);
  const [montoSubtotal, setMontoSubtotal] = useState(0);
  const [montoTotal, setMontoTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [showClientSearchModal, setShowClientSearchModal] = useState(false);


  const PORCENTAJE_EXPRESS = 0.5;

  useEffect(() => {
    setNumeroOrden(generarNumeroOrden());
  }, []);

  useEffect(() => {
    const subtotal = prendas.reduce((sum, prenda) => {
      const valorPrenda = parseFloat(prenda.valor) || 0;
      const cantidad = parseInt(prenda.cantidad) || 1;
      return sum + valorPrenda * cantidad;
    }, 0);
    setMontoSubtotal(subtotal);
    let totalFinal = subtotal;
    if (servicioExpress) {
      totalFinal = subtotal * (1 + PORCENTAJE_EXPRESS);
    }
    setMontoTotal(Math.round(totalFinal));
  }, [prendas, servicioExpress]);

  const handlePrendaChange = (index, field, value) => {
    const newPrendas = [...prendas];
    newPrendas[index][field] = value;
    setPrendas(newPrendas);
  };

  const addPrendaRow = () =>
    setPrendas([
      ...prendas,
      { cantidad: 1, nombre: "", valor: "", detalle: "" },
    ]);

  const removePrendaRow = (index) => {
    if (prendas.length > 1) setPrendas(prendas.filter((_, i) => i !== index));
  };

  const handleClientFound = (phone, clientData) => {
      setTelefono(phone); // Actualiza el teléfono con el valor buscado
      setNombreCliente(clientData.nombreCliente || ''); 
      setDireccion(clientData.direccion || ''); 
      setTipoCliente(clientData.tipoCliente || 'Particular');
      alert(`Cliente encontrado: ${clientData.nombreCliente}. Datos cargados.`);
  };

  // --- Subir fotos y guardar datos ---
  const handleGuardar = async (enviarWhatsapp = false) => {
    if (!nombreCliente || !telefono) {
      alert("Falta el nombre del cliente o el teléfono.");
      return;
    }
    setIsSubmitting(true);

    try {
      // Subir fotos
      const fotosURLs = [];
      if (fotos.length > 0) {
        const uploadPromises = fotos.map(async (fotoFile) => {
          const storageRef = ref(
            storage,
            `comandas/${numeroOrden}/${fotoFile.name}`
          );
          await uploadBytes(storageRef, fotoFile);
          return await getDownloadURL(storageRef);
        });
        const urls = await Promise.all(uploadPromises);
        fotosURLs.push(...urls);
      }

      // Generar factura PDF y subirla
      const urlFactura = await generarFactura({
        logoSrc,
        numeroOrden,
        fechaIngreso,
        nombreCliente,
        direccion,
        telefono,
        prendas,
        montoTotal,
        storage,
      });

      const ahora = new Date();
            const horaIngreso = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

      // Guardar en Firestore
      await addDoc(collection(db, "comandas"), {
        numeroOrden,
        fechaIngreso: Timestamp.fromDate(new Date(fechaIngreso + "T12:00:00")),
        horaIngreso,
        numeroBoucher,
        nombreCliente,
        direccion,
        telefono,
        tipoCliente,
        servicioExpress,
        prendas,
        montoSubtotal,
        montoTotal,
        fotos: fotosURLs,
        facturaPDF: urlFactura, // Se guarda el enlace de la factura
      });

      // Enviar WhatsApp
      if (enviarWhatsapp) {
        await axios.post(
          "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
          {
            numero: telefono,
            enlace: urlFactura,
            mensaje: `Hola ${nombreCliente} , tu factura está lista. Puedes descargarla aquí:\n${urlFactura}\n\nGracias por preferir Lavandería El Cobre`,
          }
        );
        alert(" Comanda guardada y mensaje enviado por WhatsApp");
      } else {
        alert(" Comanda guardada exitosamente.");
      }

      navigate("/comandas");
    } catch (error) {
      console.error("Error:", error);
      alert(" Error al guardar o enviar. Revisa la consola.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Generar factura (solo vista previa) ---
  const handleGenerarFactura = async () => {
    try {
      const urlFactura = await generarFactura({
        logoSrc,
        numeroOrden,
        fechaIngreso,
        nombreCliente,
        direccion,
        telefono,
        prendas,
        montoTotal,
        storage,
      });
      window.open(urlFactura, "_blank");
    } catch (error) {
      console.error("Error al generar factura:", error);
      alert(" Error al generar la factura.");
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const newFotos = files.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );
    setFotos([...fotos, ...newFotos]);
  };

  return (
    <div className="registro-container">
      <ModuloClienteRecientes
          isOpen={showClientSearchModal}
          onClose={() => setShowClientSearchModal(false)} // Cierra el modal
          onClientFound={handleClientFound} // Carga los datos
      />
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Adjuntar Fotos de Prendas</h3>
            <div
              className="file-input-container"
              onClick={() => document.getElementById("fileInput").click()}
            >
              <span className="file-input-label">
                📂 Haz clic aquí para seleccionar fotos
              </span>
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
            <div className="fotos-grid">
              {fotos.map((foto, index) => (
                <img
                  key={index}
                  src={foto.preview}
                  alt="preview"
                  className="foto-preview"
                />
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => {
                  setFotos([]);
                  setShowModal(false);
                }}
              >
                CANCELAR
              </button>
              <button
                className="btn-modal-confirm"
                onClick={() => setShowModal(false)}
              >
                CONFIRMAR ({fotos.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="registro-header">
        <div className="registro-header-left">
          <img src={logoSrc} alt="Logo" className="registro-header-logo" />
          <span className="registro-header-title">Lavandería El Cobre Spa</span>
        </div>
        <div className="registro-header-actions">
          <button
            className="btn-header btn-adjuntar"
            type="button"
            onClick={() => setShowModal(true)}
          >
            📎 Adjuntar Foto {fotos.length > 0 && `(${fotos.length})`}
          </button>
          <button
            className="btn-header btn-factura"
            type="button"
            onClick={handleGenerarFactura}
          >
            🧾 Generar Factura
          </button>
          <button
            className="btn-header btn-guardar"
            onClick={() => handleGuardar(true)} // ahora siempre guarda y envía
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "💾 Guardar Comanda"}
          </button>
          <button
            className="btn-header btn-buscar-cliente"
            type="button"
            onClick={() => setShowClientSearchModal(true)} // Abre el modal
            style={{ backgroundColor: '#007bff', color: 'white' }}
          >
            🔎 Buscar Cliente
          </button>
        </div>
      </header>

      <div className="btn-back-container">
        <button className="btn-back" onClick={() => navigate("/comandas")}>
          REGRESAR AL LISTADO
        </button>
      </div>

      <h2 className="registro-title">REGISTRO DE COMANDA</h2>

      <form className="registro-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group">
            <label>NÚMERO ORDEN (AUTO)</label>
            <input type="text" value={numeroOrden} readOnly />
          </div>
          <div className="form-group">
            <label>FECHA DE INGRESO</label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
            />
          </div>
          <div className="form-row">
                    <div className="form-group">
                        <label>N° BOUCHER </label>
                        <input 
                            type="text" 
                            value={numeroBoucher} 
                            onChange={(e) => setNumeroBoucher(e.target.value)} 
                            placeholder="Ingrese N° de Boucher" 
                        />
                    </div>
                </div>
                {/* ------------------------ */}
        </div>
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>NOMBRE CLIENTE *</label>
            {/* PLACEHOLDER AGREGADO */}
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>
          <div className="form-group">
            <label>TELÉFONO *</label>
            {/* PLACEHOLDER AGREGADO */}
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+569 1234 5678"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>DIRECCIÓN</label>
            {/* PLACEHOLDER AGREGADO */}
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, Número, Comuna"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>TIPO DE CLIENTE</label>
            <select
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
            >
              <option value="Particular">Particular</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="express"
              checked={servicioExpress}
              onChange={(e) => setServicioExpress(e.target.checked)}
            />
            <label htmlFor="express">
              SERVICIO EXPRESS (+{PORCENTAJE_EXPRESS * 100}%)
            </label>
          </div>
        </div>

        <table className="prendas-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>CANT.</th>
              <th style={{ width: "30%" }}>PRENDA</th>
              <th style={{ width: "20%" }}>VALOR UNIT.</th>
              <th style={{ width: "30%" }}>DETALLE</th>
              <th style={{ width: "10%" }}></th>
            </tr>
          </thead>
          <tbody>
            {prendas.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) =>
                      handlePrendaChange(index, "cantidad", e.target.value)
                    }
                  />
                </td>
                {/* PLACEHOLDER AGREGADO */}
                <td>
                  <input
                    type="text"
                    placeholder="Ej: Pantalón"
                    value={item.nombre}
                    onChange={(e) =>
                      handlePrendaChange(index, "nombre", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    placeholder="$"
                    value={item.valor}
                    onChange={(e) =>
                      handlePrendaChange(index, "valor", e.target.value)
                    }
                  />
                </td>
                {/* PLACEHOLDER AGREGADO */}
                <td>
                  <input
                    type="text"
                    placeholder="Mancha, rotura..."
                    value={item.detalle}
                    onChange={(e) =>
                      handlePrendaChange(index, "detalle", e.target.value)
                    }
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  {prendas.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-remove"
                      onClick={() => removePrendaRow(index)}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="add-item-btn" onClick={addPrendaRow}>
          + Añadir otra prenda
        </button>

        {fotos.length > 0 && (
          <div className="fotos-adjuntas-section">
            <div className="fotos-adjuntas-title">
              📸 FOTOS ADJUNTAS ({fotos.length}):
            </div>
            <div
              className="fotos-grid"
              style={{ justifyContent: "flex-start" }}
            >
              {fotos.map((foto, index) => (
                <img
                  key={index}
                  src={foto.preview}
                  alt="adjunto"
                  className="foto-preview"
                />
              ))}
            </div>
          </div>
        )}

        <div className="monto-total-container">
          <div style={{ textAlign: "right" }}>
            {servicioExpress && (
              <div
                style={{
                  color: "#666",
                  fontSize: "0.9em",
                  marginBottom: "5px",
                }}
              >
                Subtotal: $
                {new Intl.NumberFormat("es-CL").format(montoSubtotal)} <br />+
                Recargo Express ({PORCENTAJE_EXPRESS * 100}%)
              </div>
            )}
            <div className="monto-total">
              <span className="monto-label">MONTO TOTAL A PAGAR:</span>$
              {new Intl.NumberFormat("es-CL").format(montoTotal)}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
