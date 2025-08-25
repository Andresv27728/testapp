import axios from 'axios';

const memeCommand = {
  name: "meme",
  category: "diversion",
  description: "Envía un meme al azar.",

  async execute({ sock, msg }) {
    try {
      // API simple para memes en español
      const response = await axios.get('https://meme-api.com/gimme/memesenespanol');
      const meme = response.data;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: meme.url },
        caption: `*${meme.title}*`
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando meme:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener un meme en este momento." }, { quoted: msg });
    }
  }
};

export default memeCommand;
