import axios from 'axios';

const dogCommand = {
  name: "dog",
  category: "diversion",
  description: "Envía una foto de un perro al azar.",
  aliases: ["perro"],

  async execute({ sock, msg }) {
    try {
      const response = await axios.get('https://dog.ceo/api/breeds/image/random');
      const dog = response.data;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: dog.message },
        caption: "¡Aquí tienes un lindo perrito! 🐶"
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando dog:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo obtener una foto de un perro en este momento." }, { quoted: msg });
    }
  }
};

export default dogCommand;
