import axios from 'axios';

const spotifySearchCommand = {
  name: "spotifysearch",
  category: "buscador",
  description: "Busca canciones en Spotify.",
  aliases: ["spotsearch"],

  async execute({ sock, msg, args, config }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, ingresa el nombre de una canción para buscar." }, { quoted: msg });
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `🔎 Buscando "${query}" en Spotify...` }, { quoted: msg });

    try {
      const apiUrl = `https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const results = response.data.data;

      if (!results || results.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: "No se encontraron resultados para tu búsqueda." }, { quoted: msg, edit: waitingMsg.key });
      }

      const topResults = results.slice(0, 5); // Limitar a 5 resultados
      const prefix = config.prefix || '.'; // Usar el prefijo configurado o '.' por defecto

      let resultText = `*Resultados de búsqueda para "${query}":*\n\n`;
      resultText += "Copia y pega el comando para descargar la canción que desees.\n\n";

      topResults.forEach((track, index) => {
        resultText += `*${index + 1}. ${track.title}* - ${track.artist}\n`;
        resultText += `\`${prefix}spotify ${track.url}\`\n\n`;
      });

      await sock.sendMessage(msg.key.remoteJid, { text: resultText }, { quoted: msg, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en spotifysearch:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al realizar la búsqueda." }, { quoted: msg, edit: waitingMsg.key });
    }
  }
};

export default spotifySearchCommand;
