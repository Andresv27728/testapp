import axios from 'axios';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb"],

  async execute({ sock, msg, args }) {
    const url = args[0];

    if (!url || !(url.includes('facebook.com') || url.includes('fb.watch'))) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de Facebook." }, { quoted: msg });
      return;
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Procesando enlace de Facebook...` }, { quoted: msg });

    try {
      // Usamos la API proporcionada por el usuario
      const apiUrl = `https://api.dreaded.site/api/facebook?url=${encodeURIComponent(url)}`;

      const response = await axios.get(apiUrl, {
        timeout: 120000 // 2 minutos de timeout
      });

      const data = response.data;

      // Asumimos que la respuesta tiene una estructura como { "url": "..." } o similar
      // Es importante inspeccionar la respuesta real si esto falla.
      const downloadUrl = data.url || data.link || data.download;

      if (!downloadUrl) {
        throw new Error("La respuesta de la API no contiene un enlace de descarga válido.");
      }

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: downloadUrl },
        mimetype: 'video/mp4',
        caption: data.title || "Video de Facebook"
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Video de Facebook enviado.`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando facebook:", error.message);
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas de Facebook tardó demasiado en responder." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo descargar el video de Facebook. El enlace podría ser inválido, privado o la API estar fallando." }, { quoted: msg });
      }
    }
  }
};

export default facebookCommand;
