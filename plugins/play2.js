import yts from 'yt-search';
import axios from 'axios';

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3) usando la API 2.",

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

    try {
      const searchResult = await yts(query);
      const video = searchResult.videos[0];

      if (!video) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { edit: waitingMsg.key });
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `Procesando audio para *${video.title}*...` }, { edit: waitingMsg.key });

      const apiUrl = 'https://downloader-api-7mul.onrender.com/api/download';
      const response = await axios.post(
        apiUrl,
        { url: video.url },
        { responseType: 'json', timeout: 120000 }
      );

      // Asumiendo la estructura de la respuesta de la API.
      // Esto podría necesitar ajuste.
      const downloadUrl = response.data?.video_url || response.data?.url || response.data?.link;

      if (!downloadUrl) {
        console.error("Respuesta de la API sin URL:", response.data);
        throw new Error("La API no devolvió una URL de descarga válida.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: { url: downloadUrl },
          mimetype: 'audio/mpeg'
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en el comando play2:", error);
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      console.error("Detalle del error:", errorMessage);

      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas tardó demasiado en responder." }, { edit: waitingMsg.key, quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al procesar la solicitud de audio.`, edit: waitingMsg.key, quoted: msg });
      }
    }
  }
};

export default play2Command;
