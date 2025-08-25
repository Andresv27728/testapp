import axios from 'axios';

const githubCommand = {
  name: "github",
  category: "informacion",
  description: "Busca información de un perfil de GitHub.",

  async execute({ sock, msg, args }) {
    const username = args[0];
    if (!username) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un nombre de usuario de GitHub." }, { quoted: msg });
    }

    try {
      const apiUrl = `https://api.github.com/users/${username}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.login) {
        throw new Error("Usuario no encontrado");
      }

      const message = `*Información de GitHub*\n\n` +
                      `*Nombre:* ${data.name || 'No especificado'}\n` +
                      `*Usuario:* ${data.login}\n` +
                      `*Biografía:* ${data.bio || 'No especificada'}\n` +
                      `*Seguidores:* ${data.followers}\n` +
                      `*Siguiendo:* ${data.following}\n` +
                      `*Repositorios Públicos:* ${data.public_repos}\n` +
                      `*Ubicación:* ${data.location || 'No especificada'}\n` +
                      `*URL:* ${data.html_url}`;

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: data.avatar_url },
        caption: message
      }, { quoted: msg });

    } catch (e) {
      console.error("Error en el comando github:", e.message);
      await sock.sendMessage(msg.key.remoteJid, { text: `No se pudo encontrar al usuario de GitHub: *${username}*` }, { quoted: msg });
    }
  }
};

export default githubCommand;
