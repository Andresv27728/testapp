import yts from 'yt-search';
import fs from 'fs';
import axios from 'axios';
import { downloadWithYtdlp, downloadWithMaya } from '../lib/downloaders.js';

let isDownloadingArtist = false; // Flag para prevenir ejecuciones concurrentes

const artistaCommand = {
  name: "artista",
  category: "descargas",
  description: "Descarga las 10 canciones más populares de un artista.",

  async execute({ sock, msg, args }) {
    if (isDownloadingArtist) {
      return sock.sendMessage(msg.key.remoteJid, { text: "⚠️ ¡Ya hay una descarga de artista en curso! Por favor, espera a que termine." }, { quoted: msg });
    }

    const artistName = args.join(' ');
    if (!artistName) {
      return sock.sendMessage(msg.key.remoteJid, { text: "💡 Debes proporcionar el nombre de un artista." }, { quoted: msg });
    }

    isDownloadingArtist = true;
    let waitingMsg;

    try {
      waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔔 Buscando las mejores canciones de *${artistName}*...` }, { quoted: msg });

      const searchUrl = `https://delirius-apiofc.vercel.app/search/searchtrack?q=${encodeURIComponent(artistName)}`;
      const searchResponse = await axios.get(searchUrl);
      const tracks = searchResponse.data;

      if (!Array.isArray(tracks) || tracks.length === 0) {
        throw new Error("No se encontraron resultados para ese artista.");
      }

      const tracksToDownload = tracks.slice(0, 10);
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Encontradas ${tracksToDownload.length} canciones. Iniciando descargas en orden...` }, { edit: waitingMsg.key });

      for (let i = 0; i < tracksToDownload.length; i++) {
        const track = tracksToDownload[i];
        const trackTitle = track.title || "Título Desconocido";
        await sock.sendMessage(msg.key.remoteJid, { text: `[${i + 1}/${tracksToDownload.length}] Descargando: *${trackTitle}*...` }, { quoted: msg });

        let audioBuffer;
        try {
          // Plan A: yt-dlp
          const tempFilePath = await downloadWithYtdlp(track.url, false);
          audioBuffer = fs.readFileSync(tempFilePath);
          fs.unlinkSync(tempFilePath);
        } catch (e1) {
          console.error(`artista: yt-dlp failed for ${trackTitle}:`, e1.message);
          try {
            // Plan B: Maya API
            const mayaUrl = await downloadWithMaya(track.url, false);
            audioBuffer = (await axios.get(mayaUrl, { responseType: 'arraybuffer' })).data;
          } catch (e2) {
            console.error(`artista: Maya API failed for ${trackTitle}:`, e2.message);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Falló la descarga de *${trackTitle}*. Saltando a la siguiente.` }, { quoted: msg });
            continue; // Saltar a la siguiente canción
          }
        }

        await sock.sendMessage(msg.key.remoteJid, { audio: audioBuffer, mimetype: 'audio/mpeg' }, { quoted: msg });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeña pausa
      }

      await sock.sendMessage(msg.key.remoteJid, { text: "✅ *Descargas Finalizadas Exitosamente.*" }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando artista:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ *Error:* ${error.message}` }, { quoted: msg });
    } finally {
      isDownloadingArtist = false; // Liberar el bloqueo
    }
  }
};

export default artistaCommand;
