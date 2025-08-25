import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('./database/groups.json');

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return {};
    }
    console.error("Error leyendo la base de datos de grupos:", error);
    return {};
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo en la base de datos de grupos:", error);
  }
}

const welcomeCommand = {
  name: "welcome",
  category: "grupos",
  description: "Activa o desactiva los mensajes de bienvenida/despedida. Uso: welcome [on|off]",

  async execute({ sock, msg, args }) {
    const from = msg.key.remoteJid;
    const option = args[0]?.toLowerCase();

    if (!from.endsWith('@g.us')) {
      await sock.sendMessage(from, { text: "Este comando solo se puede usar en grupos." }, { quoted: msg });
      return;
    }

    try {
      const metadata = await sock.groupMetadata(from);
      const senderId = msg.key.participant || msg.key.remoteJid;
      const senderIsAdmin = metadata.participants.find(p => p.id === senderId)?.admin;

      if (!senderIsAdmin) {
        await sock.sendMessage(from, { text: "No tienes permisos de administrador para usar este comando." }, { quoted: msg });
        return;
      }
    } catch (e) {
      console.error("Error al obtener metadatos del grupo:", e);
      return sock.sendMessage(from, { text: "Ocurrió un error al verificar tus permisos." }, { quoted: msg });
    }

    if (option !== 'on' && option !== 'off') {
      return sock.sendMessage(from, { text: "Opción no válida. Usa `welcome on` o `welcome off`." }, { quoted: msg });
    }

    const db = readDb();
    if (option === 'on') {
      db[from] = { welcome: true };
      writeDb(db);
      await sock.sendMessage(from, { text: "✅ Los mensajes de bienvenida y despedida han sido activados." }, { quoted: msg });
    } else {
      if (db[from]) {
        delete db[from];
        writeDb(db);
      }
      await sock.sendMessage(from, { text: "❌ Los mensajes de bienvenida y despedida han sido desactivados." }, { quoted: msg });
    }
  }
};

export default welcomeCommand;
