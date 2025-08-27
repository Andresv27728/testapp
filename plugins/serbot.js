import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from 'pino';
import chalk from 'chalk';
import { makeWASocket } from '../../lib/simple.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definir `jadi` folder, un nombre común para estas sesiones
const jadi = 'jadibots';

// --- Mensajes de UI ---
const rtx = `❀ *Hazte Sub Bot*
✦ Escanea el QR desde tu WhatsApp:
✐ Más opciones → Dispositivos vinculados → Vincular nuevo dispositivo → Con QR
☁︎ *Importante:* El QR es válido por 30 segundos.`.trim();

const rtx2 = `❀ *Hazte Sub Bot*
✧ Usa el código manualmente:
✐ Más opciones → Dispositivos vinculados → Vincular nuevo dispositivo → Con número
☁︎ *Importante:* El código es válido por 30 segundos.`.trim();


// --- Función Principal del Sub-bot ---
async function yukiJadiBot(options) {
    let { pathYukiJadiBot, m, conn, args, usedPrefix, command } = options;

    // Lógica para manejar --code
    const mcode = args[0] && /(--code|code)/.test(args[0].trim()) ? true : false;

    const pathCreds = path.join(pathYukiJadiBot, "creds.json");
    if (!fs.existsSync(pathYukiJadiBot)) {
        fs.mkdirSync(pathYukiJadiBot, { recursive: true });
    }

    let { version, isLatest } = await fetchLatestBaileysVersion();
    const msgRetryCache = new NodeCache();
    const { state, saveCreds } = await useMultiFileAuthState(pathYukiJadiBot);

    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: !mcode,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        msgRetryCounterCache: msgRetryCache,
        browser: mcode ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['Sub Bot', 'Chrome', '2.0.0'],
        version,
        generateHighQualityLinkPreview: true,
        shouldSyncHistoryMessage: () => false, // Para un inicio más rápido
        patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
            if (requiresPatch) {
                message = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} }, ...message }}};
            }
            return message;
        }
    };

    let sock = makeWASocket(connectionOptions);
    if (!global.conns) global.conns = [];
    global.conns.push(sock);

    // Adjuntar el handler importado
    const handlerModule = await import('../../handler.js');
    sock.handler = handlerModule.handler.bind(sock);

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !mcode) {
            let txtQR = await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx }, { quoted: m });
            setTimeout(() => { conn.sendMessage(m.chat, { delete: txtQR.key }); }, 30000);
        }

        if (qr && mcode) {
            let secret = await sock.requestPairingCode((m.sender.split`@`[0]));
            secret = secret.match(/.{1,4}/g)?.join("-");
            let txtCode = await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m });
            let codeBot = await conn.sendMessage(m.chat, { text: secret }, { quoted: m });
            setTimeout(() => { conn.sendMessage(m.chat, { delete: txtCode.key }); }, 30000);
            setTimeout(() => { conn.sendMessage(m.chat, { delete: codeBot.key }); }, 30000);
        }

        if (connection === 'open') {
            let userName = sock.authState.creds.me.name || 'Sub-bot';
            let userJid = sock.authState.creds.me.id || `${path.basename(pathYukiJadiBot)}@s.whatsapp.net`;
            console.log(chalk.bold.cyanBright(`\nSUB-BOT CONECTADO: ${userName} (${userJid.split('@')[0]})`));
            conn.reply(m.chat, `✅ Sub-bot conectado exitosamente como *${userName}*.`, m);
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.yellow(`Conexión de sub-bot cerrada, razón: ${reason}`));

            let i = global.conns.indexOf(sock);
            if (i >= 0) global.conns.splice(i, 1);

            if (reason !== DisconnectReason.loggedOut) {
                yukiJadiBot(options); // Reconectar
            } else {
                conn.reply(m.chat, "La sesión del sub-bot se ha cerrado.", m);
                if (fs.existsSync(pathYukiJadiBot)) {
                    fs.rmSync(pathYukiJadiBot, { recursive: true, force: true });
                }
            }
        }
    }

    sock.ev.on("messages.upsert", sock.handler);
    sock.ev.on("connection.update", connectionUpdate);
    sock.ev.on('creds.update', saveCreds);
}


// --- Comando principal que inicia el proceso ---
const serbotCommand = {
    name: "serbot",
    category: "subbots",
    description: "Crea una sesión de sub-bot. Usa 'serbot code' para un código de emparejamiento.",
    aliases: ["qr", "code"],

    async execute({ sock, msg, args, usedPrefix, command }) {
        const MAX_SUB_BOTS = 5; // Límite de sub-bots
        if (global.conns && global.conns.length >= MAX_SUB_BOTS) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Límite de sub-bots (${MAX_SUB_BOTS}) alcanzado.` }, { quoted: msg });
        }

        let who = msg.key.participant || msg.sender;
        let id = `${who.split`@`[0]}`;
        let pathYukiJadiBot = path.join(`./${jadi}/`, id);

        if (fs.existsSync(pathYukiJadiBot)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes una sesión activa o archivos de sesión antiguos. Usa `deletesesion` primero." }, { quoted: msg });
        }

        const yukiJBOptions = {
            pathYukiJadiBot,
            m: msg,
            conn: sock,
            args,
            usedPrefix: '', // No usamos prefijos
            command
        };

        yukiJadiBot(yukiJBOptions);
    }
};

export default serbotCommand;
