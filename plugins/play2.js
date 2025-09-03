import { exec } from 'child_process';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- Helper Functions for Downloading ---

async function downloadWithYtdlp(url) {
  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, `${Date.now()}.mp4`);
  const command = `yt-dlp -o "${tempPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 "${url}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) return reject(new Error('yt-dlp downloaded an empty file.'));
      resolve(tempPath);
    });
  });
}

async function downloadWithDdownr(url) {
    const res = await axios.get(`https://p.oceansaver.in/ajax/download.php?format=720&url=${encodeURIComponent(url)}`);
    if (!res.data?.success || !res.data.id) throw new Error("ddownr API: Failed to initiate conversion.");

    for (let i = 0; i < 20; i++) {
        const prog = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${res.data.id}`);
        if (prog.data?.success && prog.data.progress === 1000) {
            const file = await axios.get(prog.data.download_url, { responseType: 'arraybuffer' });
            return file.data;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error("ddownr API: Conversion timed out.");
}

async function downloadWithApi(apiUrl) {
    const response = await axios.get(apiUrl);
    const result = response.data;
    const downloadUrl = result?.result?.downloadUrl || result?.result?.url || result?.data?.dl || result?.dl;
    if (!downloadUrl) throw new Error(`API ${apiUrl} did not return a valid download link.`);

    const file = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    return file.data;
}


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
        const tempFilePath = await downloadWithYtdlp(url);
        videoBuffer = fs.readFileSync(tempFilePath);
        fs.unlinkSync(tempFilePath);
      } catch (e1) {
        console.error("yt-dlp failed:", e1.message);
        try {
          videoBuffer = await downloadWithDdownr(url);
        } catch (e2) {
          console.error("ddownr failed:", e2.message);
          const fallbackApis = [
            `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
            `https://mahiru-shiina.vercel.app/download/ytmp4?url=${encodeURIComponent(url)}`,
            `https://api.agungny.my.id/api/youtube-video?url=${encodeURIComponent(url)}`
          ];
          let success = false;
          for (const apiUrl of fallbackApis) {
            try {
              videoBuffer = await downloadWithApi(apiUrl);
              success = true;
              break;
            } catch (e3) {
              console.error(`API ${apiUrl} failed:`, e3.message);
            }
          }
          if (!success) throw new Error("Todos los métodos de descarga de video han fallado.");
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
