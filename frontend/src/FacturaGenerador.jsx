import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default async function generarFactura({
  logoSrc,
  numeroOrden,
  fechaIngreso,
  nombreCliente,
  direccion,
  telefono,
  prendas,
  montoTotal,
  storage,
}) {
  // Crear contenedor temporal (fuera de vista)
  const factura = document.createElement("div");
  factura.style.position = "fixed";
  factura.style.top = "-9999px";
  factura.style.left = "-9999px";
  factura.style.width = "600px";
  factura.style.padding = "20px";
  factura.style.fontFamily = "Arial, sans-serif";

  factura.innerHTML = `
    <div style="border:2px solid #004080;padding:15px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <img src="${logoSrc}" width="80"/>
        <div>
          <h2 style="margin:0;color:#004080;">Lavandería El Cobre</h2>
          <p style="margin:0;">Mauricio A. Aguilera Bautista</p>
          <p style="margin:0;">R.U.T. 16.565.668-K</p>
          <p style="margin:0;">Balmaceda N°1276 - Fono: 96262665</p>
        </div>
      </div>

      <h3 style="text-align:center;border-top:2px solid #004080;border-bottom:2px solid #004080;margin-top:10px;">
        ORDEN DE TRABAJO
      </h3>
      <p><strong>No:</strong> ${numeroOrden}</p>
      <p><strong>Fecha:</strong> ${fechaIngreso}</p>
      <p><strong>Cliente:</strong> ${nombreCliente}</p>
      <p><strong>Dirección:</strong> ${direccion || "—"}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr>
            <th style="border:1px solid #004080;padding:5px;">Cant.</th>
            <th style="border:1px solid #004080;padding:5px;">Prenda</th>
            <th style="border:1px solid #004080;padding:5px;">Valor</th>
            <th style="border:1px solid #004080;padding:5px;">Detalle</th>
          </tr>
        </thead>
        <tbody>
          ${prendas
            .map(
              (p) => `
            <tr>
              <td style="border:1px solid #004080;padding:5px;text-align:center;">${p.cantidad}</td>
              <td style="border:1px solid #004080;padding:5px;">${p.nombre}</td>
              <td style="border:1px solid #004080;padding:5px;text-align:right;">$${p.valor}</td>
              <td style="border:1px solid #004080;padding:5px;">${p.detalle}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <p style="text-align:right;margin-top:10px;">
        <strong>Total:</strong> $${new Intl.NumberFormat("es-CL").format(
          montoTotal
        )}
      </p>

      <p style="text-align:center;font-size:12px;border-top:1px solid #004080;margin-top:15px;padding-top:5px;">
        Nota: Después de 30 días no se responde por trabajos no retirados.
      </p>
    </div>
  `;

  // Añadir fuera de pantalla para que html2canvas lo lea
  document.body.appendChild(factura);

  const canvas = await html2canvas(factura);
  const imgData = canvas.toDataURL("image/png");

  // Crear PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  // Subir a Firebase Storage
  const blob = pdf.output("blob");
  const storageRef = ref(storage, `facturas/${numeroOrden}.pdf`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);

  // Limpiar el DOM (remueve el HTML temporal)
  document.body.removeChild(factura);

  return url;
}
