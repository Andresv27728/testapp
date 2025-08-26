// Mapa de emojis para las categorías
const categoryEmojis = {
  'general': 'ℹ️',
  'descargas': '📥',
  'diversion': '🎉',
  'juegos': '🎮',
  'grupos': '👥',
  'propietario': '👑',
  'utilidades': '🛠️',
  'informacion': '📚',
  'subbots': '🤖',
  'ias': '🧠',
  'default': '⚙️'
};

const menuCommand = {
  name: "menu",
  category: "general",
  description: "Muestra el menú de comandos del bot.",
  aliases: ["help", "ayuda"],

  async execute({ sock, msg, commands, config }) {
    const categories = {};

    // Agrupar comandos por categoría
    commands.forEach(command => {
      // Ocultar comandos sin categoría o el comando 'test'
      if (!command.category || command.name === 'test') return;

      // Si la categoría no existe en el objeto, crearla
      if (!categories[command.category]) {
        categories[command.category] = [];
      }

      // Añadir el comando a su categoría
      categories[command.category].push(command);
    });

    // Ordenar categorías alfabéticamente
    const sortedCategories = Object.keys(categories).sort();

    // --- Construcción del nuevo menú ---
    let menuText = `╭─── 「 *${config.botName}* 」 ───╮\n`;
    menuText += `│\n`;
    menuText += `│  Hola, *${msg.pushName}*!\n`;
    menuText += `│  Aquí tienes la lista de mis comandos.\n`;
    menuText += `│\n`;

    for (const category of sortedCategories) {
      const emoji = categoryEmojis[category] || categoryEmojis['default'];
      menuText += `├─「 *${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}* 」\n`;

      const commandList = categories[category]
        .filter((cmd, index, self) => self.findIndex(c => c.name === cmd.name) === index) // Evitar duplicados por alias
        .map(cmd => `│  • \`${cmd.name}\`: _${cmd.description || 'Sin descripción'}_`)
        .join('\n');

      menuText += `${commandList}\n`;
      menuText += `│\n`;
    }

    menuText += `╰───「 _by ${config.ownerName}_ 」───╯`;

    await sock.sendMessage(msg.key.remoteJid, { text: menuText }, { quoted: msg });
  }
};

export default menuCommand;
