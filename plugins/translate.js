const translateCommand = {
  name: "translate",
  category: "utilidades",
  description: "Traduce texto a otro idioma. (En desarrollo)",
  aliases: ["tr"],

  async execute({ sock, msg, args }) {
    const lang = args[0];
    const text = args.slice(1).join(' ');

    if (!lang || !text) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Uso: `translate <código_idioma> <texto>`\nEjemplo: `translate en Hola mundo`" }, { quoted: msg });
    }

    const developingText = `El comando de traducción está en desarrollo.\n\nEn el futuro, aquí se traduciría "${text}" al idioma "${lang}".`;
    await sock.sendMessage(msg.key.remoteJid, { text: developingText }, { quoted: msg });
  }
};

export default translateCommand;
