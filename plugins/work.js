import { readUsersDb, writeUsersDb } from '../lib/database.js';

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hora

const workCommand = {
  name: "work",
  category: "economia",
  description: "Trabaja para ganar monedas. Tiene un tiempo de espera de 1 hora.",
  aliases: ["trabajar"],

  async execute({ sock, msg }) {
    const senderId = msg.sender;
    const usersDb = readUsersDb();
    const user = usersDb[senderId];

    if (!user) {
      return sock.sendMessage(msg.key.remoteJid, { text: "No estás registrado. Usa el comando `reg` para registrarte." }, { quoted: msg });
    }

    const lastWork = user.lastWork || 0;
    const now = Date.now();

    if (now - lastWork < COOLDOWN_MS) {
      const timeLeft = COOLDOWN_MS - (now - lastWork);
      const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
      return sock.sendMessage(msg.key.remoteJid, { text: `Debes esperar ${minutesLeft} minutos más para volver a trabajar.` }, { quoted: msg });
    }

    const earnings = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
    user.coins = (user.coins || 0) + earnings;
    user.lastWork = now;

    writeUsersDb(usersDb);

    const workMessage = `💪 Has trabajado duro y ganaste *${earnings} coins*.\nTu nuevo saldo es *${user.coins} coins*.`;
    await sock.sendMessage(msg.key.remoteJid, { text: workMessage }, { quoted: msg });
  }
};

export default workCommand;
