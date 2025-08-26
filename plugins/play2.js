import yts from 'yt-search';
import axios from 'axios';

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga una canción en formato de video (MP4).",

  async execute({ sock, msg, args, config }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de un video." }, { quoted: msg });
    }

    const query = args.join(' ');
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Buscando "${query}"...` }, { quoted: msg });

    try {
      const searchResult = await yts(query);
      const video = searchResult.videos[0];

      if (!video) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { edit: waitingMsg.key });
      }

      const caption = `*${video.title}*\n*Autor:* ${video.author.name}`;
      await sock.sendMessage(msg.key.remoteJid, { text: `Procesando video para *${video.title}*...` }, { edit: waitingMsg.key });

      const apiUrl = `${config.api.ytmp4}?url=${video.url}`;
      const response = await axios.get(apiUrl, { timeout: 120000 });

      // Corregido para parsear la respuesta correcta de la API
      const downloadUrl = response.data?.data?.download;

      if (!downloadUrl) {
        throw new Error("La API no devolvió una URL de descarga válida.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: downloadUrl },
          mimetype: 'video/mp4',
          caption: caption
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en el comando play2:", error.message);
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas tardó demasiado en responder." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al procesar la solicitud de video." }, { quoted: msg });
      }
    }
  }
};

export default play2Command;
