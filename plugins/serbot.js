import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import NodeCache from "node-cache";
import fs from "fs";
import path from "path";
import pino from 'pino';
import chalk from 'chalk';
import { makeWASocket } from '../lib/simple.js';

const jadi = 'jadibots';

const rtx2 = `❀ *Conexión por Código*

✧ Usa el código manualmente:
✐ En tu WhatsApp principal: Más opciones → Dispositivos vinculados → Vincular un dispositivo → Vincular con el número de teléfono.
☁︎ *Importante:* El código es válido por 45 segundos.`.trim();


async function startSubBot(options) {
    let { path, m, conn } = options;

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }

    let { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(path);

    const connectionOptions = {
        logger: pino({ level: "fatal" }),
        printQRInTerminal: false, // Siempre falso para sub-bots
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
        browser: ['Sub-Bot', 'Chrome', '2.0.0'],
        version,
        shouldSyncHistoryMessage: () => false,
        // Habilitar el modo de código de emparejamiento
        pairingCode: true
    };

    let sock = makeWASocket(connectionOptions);
    if (!global.conns) global.conns = [];
    global.conns.push(sock);

    const handlerModule = await import('../handler.js');
    sock.handler = (msg) => handlerModule.handler.call(sock, msg, true);

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        // El evento QR es el trigger para solicitar el código de emparejamiento
        if (qr) {
            try {
                const
                 phoneNumber = m.sender.split('@')[0];
                let code = await sock.requestPairingCode(phoneNumber);
                code = code.match(/.{1,4}/g)?.join("-");

                await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m });
                await conn.sendMessage(m.chat, { text: `*${code}*` }, { quoted: m });
            } catch (e) {
                console.error("Error solicitando el código de emparejamiento:", e);
                conn.reply(m.chat, "Ocurrió un error al generar tu código. Inténtalo de nuevo.", m);
            }
        }

        if (connection === 'open') {
            let userName = sock.user.name || 'Sub-bot';
            console.log(chalk.bold.cyanBright(`SUB-BOT CONECTADO: ${userName} (${sock.user.id.split(':')[0]})`));
            conn.reply(m.chat, `✅ Sub-bot conectado exitosamente como *${userName}*.`, m);
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.yellow(`Conexión de sub-bot cerrada, razón: ${reason}`));
            let i = global.conns.findIndex(c => c.user?.id === sock.user?.id);
            if (i >= 0) global.conns.splice(i, 1);
            if (reason !== DisconnectReason.loggedOut) {
                // No reconectar automáticamente en este modelo
            } else {
                conn.reply(m.chat, "La sesión del sub-bot se ha cerrado.", m);
                if (fs.existsSync(path)) {
                    fs.rmSync(path, { recursive: true, force: true });
                }
            }
        }
    }

    sock.ev.on("messages.upsert", sock.handler);
    sock.ev.on("connection.update", connectionUpdate);
    sock.ev.on('creds.update', saveCreds);
}

const serbotCommand = {
    name: "serbot",
    category: "subbots",
    description: "Crea una sesión de sub-bot usando un código de emparejamiento.",

    async execute({ sock, msg, config }) {
        const MAX_SUB_BOTS = 5;
        const senderId = msg.sender;
        const senderNumber = senderId.split('@')[0];
        const isOwner = config.ownerNumbers.includes(senderNumber);

        if (!isOwner) {
            return sock.sendMessage(msg.key.remoteJid, { text: "No tienes permiso para crear un sub-bot." }, { quoted: msg });
        }

        if (global.conns && global.conns.length >= MAX_SUB_BOTS) {
            return sock.sendMessage(msg.key.remoteJid, { text: `Límite de sub-bots (${MAX_SUB_BOTS}) alcanzado.` }, { quoted: msg });
        }

        let id = `${senderId.split`@`[0]}`;
        let sessionPath = path.join(`./${jadi}/`, id);

        if (fs.existsSync(sessionPath)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "Ya tienes una sesión activa o archivos de sesión antiguos. Usa `deletesesion` primero." }, { quoted: msg });
        }

        const options = {
            path: sessionPath,
            m: msg,
            conn: sock,
        };

        startSubBot(options);
    }
};

export default serbotCommand;
