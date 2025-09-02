import axios from 'axios';

const spotifyCommand = {
  name: "spotify",
  category: "descargas",
  description: "Descarga una canción desde un enlace de Spotify.",
  aliases: ["sp", "spotifydl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/(track|playlist|album)\/[a-zA-Z0-9]+/;

    if (!url || !spotifyRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "🚩 Por favor, ingresa un enlace válido de Spotify (Track, Playlist o Álbum)." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: "🕓 Procesando enlace..." }, { quoted: msg });

    try {
      const apiUrl = `https://fastrestapis.fasturl.cloud/downup/spotifydown?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const spotdl = response.data.result;

      if (!spotdl || !spotdl.link) {
        throw new Error("La API no devolvió un enlace de descarga válido.");
      }

      const metadata = spotdl.metadata;
      const coverImage = await axios.get(metadata.cover, { responseType: 'arraybuffer' });

      let caption = `*乂  S P O T I F Y  -  D O W N L O A D*\n\n`;
      caption += `    ✩  *Título* : ${metadata.title}\n`;
      caption += `    ✩  *Artista* : ${metadata.artist}\n`;
      caption += `    ✩  *Álbum* : ${metadata.album}\n`;
      caption += `    ✩  *Lanzamiento* : ${metadata.releaseDate}\n\n`;
      caption += `*- ↻ Enviando audio, espera un momento...*`;

      // Enviar carátula y metadatos
      await sock.sendMessage(msg.key.remoteJid, { image: coverImage.data, caption: caption }, { quoted: msg });

      // Enviar audio
      await sock.sendMessage(msg.key.remoteJid, {
        audio: { url: spotdl.link },
        mimetype: 'audio/mpeg'
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { text: "✅ Descarga completada." }, { edit: waitingMsg.key });

    } catch (error) {
      console.error('Error al procesar la descarga de Spotify:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '✖️ Error al procesar la descarga. El enlace puede ser inválido o la API ha fallado.' }, { quoted: msg, edit: waitingMsg.key });
    }
  }
};

export default spotifyCommand;
