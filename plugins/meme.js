import axios from 'axios';

const memeCommand = {
  name: "meme",
  category: "diversion",
  description: "Envía un meme al azar.",

  async execute({ sock, msg }) {
    try {
      // 1. Obtener la información del meme de la API
      const apiResponse = await axios.get('https://meme-api.com/gimme/memesenespanol');
      const meme = apiResponse.data;

      if (!meme || !meme.url) {
        throw new Error("La API de memes no devolvió una URL válida.");
      }

      // 2. Descargar la imagen a un buffer
      const imageResponse = await axios.get(meme.url, {
        responseType: 'arraybuffer'
      });
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      // 3. Enviar el buffer de la imagen
      await sock.sendMessage(msg.key.remoteJid, {
        image: imageBuffer,
        caption: `*${meme.title}*`
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando meme:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener un meme en este momento." }, { quoted: msg });
    }
  }
};

export default memeCommand;
