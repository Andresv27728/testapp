const demoteCommand = {
  name: "demote",
  category: "grupos",
  description: "Degrada a un administrador a miembro común.",

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;

    // 1. Verificar si es un grupo
    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }

    try {
      // 2. Obtener metadatos del grupo y verificar si el bot es admin
      const metadata = await sock.groupMetadata(from);
      const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
      const botIsAdmin = metadata.participants.find(p => p.id === botJid)?.admin;

      if (!botIsAdmin) {
        await sock.sendMessage(from, { text: "Necesito ser administrador del grupo para usar este comando." }, { quoted: msg });
        return;
      }

      // 3. Verificar si el usuario que envía el comando es admin
      const senderIsAdmin = metadata.participants.find(p => p.id === msg.sender)?.admin;

      if (!senderIsAdmin) {
        await sock.sendMessage(from, { text: "No tienes permisos de administrador para usar este comando." }, { quoted: msg });
        return;
      }

      // 4. Determinar a quién degradar
      let usersToDemote = [];
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        usersToDemote = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        usersToDemote.push(msg.message.extendedTextMessage.contextInfo.participant);
      }

      if (usersToDemote.length === 0) {
        await sock.sendMessage(from, { text: "Debes mencionar a un administrador o responder a su mensaje para degradarlo." }, { quoted: msg });
        return;
      }

      // 5. Degradsr al usuario(s)
      await sock.groupParticipantsUpdate(from, usersToDemote, "demote");
      await sock.sendMessage(from, { text: `✅ Se ha degradado a miembro a ${usersToDemote.map(u => `@${u.split('@')[0]}`).join(' ')}.` }, { quoted: msg, mentions: usersToDemote });

    } catch (error) {
      console.error("Error en el comando demote:", error);
      await sock.sendMessage(from, { text: "Ocurrió un error al intentar degradar al administrador." }, { quoted: msg });
    }
  }
};

export default demoteCommand;
