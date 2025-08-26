import { subBots } from '../index.js';
import fs from 'fs';

const deleteSessionCommand = {
  name: "deletesesion",
  category: "subbots", // Categoría corregida
  description: "Elimina tu sesión de sub-bot activa.",
  aliases: ["stopbot"],

  async execute({ sock, msg, config }) {
    const senderId = msg.sender;
    const senderNumber = senderId.split('@')[0];
    if (!config.ownerNumbers.includes(senderNumber)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Este comando es solo para el propietario del bot." }, { quoted: msg });
    }

    // La sesión a eliminar es la del propio usuario que ejecuta el comando
    const sessionOwnerJid = msg.sender;
    const sessionPath = `./jadibots/${sessionOwnerJid}`;

    let sessionFound = false;

    // Verificar si hay una sesión activa en el mapa
    if (subBots.has(sessionOwnerJid)) {
      sessionFound = true;
      try {
        const subBotSocket = subBots.get(sessionOwnerJid);
        await subBotSocket.logout();
        subBots.delete(sessionOwnerJid);
      } catch (e) {
        console.error("Error al cerrar la sesión del sub-bot:", e);
      }
    }

    // Verificar si existe la carpeta de sesión y borrarla
    if (fs.existsSync(sessionPath)) {
      sessionFound = true;
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
      } catch (e) {
        console.error("Error al eliminar la carpeta de sesión:", e);
        return sock.sendMessage(sessionOwnerJid, { text: "Ocurrió un error al eliminar los archivos de tu sesión." });
      }
    }

    if (sessionFound) {
        return sock.sendMessage(sessionOwnerJid, { text: "✅ Tu sesión de sub-bot ha sido eliminada exitosamente." });
    } else {
        return sock.sendMessage(sessionOwnerJid, { text: "No tienes una sesión de sub-bot activa para eliminar." });
    }
  }
};

export default deleteSessionCommand;
