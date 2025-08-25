import axios from 'axios';

const catCommand = {
  name: "cat",
  category: "diversion",
  description: "Envía una foto de un gato al azar.",
  aliases: ["gato"],

  async execute({ sock, msg }) {
    try {
      const response = await axios.get('https://api.thecatapi.com/v1/images/search');
      const cat = response.data[0];

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: cat.url },
        caption: "¡Aquí tienes un lindo gatito! 🐱"
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando cat:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener una foto de un gato en este momento." }, { quoted: msg });
    }
  }
};

export default catCommand;
