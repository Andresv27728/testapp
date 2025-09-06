import yts from 'yt-search';
import fs from 'fs';
import axios from 'axios';
import { downloadWithYtdlp, downloadWithMaya } from '../lib/downloaders.js';

const play2Command = {
  name: "play2",
  category: "descargas",
  description: "Busca y descarga un video en formato MP4 usando múltiples métodos.",

  async execute({ sock, msg, args }) {
    if (args.length === 0) return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de un video." }, { quoted: msg });

    const query = args.join(' ');
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Procesando: "${query}"...` }, { quoted: msg });

      // Detectar si el query es una URL de YouTube
      const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/;
      const urlMatch = query.match(youtubeUrlRegex);

      let videoInfo;
      if (urlMatch) {
        const videoId = urlMatch[5];
        videoInfo = await yts({ videoId });
        if (!videoInfo) throw new Error("No se pudo encontrar información para la URL proporcionada.");
      } else {
        const searchResults = await yts(query);
        if (!searchResults.videos.length) throw new Error("No se encontraron resultados para la búsqueda.");
        videoInfo = searchResults.videos[0];
      }
      const { title, url } = videoInfo;

      // Verificar la duración del video
      const maxDuration = 18000; // 5 horas en segundos
      if (videoInfo.seconds > maxDuration) {
        throw new Error(`El video es demasiado largo. La duración máxima es de 5 horas.`);
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontrado: *${title}*.\n\n⬇️ Descargando video...` }, { edit: waitingMsg.key });

      let videoBuffer;

      // --- Fallback System ---
      try {
        // Plan A: Maya API
        const downloadUrl = await downloadWithMaya(url, true);
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        videoBuffer = response.data;
      } catch (e1) {
        console.error("play2: Maya API failed:", e1.message);
        try {
          // Plan B: yt-dlp
          const tempFilePath = await downloadWithYtdlp(url, true);
          videoBuffer = fs.readFileSync(tempFilePath);
          fs.unlinkSync(tempFilePath);
        } catch (e2) {
          console.error("play2: yt-dlp failed:", e2.message);
          throw new Error("Todos los métodos de descarga de video han fallado.");
        }
      }

      if (!videoBuffer) throw new Error("El buffer de video está vacío.");

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada. Enviando video...` }, { edit: waitingMsg.key });

      await sock.sendMessage(msg.key.remoteJid, { video: videoBuffer, mimetype: 'video/mp4', caption: title }, { quoted: msg });

    } catch (error) {
      console.error("Error final en play2:", error);
      const errorMsg = { text: `❌ ${error.message}` };
       if (waitingMsg) {
        await sock.sendMessage(msg.key.remoteJid, { ...errorMsg, edit: waitingMsg.key });
      } else {
        await sock.sendMessage(msg.key.remoteJid, errorMsg, { quoted: msg });
      }
    }
  }
};

export default play2Command;
