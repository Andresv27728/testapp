const kickCommand = {
  name: "kick",
  category: "grupos",
  description: "Elimina a un miembro del grupo.",

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

      // 4. Determinar a quién eliminar
      let usersToKick = [];
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        usersToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        usersToKick.push(msg.message.extendedTextMessage.contextInfo.participant);
      }

      if (usersToKick.length === 0) {
        await sock.sendMessage(from, { text: "Debes mencionar a un usuario o responder a su mensaje para eliminarlo." }, { quoted: msg });
        return;
      }

      // 5. Prevenir que se elimine al bot o al dueño del grupo
      const groupOwner = metadata.owner;
      const selfKick = usersToKick.find(u => u === botJid);
      if (selfKick) {
        await sock.sendMessage(from, { text: "No puedo eliminarme a mí mismo." }, { quoted: msg });
        return;
      }
      const ownerKick = usersToKick.find(u => u === groupOwner);
      if (ownerKick) {
         await sock.sendMessage(from, { text: "No se puede eliminar al propietario del grupo." }, { quoted: msg });
        return;
      }

      // 6. Eliminar al usuario(s)
      await sock.groupParticipantsUpdate(from, usersToKick, "remove");
      await sock.sendMessage(from, { text: `✅ Se ha eliminado a ${usersToKick.map(u => `@${u.split('@')[0]}`).join(' ')} del grupo.` }, { quoted: msg, mentions: usersToKick });

    } catch (error) {
      console.error("Error en el comando kick:", error);
      await sock.sendMessage(from, { text: "Ocurrió un error al intentar eliminar al miembro. Es posible que sea administrador." }, { quoted: msg });
    }
  }
};

export default kickCommand;
