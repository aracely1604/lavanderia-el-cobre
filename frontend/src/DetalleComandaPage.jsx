import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import './DetalleComandaPage.css';

export default function DetalleComandaPage() {
  const { id } = useParams(); // Captura el ID de la URL
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
    <div className="detalle-container">
      <button className="btn-back" onClick={() => navigate('/comandas')}>REGRESAR</button>
      <h2 className='title-detalle'>DETALLE DE COMANDA: {comanda.numeroOrden}</h2>
      
      {/* --- AQUÍ SE DEBE DAR EL DISEÑO --- */}
      <p><strong>Cliente:</strong> {comanda.nombreCliente}</p>
      <p><strong>Fecha:</strong> {comanda.fechaIngreso?.toDate().toLocaleDateString('es-CL')}</p>
      

      <h3>Prendas</h3>
      <table className='tabla-prendas'>
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Artículo</th>
            <th className="derecha">P. Unitario</th>
          </tr>
        </thead>
        
        <tbody>
          {comanda.prendas?.map((item, index) => {
            return (
              <tr key={index}>
                <td>{item.cantidad}x</td>
                <td className="nombre-prenda">
                  <span className="nombre-texto">{item.nombre}</span>
                </td>
                <td className="derecha">{(item.valor)}</td>
              </tr>
            );
          })}

        </tbody>
      </table>

      
       
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