import axios from 'axios';

const tiktokCommand = {
  name: "tiktok",
  category: "descargas",
  description: "Descarga un video de TikTok desde un enlace.",
  aliases: ["tt"],

  async execute({ sock, msg, args, config }) {
    const url = args[0];

    if (!url || !url.includes('tiktok.com')) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de TikTok. Ejemplo: `tiktok https://vm.tiktok.com/xxxx/`" }, { quoted: msg });
      return;
    }

    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `Procesando enlace de TikTok...` }, { quoted: msg });

    try {
      // Usamos la API proporcionada por el usuario
      const apiUrl = `https://myapiadonix.vercel.app/api/tiktok?url=${url}`;

      const response = await axios.get(apiUrl, {
        timeout: 120000 // 2 minutos de timeout
      });

      const data = response.data;

      // La API parece devolver un objeto con 'autor', 'descripcion', y URLs en 'links'
      if (!data || !data.links || data.links.length === 0) {
        throw new Error("La respuesta de la API no contiene enlaces de descarga válidos.");
      }

      // Buscamos el video sin marca de agua, si no, el primero que encuentre
      const videoData = data.links.find(v => v.marca_agua === "sin marca de agua") || data.links[0];
      const downloadUrl = videoData.url;

      const caption = `*Autor:* ${data.autor}\n*Descripción:* ${data.descripcion}`;

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: downloadUrl },
        mimetype: 'video/mp4',
        caption: caption
      }, { quoted: msg });

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Video de TikTok enviado.`, edit: waitingMsg.key });

    } catch (error) {
      console.error("Error en el comando tiktok:", error.message);
      if (error.code === 'ECONNABORTED') {
        await sock.sendMessage(msg.key.remoteJid, { text: "El servidor de descargas de TikTok tardó demasiado en responder." }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: "No se pudo descargar el video de TikTok. El enlace podría ser inválido o la API estar fallando." }, { quoted: msg });
      }
    }
  }
};

export default tiktokCommand;
