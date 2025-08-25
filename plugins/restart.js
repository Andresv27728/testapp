const restartCommand = {
  name: "restart",
  category: "propietario",
  description: "Reinicia el bot. (Solo para el propietario)",

  async execute({ sock, msg, config }) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    // Verificar si el que envía es el propietario
    if (!config.ownerNumbers.includes(senderNumber)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "Este comando solo puede ser utilizado por el propietario del bot." }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, { text: "Reiniciando el bot..." }, { quoted: msg });
      // Cierra el proceso. El gestor de procesos (PM2, Docker, etc.) debería reiniciarlo.
      process.exit(0);
    } catch (error) {
      console.error("Error al intentar reiniciar:", error);
      await sock.sendMessage(msg.key.remoteJid, { text: "Ocurrió un error al intentar reiniciar." }, { quoted: msg });
    }
  }
};

export default restartCommand;
