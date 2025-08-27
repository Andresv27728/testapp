import fs from 'fs';
import path from 'path';

const jadi = 'jadibots';

const deleteSessionCommand = {
  name: "deletesesion",
  category: "subbots",
  description: "Elimina tu sesión de sub-bot activa.",
  aliases: ["stopbot"],

  async execute({ sock, msg }) {
    const who = msg.key.participant || msg.sender;
    const id = `${who.split`@`[0]}`;
    const sessionPath = path.join(`./${jadi}/`, id);

    if (!fs.existsSync(sessionPath)) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No tienes una sesión de sub-bot activa." }, { quoted: msg });
    }

    // Buscar la conexión del sub-bot en el array global
    if (global.conns) {
      const subBotConnection = global.conns.find(c => c.user?.id.startsWith(id));
      if (subBotConnection) {
        try {
          await subBotConnection.logout("Sesión eliminada manualmente.");
        } catch (e) {
          console.error("Sub-bot ya desconectado, procediendo a borrar archivos.", e);
        }
        // Eliminar del array global
        global.conns = global.conns.filter(c => !c.user?.id.startsWith(id));
      }
    }

    // Borrar la carpeta de la sesión
    fs.rmSync(sessionPath, { recursive: true, force: true });

    await sock.sendMessage(msg.key.remoteJid, { text: "✅ Tu sesión de sub-bot ha sido eliminada exitosamente." }, { quoted: msg });
  }
};

export default deleteSessionCommand;
