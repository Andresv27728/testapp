import axios from 'axios';

const iaCommand = {
  name: "ia",
  category: "ias",
  description: "Envía una pregunta a una IA y recibe una respuesta de voz.",

  async execute({ sock, msg, args, config }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, hazme una pregunta." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { text: "🧠 Pensando..." }, { quoted: msg });

      // Usamos la nueva API de voz
      const apiUrl = `https://myapiadonix.vercel.app/ai/iavoz?q=${encodeURIComponent(query)}`;

      // La API devuelve directamente el audio, no un JSON.
      // Necesitamos obtener la respuesta como un stream/buffer.
      const response = await axios.get(apiUrl, {
        responseType: 'arraybuffer' // Importante para recibir archivos
      });

      const audioBuffer = Buffer.from(response.data, 'binary');

      // Enviar la respuesta como un mensaje de audio
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          ptt: true // Enviar como PTT (Push-to-talk) para que se reproduzca automáticamente
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error("Error en el comando ia (voz):", error.message);
      await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al contactar a la IA de voz." }, { quoted: msg });
    }
  }
};

export default iaCommand;
