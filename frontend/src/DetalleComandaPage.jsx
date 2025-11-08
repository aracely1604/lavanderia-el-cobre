import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './RegistroComanda.css'; // Reutilizamos estilos por ahora

export default function DetalleComandaPage() {
  const { id } = useParams(); // Captura el ID de la URL
  const navigate = useNavigate();
  const [comanda, setComanda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComanda = async () => {
      try {
        const docRef = doc(db, "comandas", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setComanda({ id: docSnap.id, ...docSnap.data() });
        } else {
          alert("No se encontró la comanda");
          navigate('/comandas');
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComanda();
  }, [id, navigate]);

  if (loading) return <div>Cargando detalle...</div>;
  if (!comanda) return null;

  return (
    <div className="registro-container">
      <button className="btn-back" onClick={() => navigate('/comandas')}>REGRESAR</button>
      <h2>DETALLE DE COMANDA: {comanda.numeroOrden}</h2>
      
      {/* --- AQUÍ SE DEBE DAR EL DISEÑO --- */}
      <p><strong>Cliente:</strong> {comanda.nombreCliente}</p>
      <p><strong>Fecha:</strong> {comanda.fechaIngreso?.toDate().toLocaleDateString('es-CL')}</p>
      
      <h3>Prendas</h3>
      <ul>
        {comanda.prendas?.map((item, index) => (
          <li key={index}>{item.cantidad}x {item.nombre} - ${item.valor}</li>
        ))}
      </ul>
       <h3>Total: ${comanda.montoTotal}</h3>
       
       {/* Mostrar fotos si existen */}
       {comanda.fotos && comanda.fotos.length > 0 && (
         <div>
           <h4>Fotos adjuntas:</h4>
           <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
             {comanda.fotos.map((url, index) => (
               <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                 <img src={url} alt="Prenda" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}/>
               </a>
             ))}
           </div>
         </div>
       )}

    </div>
  );
}