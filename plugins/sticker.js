import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

const stickerCommand = {
  name: "sticker",
  category: "utilidades",
  description: "Convierte una imagen o video corto en un sticker.",
  aliases: ["s"],

  async execute({ sock, msg, config }) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const messageType = quoted ? Object.keys(quoted)[0] : Object.keys(msg.message)[0];

    let mediaMessage;
    if (quoted) {
        mediaMessage = quoted;
    } else if (msg.message.imageMessage || msg.message.videoMessage) {
        mediaMessage = msg.message;
    } else {
        return sock.sendMessage(from, { text: "Responde a una imagen, video o envía una con el comando `sticker`." }, { quoted: msg });
    }

    if (mediaMessage.videoMessage && mediaMessage.videoMessage.seconds > 10) {
        return sock.sendMessage(from, { text: "El video es demasiado largo. El límite es de 10 segundos." }, { quoted: msg });
    }

    try {
      const stream = await downloadContentFromMessage(mediaMessage.imageMessage || mediaMessage.videoMessage, mediaMessage.imageMessage ? 'image' : 'video');
      let buffer = Buffer.from([]);
      for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const sticker = new Sticker(buffer, {
        pack: config.botName || 'Bot',
        author: config.ownerName || 'Jules',
        type: StickerTypes.FULL,
        quality: 50
      });

      const stickerBuffer = await sticker.toBuffer();
      await sock.sendMessage(from, { sticker: stickerBuffer });

    } catch (e) {
      console.error("Error en el comando sticker:", e);
      await sock.sendMessage(from, { text: "Ocurrió un error al crear el sticker." }, { quoted: msg });
    }
  }
};

export default stickerCommand;
