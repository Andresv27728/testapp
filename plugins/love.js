const loveCommand = {
  name: "love",
  category: "juegos",
  description: "Calcula la compatibilidad de amor entre dos personas.",

  async execute({ sock, msg, args }) {
    // El comando espera dos nombres, o se usa con el usuario mencionado o el que responde
    let user1 = msg.pushName;
    let user2;

    if (args.length > 0) {
      user2 = args.join(' ');
    } else {
      return sock.sendMessage(msg.key.remoteJid, { text: "Menciona a alguien para calcular el amor. Ejemplo: `love @usuario`" }, { quoted: msg });
    }

    // Si se menciona a un usuario
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (mentionedJid) {
        // Obtenemos el pushName del mencionado si está disponible en metadatos del grupo
        try {
            const metadata = await sock.groupMetadata(msg.key.remoteJid);
            const participant = metadata.participants.find(p => p.id === mentionedJid);
            // El pushName no está en los metadatos, así que usamos el tag.
            // Una implementación más avanzada buscaría el nombre en los contactos.
            user2 = `@${mentionedJid.split('@')[0]}`;
        } catch (e) {
            user2 = `@${mentionedJid.split('@')[0]}`;
        }
    }

    const compatibility = Math.floor(Math.random() * 101); // 0-100
    const emojis = ["❤️", "💖", "💕", "💞", "💓", "💗", "💘", "💝"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    let message = `*Calculadora de Amor* ${randomEmoji}\n\n` +
                  `Compatibilidad entre *${user1}* y *${user2}*:\n\n` +
                  `*${compatibility}%*`;

    if (compatibility < 30) {
        message += "\n\n_Mejor sigan como amigos... 😬_";
    } else if (compatibility < 70) {
        message += "\n\n_Hay potencial aquí... 😏_";
    } else {
        message += "\n\n_¡Es amor verdadero! 😍_";
    }

    await sock.sendMessage(msg.key.remoteJid, { text: message, mentions: mentionedJid ? [mentionedJid] : [] }, { quoted: msg });
  }
};

export default loveCommand;
