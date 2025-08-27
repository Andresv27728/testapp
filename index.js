import { Boom } from '@hapi/boom';
import Baileys, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import axios from 'axios';

// --- CONFIGURACIÓN GLOBAL ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = pino({ level: 'warn' });

// --- COLECCIONES GLOBALES ---
const commands = new Map();
const aliases = new Map();
const testCache = new Map();
const cooldowns = new Map();
export const subBots = new Map();

// --- CONFIGURACIÓN DE TIEMPOS ---
const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

// --- FUNCIÓN PARA CARGAR COMANDOS ---
async function loadCommands() {
  const pluginsDir = path.join(__dirname, 'plugins');
  if (commands.size > 0) return;
  try {
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
      try {
        const commandModule = await import(path.join('file://', pluginsDir, file));
        const command = commandModule.default;
        if (command && command.name) {
          commands.set(command.name, command);
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => aliases.set(alias, command.name));
          }
        }
      } catch (error) { console.error(`[-] Error al cargar ${file}:`, error); }
    }
    console.log(`[+] ${commands.size} comandos y ${aliases.size} alias cargados.`);
  } catch (error) { console.error(`[-] No se pudo leer la carpeta de plugins:`, error); }
}

// --- FUNCIÓN DE INICIO DE BOT (REFACTORIZADA PARA CÓDIGO DE EMPAREJAMIENTO) ---
export async function startBot(sessionId, isSubBot = false, requesterMsg = null) {
  console.log(`Iniciando bot para la sesión: ${sessionId}`);

  const sessionPath = isSubBot ? `jadibots/${sessionId}` : 'auth_info_baileys';
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = Baileys.default({
    version: (await fetchLatestBaileysVersion()).version,
    auth: state,
    logger,
    browser: isSubBot ? ['SubBot', 'Chrome', '1.0.0'] : ['JulesBot', 'Chrome', '1.0.0'],
    printQRInTerminal: !isSubBot,
    // Pedir código de emparejamiento si es un sub-bot
    pairingCode: isSubBot,
  });

  if (isSubBot) {
    subBots.set(sessionId, sock);
  }

  // Manejador de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // El QR solo se imprime para el bot principal
    if (qr && !isSubBot) {
      qrcodeTerminal.generate(qr, { small: true });
    }

    // Si tenemos un código de emparejamiento, lo enviamos al usuario que lo pidió
    if(sock.authState.creds.pairingCode && isSubBot && requesterMsg) {
        try {
            const code = sock.authState.creds.pairingCode;
            await sock.sendMessage(requesterMsg.key.remoteJid, {
                text: `Tu código de emparejamiento es: *${code}*\n\nSigue estos pasos en el WhatsApp que quieres que sea el bot:\n1. Ve a Dispositivos Vinculados.\n2. Selecciona 'Vincular un dispositivo'.\n3. Elige 'Vincular con el número de teléfono' e ingresa el código.`
            });
        } catch (e) {
            console.error("Error enviando el código de emparejamiento:", e);
        }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`Reconectando sesión ${sessionId}...`);
        startBot(sessionId, isSubBot, requesterMsg);
      } else {
        console.log(`Sesión ${sessionId} cerrada permanentemente.`);
        if (isSubBot) {
          fs.rmSync(`./${sessionPath}`, { recursive: true, force: true });
          subBots.delete(sessionId);
        }
      }
    } else if (connection === 'open') {
      console.log(`Sesión ${sessionId} conectada exitosamente.`);
      if (!isSubBot) {
        console.log('\n================================================');
        console.log('            BOT PRINCIPAL CONECTADO');
        console.log('================================================\n');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // --- MANEJO DE MENSAJES (APLICA A TODAS LAS INSTANCIAS) ---
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    msg.sender = sender;

    const blockedDbPath = path.resolve('./database/blocked.json');
    try {
      const data = fs.readFileSync(blockedDbPath, 'utf8');
      const blockedUsers = JSON.parse(data);
      if (blockedUsers.includes(sender)) return;
    } catch (e) { /* Ignorar */ }

    const from = msg.key.remoteJid;
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.templateButtonReplyMessage?.selectedId || '';

    // --- Lógica de Anti-Link ---
    const antilinkDbPath = path.resolve('./database/antilink.json');
    try {
        const data = fs.readFileSync(antilinkDbPath, 'utf8');
        const antilinkDb = JSON.parse(data);
        if (from.endsWith('@g.us') && antilinkDb[from]?.enabled) {
            if (body.includes('chat.whatsapp.com/')) {
                const metadata = await sock.groupMetadata(from);
                const senderIsAdmin = metadata.participants.find(p => p.id === sender)?.admin;
                const botIsAdmin = metadata.participants.find(p => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net')?.admin;

                if (!senderIsAdmin && botIsAdmin) {
                    await sock.sendMessage(from, { text: "No se permiten enlaces de otros grupos." }, { quoted: msg });
                    await sock.sendMessage(from, { delete: msg.key });
                }
            }
        }
    } catch (e) { /* Ignorar si el archivo no existe */ }

    const args = body.trim().split(/ +/).slice(1);
    let commandName = body.trim().split(/ +/)[0].toLowerCase();

    // Buscar comando por nombre o por alias
    let command = commands.get(commandName);
    if (!command && aliases.has(commandName)) {
        command = commands.get(aliases.get(commandName));
    }

    if (command) {
      if (cooldowns.has(sender)) {
        const timeDiff = (Date.now() - cooldowns.get(sender)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        // Se elimina iaConversations de los argumentos
        await command.execute({ sock, msg, args, commands, config, testCache, subBots });
        cooldowns.set(sender, Date.now());
      } catch (error) {
        console.error(`Error en comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al intentar ejecutar ese comando.' }, { quoted: msg });
      }
    }
  });

  if (!isSubBot) {
    sock.ev.on('group-participants.update', async (event) => {
        const { id, participants, action } = event;
        const dbPath = path.resolve('./database/groups.json');
        let db = {};
        try {
          const data = fs.readFileSync(dbPath, 'utf8');
          db = JSON.parse(data);
        } catch (e) { /* El archivo puede no existir, es seguro ignorar */ }
        if (!db[id] || !db[id].welcome) return;
        try {
          const metadata = await sock.groupMetadata(id);
          for (const p of participants) {
            const userJid = p;
            const userName = `@${userJid.split('@')[0]}`;
            if (action === 'add') {
              await sock.sendMessage(id, { text: `¡Bienvenido/a al grupo *${metadata.subject}*, ${userName}! 🎉`, mentions: [userJid] });
            } else if (action === 'remove') {
              await sock.sendMessage(id, { text: `Adiós, ${userName}. Te extrañaremos. 👋`, mentions: [userJid] });
            }
          }
        } catch (e) { console.error("Error en group-participants.update:", e); }
    });
  }
}

// --- INICIO DEL BOT ---
(async () => {
  await loadCommands();
  startBot('main_session', false);
})();
