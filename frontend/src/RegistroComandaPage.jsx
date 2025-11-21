import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { db, storage } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './RegistroComanda.css';
import logoSrc from './assets/Logo lavanderia.jpeg';
import generarFactura from "./FacturaGenerador";
// Importamos el módulo de buscar cliente que faltaba
import ModuloClienteRecientes from "./ModuloClienteReciente";

export default function RegistroComandaPage() {
    const navigate = useNavigate();

    // --- CONSTANTES ---
    const PORCENTAJE_EXPRESS = 0.50; 
    const COSTO_DESPACHO = 1500;

    const generarNumeroOrden = () => {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        return `ORD-${dia}${mes}-${random}`;
    };

    const getFechaLocal = () => {
        const hoy = new Date();
        const offset = hoy.getTimezoneOffset();
        const fechaLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
        return fechaLocal.toISOString().split('T')[0];
    };

    // --- ESTADOS ---
    const [numeroOrden, setNumeroOrden] = useState('');
    const [fechaIngreso, setFechaIngreso] = useState(getFechaLocal());
    const [nombreCliente, setNombreCliente] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [tipoCliente, setTipoCliente] = useState('Particular');
    const [servicioExpress, setServicioExpress] = useState(false);
    
    const [numeroBoucher, setNumeroBoucher] = useState('');
    const [tipoEntrega, setTipoEntrega] = useState('Retiro'); 

    const [prendas, setPrendas] = useState([{ cantidad: 1, nombre: '', valor: 0, detalle: '' }]);
    const [montoSubtotal, setMontoSubtotal] = useState(0);
    const [montoTotal, setMontoTotal] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados de Modales
    const [showModal, setShowModal] = useState(false); // Fotos
    const [showClientSearchModal, setShowClientSearchModal] = useState(false); // Buscar Cliente
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [fotos, setFotos] = useState([]);

    useEffect(() => {
        setNumeroOrden(generarNumeroOrden());
    }, []);

    // --- CÁLCULO DE TOTALES ---
    useEffect(() => {
        const subtotal = prendas.reduce((sum, prenda) => {
            const valorPrenda = parseFloat(prenda.valor) || 0;
             const cantidad = parseInt(prenda.cantidad) || 1;
            return sum + (valorPrenda * cantidad);
        }, 0);
        setMontoSubtotal(subtotal);

        let totalFinal = subtotal;

        if (servicioExpress) {
            totalFinal = subtotal * (1 + PORCENTAJE_EXPRESS);
        }

        if (tipoEntrega === 'Despacho') {
            totalFinal += COSTO_DESPACHO;
        }

        setMontoTotal(Math.round(totalFinal));
    }, [prendas, servicioExpress, tipoEntrega]);

    const handlePrendaChange = (index, field, value) => {
        const newPrendas = [...prendas];
        newPrendas[index][field] = value;
        setPrendas(newPrendas);
    };
    const addPrendaRow = () => setPrendas([...prendas, { cantidad: 1, nombre: '', valor: '', detalle: '' }]);
    const removePrendaRow = (index) => { if (prendas.length > 1) setPrendas(prendas.filter((_, i) => i !== index)); };

    // --- Lógica Buscar Cliente ---
    const handleClientFound = (phone, clientData) => {
        setTelefono(phone);
        setNombreCliente(clientData.nombreCliente || "");
        setDireccion(clientData.direccion || "");
        setTipoCliente(clientData.tipoCliente || "Particular");
        // alert(`Cliente encontrado: ${clientData.nombreCliente}`);
    };

    // --- Guardar ---
    const handleGuardar = async (enviarWhatsapp = true) => {
        if (!nombreCliente || !telefono) {
            alert('Falta nombre o teléfono.');
            return;
        }
        setIsSubmitting(true);

        try {
            const fotosURLs = [];
            if (fotos.length > 0) {
                const uploadPromises = fotos.map(async (fotoFile) => {
                    const storageRef = ref(storage, `comandas_2/${numeroOrden}/${fotoFile.name}`);
                    await uploadBytes(storageRef, fotoFile);
                    return await getDownloadURL(storageRef);
                });
                const urls = await Promise.all(uploadPromises);
                fotosURLs.push(...urls);
            }

            let urlFactura = "";
            try {
                urlFactura = await generarFactura({
                   logoSrc, numeroOrden, fechaIngreso, nombreCliente, direccion, telefono, tipoCliente, prendas, montoTotal, storage,
                   numeroBoucher, tipoEntrega, servicioExpress
                });
            } catch (e) { console.warn("No se generó PDF automático"); }

            const ahora = new Date();
            const horaIngreso = ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

            await addDoc(collection(db, 'comandas_2'), {
                numeroOrden,
                fechaIngreso: Timestamp.fromDate(new Date(fechaIngreso + 'T12:00:00')),
                horaIngreso,
                nombreCliente,
                direccion,
                telefono,
                tipoCliente,
                servicioExpress,
                tipoEntrega,
                numeroBoucher,
                prendas,
                montoSubtotal,
                montoTotal,
                fotos: fotosURLs,
                facturaPDF: urlFactura,
                estado: "Activa"
            });

            if (enviarWhatsapp && urlFactura) {
                try {
                    await axios.post(
                        "https://us-central1-lavanderia-el-cobre-app.cloudfunctions.net/enviarWhatsappFactura",
                        {
                            numero: telefono,
                            enlace: urlFactura,
                            mensaje: `Hola ${nombreCliente}, Orden ${numeroOrden} recibida. Comprobante: ${urlFactura}`
                        }
                    );
            } catch (err) { console.error("Error WhatsApp", err); }
            }

            // 5. MOSTRAR ALERTA BONITA (MODAL)
            setShowSuccessModal(true);
            
            navigate('/comandas');
        } catch (error) {
            console.error("Error:", error);
            alert('Error al guardar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        const newFotos = files.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
        setFotos([...fotos, ...newFotos]);
    };

    return (
        <div className="registro-container">
            {/* Modal Buscar Cliente */}
            <ModuloClienteRecientes
                isOpen={showClientSearchModal}
                onClose={() => setShowClientSearchModal(false)}
                onClientFound={handleClientFound}
            />

            {/* Modal Fotos */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">Adjuntar Fotos</h3>
                        <div className="file-input-container" onClick={() => document.getElementById('fileInput').click()}>
                            <span>📂 Seleccionar fotos</span>
                            <input id="fileInput" type="file" multiple accept="image/*" onChange={handleFileSelect} style={{display: 'none'}} />
                        </div>
                        <div className="fotos-grid">
                            {fotos.map((f, i) => <img key={i} src={f.preview} className="foto-preview" alt="p" />)}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-modal-cancel" onClick={() => { setFotos([]); setShowModal(false); }}>CANCELAR</button>
                            <button className="btn-modal-confirm" onClick={() => setShowModal(false)}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER IGUAL A LA IMAGEN */}
            <header className="registro-header">
                <div className="registro-header-left">
                    <img src={logoSrc} alt="Logo" className="registro-header-logo" />
                    <span className="registro-header-title">Lavandería El Cobre Spa</span>
                </div>
                <div className="registro-header-actions">
                    <button className="btn-header btn-adjuntar" onClick={() => setShowModal(true)}>
                        📎 ADJUNTAR FOTO
                    </button>
                    
                    <button className="btn-header btn-guardar" onClick={() => handleGuardar(true)} disabled={isSubmitting}>
                         💾 GUARDAR COMANDA
                    </button>

                    <button 
                        className="btn-header btn-buscar-cliente" 
                        onClick={() => setShowClientSearchModal(true)}
                    >
                        🔎 BUSCAR CLIENTE
                    </button>
                </div>
            </header>

            <div className="btn-back-container">
                <button className="btn-back" onClick={() => navigate('/comandas')}>REGRESAR AL LISTADO</button>
            </div>

            <h2 className="registro-title">REGISTRO DE COMANDA</h2>

            <form className="registro-form" onSubmit={e => e.preventDefault()}>
                
                {/* FILA 1: Orden, Fecha, Boucher (IGUAL A LA IMAGEN) */}
                <div className="form-row three-col">
                    <div className="form-group">
                        <label>NÚMERO ORDEN (AUTO)</label>
                        <input type="text" value={numeroOrden} readOnly style={{backgroundColor: '#f0f0f0'}} />
                    </div>
                    <div className="form-group">
                        <label>FECHA DE INGRESO</label>
                        <input type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>N° BOUCHER</label>
                        <input type="text" value={numeroBoucher} onChange={e => setNumeroBoucher(e.target.value)} placeholder="Ingrese N° de Boucher" />
                    </div>
                </div>

                {/* FILA 2: Nombre y Teléfono */}
                <div className="form-row">
                    <div className="form-group" style={{flex: 2}}>
                        <label>NOMBRE CLIENTE *</label>
                        <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Ej: Juan Pérez" required />
                    </div>
                    <div className="form-group">
                        <label>TELÉFONO *</label>
                        <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+569 1234 5678" required />
                    </div>
                </div>

                {/* FILA 3: Dirección */}
                <div className="form-row">
                    <div className="form-group">
                        <label>DIRECCIÓN</label>
                        <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, Número, Comuna" />
                    </div>
                </div>

                {/* FILA 4: Opciones (Tipo, Express, Retiro, Despacho) IGUAL A LA IMAGEN */}
                <div className="form-row options-row">
                    <div className="form-group">
                        <label>TIPO DE CLIENTE</label>
                        <select value={tipoCliente} onChange={e => setTipoCliente(e.target.value)}>
                            <option value="Particular">Particular</option>
                        </select>
                    </div>

                    {/* SERVICIO EXPRESS (Recuadro) */}
                    <div className="option-card" onClick={() => setServicioExpress(!servicioExpress)}>
                         <input type="checkbox" checked={servicioExpress} readOnly style={{marginRight: '10px'}} />
                         <span>SERVICIO EXPRESS (+50%)</span>
                    </div>

                    {/* RETIRO (Recuadro) */}
                    <div className="option-card" onClick={() => setTipoEntrega('Retiro')}>
                        <input type="radio" checked={tipoEntrega === 'Retiro'} readOnly style={{marginRight: '10px'}} />
                        <span>RETIRO LOCAL</span>
                    </div>

                    {/* DESPACHO (Recuadro) */}
                    <div className="option-card" onClick={() => setTipoEntrega('Despacho')}>
                        <input type="radio" checked={tipoEntrega === 'Despacho'} readOnly style={{marginRight: '10px'}} />
                        <span>DESPACHO (+${COSTO_DESPACHO})</span>
                    </div>
                </div>

                <table className="prendas-table">
                    <thead><tr><th width="10%">CANT.</th><th width="30%">PRENDA</th><th width="20%">VALOR UNIT.</th><th width="30%">DETALLE</th><th width="10%"></th></tr></thead>
                    <tbody>
                        {prendas.map((item, i) => (
                            <tr key={i}>
                                <td><input type="number" min="1" value={item.cantidad} onChange={e => handlePrendaChange(i, 'cantidad', e.target.value)} /></td>
                                <td><input type="text" value={item.nombre} onChange={e => handlePrendaChange(i, 'nombre', e.target.value)} placeholder="Ej: Pantalón" /></td>
                                <td><input type="number" min="0" value={item.valor} onChange={e => handlePrendaChange(i, 'valor', e.target.value)} placeholder="$" /></td>
                                <td><input type="text" value={item.detalle} onChange={e => handlePrendaChange(i, 'detalle', e.target.value)} placeholder="Mancha, rotura..." /></td>
                                <td style={{textAlign:'center'}}>{prendas.length>1 && <button className="btn-icon-remove" onClick={() => removePrendaRow(i)}>✕</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button className="add-item-btn" onClick={addPrendaRow}>+ Añadir otra prenda</button>

                {fotos.length > 0 && (
                    <div className="fotos-adjuntas-section">
                         <div className="fotos-adjuntas-title">📸 {fotos.length} FOTOS:</div>
                         <div className="fotos-grid" style={{justifyContent:'flex-start'}}>
                            {fotos.map((f,i) => <img key={i} src={f.preview} className="foto-preview" alt="" />)}
                         </div>
                    </div>
                )}

                <div className="monto-total-container">
                    <div style={{textAlign: 'right'}}>
                        <div className="monto-total">
                            <span className="monto-label">MONTO TOTAL A PAGAR:</span>
                            ${new Intl.NumberFormat('es-CL').format(montoTotal)}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
