const adivinaCommand = {
  name: "adivina",
  category: "juegos",
  description: "Adivina el número que estoy pensando (del 1 al 10).",

  async execute({ sock, msg, args }) {
    const userGuess = parseInt(args[0]);

    if (isNaN(userGuess) || userGuess < 1 || userGuess > 10) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Debes adivinar un número del 1 al 10. Ejemplo: `adivina 7`" }, { quoted: msg });
    }

    const botNumber = Math.floor(Math.random() * 10) + 1;

    let message = `Tú elegiste: *${userGuess}*\nYo elegí: *${botNumber}*\n\n`;

    if (userGuess === botNumber) {
      message += "¡Increíble! Adivinaste el número. ¡Ganaste! 🎉";
    } else {
      message += "¡Fallaste! Mejor suerte la próxima vez. 🤖";
    }

    await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
  }
};

export default adivinaCommand;
