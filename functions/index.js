const functions = require("firebase-functions");
const twilio = require("twilio");
const cors = require("cors")({ origin: true });
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

exports.enviarWhatsappFactura = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { numero, enlace, mensaje } = req.body;

      if (!numero || !enlace) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const fromNumber = "whatsapp:+14155238886"; // Numero de Twilio

      await client.messages.create({
        body: mensaje,
        from: fromNumber,
        to: `whatsapp:${numero}`,
      });

      console.log("✅ Mensaje enviado correctamente a", numero);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("❌ Error al enviar WhatsApp:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});
