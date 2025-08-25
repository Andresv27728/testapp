const dadoCommand = {
  name: "dado",
  category: "juegos",
  description: "Lanza un dado de seis caras.",

  async execute({ sock, msg }) {
    const results = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const result = results[Math.floor(Math.random() * results.length)];

    await sock.sendMessage(msg.key.remoteJid, { text: `Tu tirada de dado es: ${result}` }, { quoted: msg });
  }
};

export default dadoCommand;
