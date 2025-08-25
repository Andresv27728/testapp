const coinflipCommand = {
  name: "coinflip",
  category: "juegos",
  description: "Lanza una moneda al aire.",
  aliases: ["caraocruz"],

  async execute({ sock, msg }) {
    const result = Math.random() < 0.5 ? "Cara" : "Cruz";
    const emoji = result === "Cara" ? "🙂" : "❌";

    await sock.sendMessage(msg.key.remoteJid, { text: `La moneda ha caído en: *${result}* ${emoji}` }, { quoted: msg });
  }
};

export default coinflipCommand;
