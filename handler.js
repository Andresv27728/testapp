// Este es el manejador de mensajes que usarán los sub-bots.
// Se ha adaptado para usar la misma lógica de comandos que el bot principal.

import { commands, aliases, testCache, cooldowns, subBots } from './index.js';
import config from './config.js';

const COOLDOWN_SECONDS = 5;
const RESPONSE_DELAY_MS = 2000;

export async function handler(m) {
  // 'this' se refiere a la instancia 'sock' del sub-bot
  const sock = this;

  try {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    msg.sender = sender; // Adjuntar para fácil acceso

    const from = msg.key.remoteJid;
    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // Aquí no se añade la lógica de prefix, antilink, etc. para los sub-bots
    // Se puede añadir en el futuro si es necesario.

    const args = body.trim().split(/ +/).slice(1);
    let commandName = body.trim().split(/ +/)[0].toLowerCase();

    let command = commands.get(commandName) || commands.get(aliases.get(commandName));

    // No permitir que los sub-bots usen comandos de propietario o de sub-bots
    if (command && (command.category === 'propietario' || command.category === 'subbots')) {
        return sock.sendMessage(from, { text: "No tienes permiso para usar este comando." });
    }

    if (command) {
      if (cooldowns.has(sender)) {
        const timeDiff = (Date.now() - cooldowns.get(sender)) / 1000;
        if (timeDiff < COOLDOWN_SECONDS) return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, RESPONSE_DELAY_MS));
        await command.execute({ sock, msg, args, commands, config, testCache, subBots });
        cooldowns.set(sender, Date.now());
      } catch (error) {
        console.error(`Error en comando (sub-bot) ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'Ocurrió un error al ejecutar ese comando.' });
      }
    }
  } catch (e) {
    console.error("Error en el manejador del sub-bot:", e);
  }
}
