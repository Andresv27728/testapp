import axios from 'axios';

const geminiCommand = {
  name: "gemini",
  category: "ias",
  description: "Habla con la IA de Google, Gemini.",

  async execute({ sock, msg, args, config }) {
    const query = args.join(' ');
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, hazme una pregunta para que Gemini la responda." }, { quoted: msg });
    }

    if (!config.api.gemini) {
        return sock.sendMessage(msg.key.remoteJid, { text: "La API Key de Gemini no está configurada." }, { quoted: msg });
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { text: "🧠 Pensando..." }, { quoted: msg });

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.api.gemini}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: query
              }
            ]
          }
        ]
      };

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Extraer la respuesta del JSON anidado
      const geminiResponse = response.data.candidates[0].content.parts[0].text;

      if (!geminiResponse) {
        throw new Error("No se pudo obtener una respuesta de Gemini.");
      }

      await sock.sendMessage(msg.key.remoteJid, { text: geminiResponse }, { quoted: msg });

    } catch (error) {
      console.error("Error en el comando gemini:", error.response ? error.response.data : error.message);
      await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al contactar a la IA de Gemini. Verifica la API Key y la consulta." }, { quoted: msg });
    }
  }
};

export default geminiCommand;
