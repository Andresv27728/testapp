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
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Buscando "${query}"...` }, { quoted: msg });

      const searchResults = await yts(query);
      if (!searchResults.videos.length) throw new Error("No se encontraron resultados.");

      const videoInfo = searchResults.videos[0];
      const { title, url } = videoInfo;

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontrado: *${title}*.\n\n⬇️ Descargando video...` }, { edit: waitingMsg.key });

      let videoBuffer;

      // --- Fallback System ---
      try {
        const tempFilePath = await downloadWithYtdlp(url, true); // true para video
        videoBuffer = fs.readFileSync(tempFilePath);
        fs.unlinkSync(tempFilePath);
      } catch (e1) {
        console.error("play2: yt-dlp failed:", e1.message);
        try {
            const downloadUrl = await downloadWithMaya(url, true); // true para video
            const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            videoBuffer = response.data;
        } catch (e2) {
            console.error("play2: Maya API failed:", e2.message);
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
