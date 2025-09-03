import { exec } from 'child_process';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// --- Método 1: yt-dlp (El más robusto) ---
async function downloadWithYtdlp(url) {
  const tempDir = './temp';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const tempPath = path.join(tempDir, `${Date.now()}.mp3`);
  const command = `yt-dlp -o "${tempPath}" -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 "${url}"`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // Si yt-dlp no está instalado, el error puede contener 'not found' o 'no se reconoce'
        if (stderr.includes('not found') || stderr.includes('no se reconoce')) {
            return reject(new Error('yt-dlp no está instalado o no se encuentra en el PATH.'));
        }
        return reject(error);
      }
      if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        return reject(new Error('El archivo descargado está vacío o no existe.'));
      }
      resolve(tempPath);
    });
  });
}

// --- Método 2: ddownr (API de oceansaver.in) ---
async function downloadWithDdownr(url) {
    const downloadConfig = {
        method: "GET",
        url: `https://p.oceansaver.in/ajax/download.php?format=mp3&url=${encodeURIComponent(url)}`,
        headers: { "User-Agent": "Mozilla/5.0" }
    };
    const downloadResponse = await axios.request(downloadConfig);

    if (!downloadResponse.data?.success || !downloadResponse.data.id) {
        throw new Error("ddownr API: No se pudo iniciar la conversión.");
    }

    const progressConfig = {
        method: "GET",
        url: `https://p.oceansaver.in/ajax/progress.php?id=${downloadResponse.data.id}`,
        headers: { "User-Agent": "Mozilla/5.0" }
    };

    for (let i = 0; i < 20; i++) { // Intentar por un máximo de 100 segundos (20 * 5s)
        const progressResponse = await axios.request(progressConfig);
        if (progressResponse.data?.success && progressResponse.data.progress === 1000) {
            return progressResponse.data.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error("ddownr API: El tiempo de conversión ha expirado.");
}


const playCommand = {
  name: "play",
  category: "descargas",
  description: "Busca y descarga una canción en formato de audio (MP3) usando múltiples métodos.",

  async execute({ sock, msg, args }) {
    if (args.length === 0) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona el nombre de una canción." }, { quoted: msg });
    }

    const query = args.join(' ');
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🎶 Buscando "${query}"...` }, { quoted: msg });

      const searchResults = await yts(query);
      if (!searchResults.videos.length) throw new Error("No se encontraron resultados para tu búsqueda.");

      const videoInfo = searchResults.videos[0];
      const { title, url } = videoInfo;

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontrado: *${title}*.\n\n⬇️ Intentando descargar...` }, { edit: waitingMsg.key });

      let audioBuffer;
      let source;

      // --- Sistema de Fallbacks ---
      try {
        // console.log("Intentando con el Método 1: yt-dlp");
        const tempFilePath = await downloadWithYtdlp(url);
        audioBuffer = fs.readFileSync(tempFilePath);
        fs.unlinkSync(tempFilePath); // Limpiar archivo temporal
      } catch (e1) {
        // console.error("Método 1 (yt-dlp) falló:", e1.message);
        // await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Método 1 falló. Intentando con el Método 2...` }, { quoted: msg });

        try {
            // console.log("Intentando con el Método 2: ddownr");
            const downloadUrl = await downloadWithDdownr(url);
            const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            audioBuffer = response.data;
            source = "ddownr API";
        } catch (e2) {
            console.error("Método 2 (ddownr) falló:", e2.message);
            throw new Error("Todos los métodos de descarga han fallado.");
        }
      }

      if (!audioBuffer) {
        throw new Error("El buffer de audio está vacío después de todos los intentos.");
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Descarga completada. Enviando archivos...` }, { edit: waitingMsg.key });

      // Enviar como audio reproducible
      await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });

      // Enviar como documento
      await sock.sendMessage(msg.key.remoteJid, { document: audioBuffer, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: msg });

    } catch (error) {
      console.error("Error final en el comando play:", error);
      const errorMsg = { text: `❌ ${error.message}` };
       if (waitingMsg) {
        await sock.sendMessage(msg.key.remoteJid, { ...errorMsg, edit: waitingMsg.key });
      } else {
        await sock.sendMessage(msg.key.remoteJid, errorMsg, { quoted: msg });
      }
    }
  }
};

export default playCommand;
