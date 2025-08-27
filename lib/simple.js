// This file is a simplified compatibility layer to allow the new sub-bot code to work.
// It re-exports the main Baileys socket creation function.
import Baileys from '@whiskeysockets/baileys';

export function makeWASocket(options) {
  return Baileys.default(options);
}
