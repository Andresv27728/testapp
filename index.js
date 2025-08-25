import { Boom } from '@hapi/boom';
// Usaremos una importación de 'namespace' para más robustez.
import Baileys, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import axios from 'axios';

// --- CONFIGURACIÓN DE DIRECTORIOS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- LOGGER ---
// El logger se establece en 'warn' para una consola más limpia.
const logger = pino({ level: 'warn' });

// --- COLECCIÓN DE COMANDOS Y CACHÉ ---
const commands = new Map();
const testCache = new Map();

// --- FUNCIÓN PARA CARGAR COMANDOS (sin cambios) ---
async function loadCommands() {
  const pluginsDir = path.join(__dirname, 'plugins');
  try {
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
      try {
        const commandModule = await import(path.join('file://', pluginsDir, file));
        const command = commandModule.default;
        if (command && command.name) {
          commands.set(command.name, command);
          console.log(`[+] Comando cargado: ${command.name}`);
        }
      } catch (error) {
        console.error(`[-] Error al cargar el comando ${file}:`, error);
      }
    }
  } catch (error) {
    console.error(`[-] No se pudo leer la carpeta de plugins:`, error);
  }
}

// --- LÓGICA DE CONEXIÓN REESCRITA ---
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Usando Baileys v${version.join('.')}, ¿es la última versión?: ${isLatest}`);

  // La clave del cambio: usamos Baileys.default, que es la forma más segura
  // de acceder al export principal en entornos mixtos de módulos.
  const sock = Baileys.default({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    // Se elimina printQRInTerminal, ya que está obsoleto.
    logger,
    browser: ['JulesBot', 'Chrome', '1.0.0'],
  });

  // Manejo de conexión actualizado para mostrar el QR manualmente.
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if(qr) {
      console.log('Escanea este código QR con tu teléfono:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom) &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada debido a', lastDisconnect.error, ', reconectando...', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('\n================================================');
      console.log('            BOT CONECTADO EXITOSAMENTE');
      console.log('================================================\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // --- MANEJO DE BIENVENIDA/DESPEDIDA ---
  sock.ev.on('group-participants.update', async (event) => {
    const { id, participants, action } = event;
    const dbPath = path.resolve('./database/groups.json');
    let db = {};
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
    } catch (e) { /* El archivo puede no existir, es seguro ignorar */ }

    // Si la bienvenida no está activada para este grupo, no hacer nada
    if (!db[id] || !db[id].welcome) {
      return;
    }

    try {
      const metadata = await sock.groupMetadata(id);
      for (const p of participants) {
        const userJid = p;
        const userName = `@${userJid.split('@')[0]}`;

        if (action === 'add') {
          const welcomeMsg = `¡Bienvenido/a al grupo *${metadata.subject}*, ${userName}! 🎉`;
          await sock.sendMessage(id, { text: welcomeMsg, mentions: [userJid] });
        } else if (action === 'remove') {
          const goodbyeMsg = `Adiós, ${userName}. Te extrañaremos. 👋`;
          await sock.sendMessage(id, { text: goodbyeMsg, mentions: [userJid] });
        }
      }
    } catch (e) {
      console.error("Error en el evento group-participants.update:", e);
    }
  });

  // --- MANEJO DE MENSAJES ---
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const messageType = Object.keys(msg.message)[0];
    const body = (messageType === 'conversation') ? msg.message.conversation :
                 (messageType === 'extendedTextMessage') ? msg.message.extendedTextMessage.text :
                 (messageType === 'templateButtonReplyMessage') ? msg.message.templateButtonReplyMessage.selectedId :
                 (messageType === 'listResponseMessage') ? msg.message.listResponseMessage.singleSelectReply.selectedRowId : '';

    const args = body.trim().split(/ +/).slice(1);
    const commandName = body.trim().split(/ +/)[0].toLowerCase();
    const command = commands.get(commandName);

    // --- Lógica de Comandos ---
    if (command) {
      try {
        // Pasamos el caché al comando
        await command.execute({ sock, msg, args, commands, config, testCache });
      } catch (error) {
        console.error(`Error al ejecutar el comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al intentar ejecutar ese comando.' }, { quoted: msg });
      }
    }
  });

  return sock;
}

// --- INICIO DEL BOT ---
(async () => {
  await loadCommands();
  await connectToWhatsApp();
})();
