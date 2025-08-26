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
      const apiUrl = `https://api.dreaded.site/api/facebook?url=${encodeURIComponent(url)}`;

      // Pedimos la respuesta como un buffer de datos binarios
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      });

      const videoBuffer = Buffer.from(response.data, 'binary');

      if (!videoBuffer || videoBuffer.length < 1000) { // Chequeo simple de que el buffer no esté vacío
        throw new Error("La API no devolvió un video válido.");
      }

      await sock.sendMessage(msg.key.remoteJid, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: "Aquí tienes tu video de Facebook."
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Video de Facebook enviado.`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando facebook:", error.message);
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas de Facebook tardó demasiado en responder." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo descargar el video. El enlace podría ser inválido, privado o la API estar fallando." }, { quoted: msg });
      }
    }
  }
};

export default facebookCommand;
