import { startBot, subBots } from '../index.js';
import fs from 'fs';

const serbotCommand = {
  name: "serbot",
  category: "subbots", // Categoría corregida
  description: "Te convierte en un sub-bot, dándote una sesión propia.",

  async execute({ sock, msg, config }) {
    const senderId = msg.sender;
    const senderNumber = senderId.split('@')[0];
    // Solo el propietario puede crear sub-bots
    if (!config.ownerNumbers.includes(senderNumber)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Este comando es solo para el propietario del bot." }, { quoted: msg });
    }

    // El ID de la sesión es el JID del usuario que ejecuta el comando
    const sessionOwnerJid = msg.sender;

    // Verificar si ya es un sub-bot
    if (subBots.has(sessionOwnerJid)) {
      return sock.sendMessage(sessionOwnerJid, { text: "Ya tienes una sesión de sub-bot activa." });
    }

    const sessionPath = `./jadibots/${sessionOwnerJid}`;
    if (fs.existsSync(sessionPath)) {
        return sock.sendMessage(sessionOwnerJid, { text: "Parece que tienes una sesión antigua. Usa `deletesesion` primero." });
    }

    if (!fs.existsSync('./jadibots')) {
      fs.mkdirSync('./jadibots');
    }

    await sock.sendMessage(sessionOwnerJid, { text: "Iniciando tu sesión de sub-bot... Preparando el código QR." });

    // Iniciar la nueva instancia de bot
    startBot(sessionOwnerJid, sock, msg);
  }
};

export default serbotCommand;
