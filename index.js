import { Boom } from '@hapi/boom';
import Baileys, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import qrcode from 'qrcode';
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
const testCache = new Map();
const cooldowns = new Map();
export const subBots = new Map();
const pendingSerbotRequests = new Set(); // Para evitar spam de serbot

// --- CONFIGURACIÓN DE TIEMPOS ---
const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

// --- FUNCIÓN PARA CARGAR COMANDOS ---
async function loadCommands() {
  const pluginsDir = path.join(__dirname, 'plugins');
  if (commands.size > 0) return; // Evitar recargar comandos
  try {
    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
      try {
        const commandModule = await import(path.join('file://', pluginsDir, file));
        const command = commandModule.default;
        if (command && command.name) {
          commands.set(command.name, command);
        }
      } catch (error) {
        console.error(`[-] Error al cargar el comando ${file}:`, error);
      }
    }
    console.log(`[+] ${commands.size} comandos cargados.`);
  } catch (error) {
    console.error(`[-] No se pudo leer la carpeta de plugins:`, error);
  }
}


// --- FUNCIÓN DE INICIO DE BOT (REFACTORIZADA PARA MÚLTIPLES SESIONES) ---
export async function startBot(sessionId, requesterSocket = null, requesterMsg = null) {
  console.log(`Iniciando bot para la sesión: ${sessionId}`);

  const sessionPath = (sessionId === 'main_session') ? 'auth_info_baileys' : `jadibots/${sessionId}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = Baileys.default({
    version: (await fetchLatestBaileysVersion()).version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    browser: (sessionId === 'main_session') ? ['JulesBot', 'Chrome', '1.0.0'] : ['SubBot', 'Chrome', '1.0.0'],
  });

  // Guardar la instancia del bot en el mapa
  if (sessionId !== 'main_session') {
    subBots.set(sessionId, sock);
  }

  // --- MANEJO DE EVENTOS ---
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (requesterSocket) {
        // Enviar el QR como imagen al usuario que lo solicitó
        try {
          const qrBuffer = await qrcode.toBuffer(qr);
          await requesterSocket.sendMessage(requesterMsg.key.remoteJid, {
            image: qrBuffer,
            caption: `Escanea este código QR para convertirte en un sub-bot.`
          }, { quoted: requesterMsg });
        } catch (e) {
          console.error("Error enviando QR de sub-bot como imagen:", e);
        }
      } else if (sessionId === 'main_session') {
        // Imprimir el QR en la consola para el bot principal
        console.log('Escanea este código QR con tu teléfono:');
        qrcodeTerminal.generate(qr, { small: true });
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
      // Si la sesión se cierra y estaba pendiente, se elimina de pendientes
      if (pendingSerbotRequests.has(sessionId)) {
        pendingSerbotRequests.delete(sessionId);
      }
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log(`Reconectando sesión ${sessionId}...`);
        startBot(sessionId, requesterSocket, requesterMsg);
      } else {
        console.log(`Sesión ${sessionId} cerrada. No se reconectará.`);
        if (sessionId !== 'main_session') {
          fs.rmSync(`./${sessionPath}`, { recursive: true, force: true });
          subBots.delete(sessionId);
        }
      }
    } else if (connection === 'open') {
      console.log(`Sesión ${sessionId} conectada exitosamente.`);
       // Si la sesión se abre y estaba pendiente, se elimina de pendientes
      if (pendingSerbotRequests.has(sessionId)) {
        pendingSerbotRequests.delete(sessionId);
      }
      if (sessionId === 'main_session') {
        console.log('\n================================================');
        console.log('            BOT PRINCIPAL CONECTADO');
        console.log('================================================\n');
      }
    }
  });

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
    const args = body.trim().split(/ +/).slice(1);
    const commandName = body.trim().split(/ +/)[0].toLowerCase();
    const command = commands.get(commandName);

    if (command) {
      if (cooldowns.has(sender)) {
        const timeDiff = (Date.now() - cooldowns.get(sender)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        await command.execute({ sock, msg, args, commands, config, testCache, subBots, pendingSerbotRequests });
        cooldowns.set(sender, Date.now());
      } catch (error) {
        console.error(`Error en comando ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al ejecutar ese comando.' }, { quoted: msg });
      }
    }
  });

  // El manejador de bienvenida se queda solo para el bot principal por simplicidad
  if (sessionId === 'main_session') {
    sock.ev.on('group-participants.update', async (event) => {
        // ... (lógica de bienvenida existente)
    });
  }
}

// --- INICIO DEL BOT ---
(async () => {
  await loadCommands();
  startBot('main_session'); // Iniciar la sesión del bot principal
})();
