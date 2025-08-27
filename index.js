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
export const commands = new Map();
export const aliases = new Map();
export const testCache = new Map();
export const cooldowns = new Map();
// El nuevo sistema de sub-bots usará global.conns
// export const subBots = new Map();

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

// --- FUNCIÓN DE INICIO DEL BOT PRINCIPAL ---
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Usando Baileys v${version.join('.')}, ¿es la última versión?: ${isLatest}`);

  const sock = Baileys.default({
    version,
    auth: state,
    logger,
    browser: ['JulesBot', 'Chrome', '1.0.0'],
    printQRInTerminal: true,
  });

  // Adjuntar el handler principal al socket del bot principal
  // Esto es para alinear con la estructura que espera el nuevo código
  const mainHandler = await import('./handler.js');
  sock.handler = mainHandler.handler.bind(sock);


  // --- MANEJO DE EVENTOS DE CONEXIÓN ---
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcodeTerminal.generate(qr, { small: true });

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión principal cerrada, reconectando...', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('            BOT PRINCIPAL CONECTADO');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // --- MANEJO DE MENSAJES ---
  // El nuevo sistema usa un handler.js, así que adjuntamos el nuestro.
  // La lógica de comandos se moverá a handler.js para ser reutilizable.
  sock.ev.on('messages.upsert', (m) => sock.handler(m));

  // --- MANEJO DE BIENVENIDA ---
  sock.ev.on('group-participants.update', async (event) => {
      const { id, participants, action } = event;
      const settingsDbPath = path.resolve('./database/groupSettings.json');
      let settings = {};
      try {
        const data = fs.readFileSync(settingsDbPath, 'utf8');
        settings = JSON.parse(data);
      } catch (e) {}

      if (!settings[id]?.welcome) return;

      try {
        const metadata = await sock.groupMetadata(id);
        for (const p of participants) {
          const userName = `@${p.split('@')[0]}`;
          const message = action === 'add'
            ? `¡Bienvenido/a al grupo *${metadata.subject}*, ${userName}! 🎉`
            : `Adiós, ${userName}. Te extrañaremos. 👋`;
          await sock.sendMessage(id, { text: message, mentions: [p] });
        }
      } catch (e) { console.error("Error en group-participants.update:", e); }
  });

  return sock;
}

// --- INICIO DEL BOT ---
(async () => {
  await loadCommands();
  await connectToWhatsApp();
})();
