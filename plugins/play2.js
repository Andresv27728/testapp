import yts from 'yt-search';
import youtubedl from 'youtube-dl-exec';

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga un video en formato MP4.",

  async execute({ sock, msg, args }) {
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

      await sock.sendMessage(msg.key.remoteJid, { text: `Procesando video para *${video.title}*...` }, { edit: waitingMsg.key });

      // Usa youtube-dl-exec para obtener el enlace de descarga directo
      const downloadUrl = await youtubedl(video.url, {
        getUrl: true,
        format: 'best[ext=mp4][height<=720]/best[ext=mp4]'
      });

      if (!downloadUrl) {
        throw new Error("No se pudo obtener la URL de descarga del video.");
      }

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          video: { url: downloadUrl },
          mimetype: 'video/mp4',
          caption: video.title
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en el comando play2:", error);
      const errorMessage = error.message;
      console.error("Detalle del error:", errorMessage);

      if (error.stderr?.includes('proxy') || error.stderr?.includes('HTTP Error 429')) {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servicio de descarga está sobrecargado o bloqueado. Inténtalo más tarde." }, { edit: waitingMsg.key, quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: `Ocurrió un error al procesar la solicitud de video.`, edit: waitingMsg.key, quoted: msg });
      }
    }
  }
};

export default play2Command;
