const lidCommand = {
  name: "lid",
  category: "utilidades",
  description: "Muestra tu ID de WhatsApp (LID y JID).",

  async execute({ sock, msg }) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    // El JID real del usuario, Baileys lo normaliza en 'sender'
    // O lo construimos a partir del JID del participante en un grupo o del chat si es privado
    const userJid = msg.sender || (isGroup ? msg.key.participant : msg.key.remoteJid);

    // El LID es el ID que puede aparecer en lugar del número en grupos
    // Es el mismo que 'participant' si es un LID, o el JID si no lo es.
    const userLid = isGroup ? msg.key.participant : "N/A (solo en grupos)";

    const message = `*Tus Identificadores de WhatsApp:*\n\n` +
                    `*JID (Número Real):*\n\`${userJid}\`\n\n` +
                    `*LID (ID de este Chat):*\n\`${userLid}\`\n\n` +
                    `*Nota:* El bot usará tu JID para verificar si eres propietario o administrador.`;

    await sock.sendMessage(from, { text: message }, { quoted: msg });
  }
};

// Tengo que añadir 'sender' al objeto msg en index.js para que esto funcione 100%
// Lo haré en el siguiente paso.

export default lidCommand;
