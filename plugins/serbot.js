import { startBot, subBots } from '../index.js';
import fs from 'fs';

const serbotCommand = {
  name: "serbot",
  category: "subbots",
  description: "Te convierte en un sub-bot, dándote una sesión propia.",

  async execute({ sock, msg, config, pendingSerbotRequests }) {
    const senderId = msg.sender;
    const senderNumber = senderId.split('@')[0];
    if (!config.ownerNumbers.includes(senderNumber)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Este comando es solo para el propietario del bot." }, { quoted: msg });
    }

    const sessionOwnerJid = msg.sender;

    if (subBots.has(sessionOwnerJid)) {
      return sock.sendMessage(sessionOwnerJid, { text: "Ya tienes una sesión de sub-bot activa." });
    }

    // Anti-spam: verificar si ya hay una petición en curso
    if (pendingSerbotRequests.has(sessionOwnerJid)) {
        return sock.sendMessage(sessionOwnerJid, { text: "Ya hay una solicitud de conexión en curso. Por favor, espera." });
    }

    const sessionPath = `./jadibots/${sessionOwnerJid}`;
    if (fs.existsSync(sessionPath)) {
        return sock.sendMessage(sessionOwnerJid, { text: "Parece que tienes una sesión antigua. Usa `deletesesion` primero." });
    }

    if (!fs.existsSync('./jadibots')) {
      fs.mkdirSync('./jadibots');
    }

    // Añadir al set de peticiones pendientes
    pendingSerbotRequests.add(sessionOwnerJid);

    await sock.sendMessage(sessionOwnerJid, { text: "Iniciando tu sesión de sub-bot... Preparando el código QR. Tienes 45 segundos para escanear." });

    // Iniciar la nueva instancia de bot
    startBot(sessionOwnerJid, sock, msg);

    // Lógica de Timeout
    setTimeout(() => {
      // Si después de 45 segundos la petición sigue pendiente (no se ha conectado)
      if (pendingSerbotRequests.has(sessionOwnerJid)) {
        pendingSerbotRequests.delete(sessionOwnerJid);

        // Intentar cerrar la conexión si se quedó a medias
        if (subBots.has(sessionOwnerJid)) {
            try {
                subBots.get(sessionOwnerJid).logout();
            } catch {}
            subBots.delete(sessionOwnerJid);
        }

        // Borrar la carpeta de sesión si se creó
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }

        sock.sendMessage(sessionOwnerJid, { text: "Se acabó el tiempo. La solicitud para ser sub-bot ha expirado." });
      }
    }, 45000); // 45 segundos
  }
};

export default serbotCommand;
