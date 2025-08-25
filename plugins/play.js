import yts from 'yt-search';
import axios from 'axios';

const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3).",

  async execute({ sock, msg, args, config }) {
    if (args.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción. Ejemplo: `play Bella Ciao`" }, { quoted: msg });
      return;
    }

    const query = args.join(' ');
    let waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

    try {
      const searchResult = await yts(query);
      const video = searchResult.videos[0];

      if (!video) {
        await sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { edit: waitingMsg.key });
        return;
      }

      const videoUrl = video.url;

      // Mensaje mejorado
      await sock.sendMessage(msg.key.remoteJid, { text: `Procesando audio... (Esto puede tardar hasta 90 segundos)` }, { edit: waitingMsg.key });

      // Llamar a la API con timeout
      const apiUrl = `${config.api.ytmp3}?url=${videoUrl}`;
      const response = await axios.get(apiUrl, {
        responseType: 'json',
        timeout: 90000 // 90 segundos de timeout
      });
      const downloadUrl = response.data.resultado.url;

      if (!downloadUrl) {
        throw new Error("La API no devolvió una URL de descarga válida.");
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `Enviando audio a WhatsApp...` }, { quoted: msg });

      // Enviar el archivo de audio (sin vista previa para evitar dependencia de 'sharp')
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg'
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en el comando play:", error.message);
      // Manejo de error específico para timeout
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas tardó demasiado en responder. Por favor, intenta de nuevo más tarde." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al procesar tu solicitud de audio. La API podría estar fallando." }, { quoted: msg });
      }
    }
  }
};

export default playCommand;
