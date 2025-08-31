import { igdl } from 'ruhend-scraper';

const facebookCommand = {
  name: "facebook",
  category: "descargas",
  description: "Descarga un video de Facebook desde un enlace.",
  aliases: ["fb", "fbdl"],

  async execute({ sock, msg, args }) {
    const url = args[0];
    const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i;

    if (!url || !fbRegex.test(url)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Por favor, proporciona un enlace válido de Facebook." }, { quoted: msg });
    }

    const sharkEmoji = '🦈';
    const warningEmoji = '⚠️';
    const waitingEmoji = '🌊';
    const successEmoji = '✨';
    const errorEmoji = '❌';
    const oopsEmoji = '💢';

    // No hay 'react' en este framework, así que enviamos un mensaje de espera
    const waitingMsg = await sock.sendMessage(msg.key.remoteJid, { text: `${waitingEmoji} Procesando tu video, buba...` }, { quoted: msg });

    let res;
    try {
        res = await igdl(url);
    } catch (e) {
        return sock.sendMessage(msg.key.remoteJid, { text: `${oopsEmoji} *Aww, algo salió mal desu~... ¡Revisa el enlace, buba!*` }, { quoted: msg });
    }

    let result = res.data;
    if (!result || result.length === 0) {
        return sock.sendMessage(msg.key.remoteJid, { text: `${warningEmoji} *Nada de nada ~ no encontré nada que descargar... buba! 🦈💦*` }, { quoted: msg });
    }

    let data;
    try {
        data = result.find(i => i.resolution === "720p (HD)") || result.find(i => i.resolution === "360p (SD)");
    } catch (e) {
        return sock.sendMessage(msg.key.remoteJid, { text: `${oopsEmoji} *Oopsie doopsie! Tuve problemas procesando los datos desu... 🦈💔*` }, { quoted: msg });
    }

    if (!data) {
        return sock.sendMessage(msg.key.remoteJid, { text: `${warningEmoji} *Eh?? No encontré una resolución buena, uwu~ 💦*` }, { quoted: msg });
    }

    try {
        await sock.sendMessage(
            msg.key.remoteJid,
            {
                video: { url: data.url },
                caption: `${sharkEmoji} *¡Aquí tienes, buba! Espero que te guste desu~ 🦈✨*`,
                mimetype: 'video/mp4'
            },
            { quoted: msg }
        );
        // Editamos el mensaje de espera para confirmar el éxito
        await sock.sendMessage(msg.key.remoteJid, { text: `${successEmoji} ¡Video enviado, buba!`, edit: waitingMsg.key });
    } catch (e) {
        console.error("Error al enviar video de Facebook:", e);
        await sock.sendMessage(msg.key.remoteJid, { text: `${oopsEmoji} *¡Hyaaa! Algo falló al enviarte el video... ¡No te enojes conmigo desu~! 🦈💦*` }, { quoted: msg });
    }
  }
};

export default facebookCommand;
