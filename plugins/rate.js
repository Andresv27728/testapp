const rateCommand = {
  name: "rate",
  category: "juegos",
  description: "Puntúa algo o a alguien del 1 al 10.",
  aliases: ["puntuar"],

  async execute({ sock, msg, args }) {
    let thingToRate = args.join(' ');

    if (!thingToRate) {
      const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if(mentionedJid) {
        thingToRate = `@${mentionedJid.split('@')[0]}`;
      } else {
        thingToRate = msg.pushName;
      }
    }

    const rating = Math.floor(Math.random() * 10) + 1; // 1-10
    const message = `Yo le doy a *${thingToRate}* un... *${rating}/10* ${getEmoji(rating)}`;

    await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });
  }
};

function getEmoji(rating) {
  if (rating < 3) return "🤢";
  if (rating < 5) return "🤔";
  if (rating < 8) return "🙂";
  if (rating < 10) return "😍";
  return "💯";
}

export default rateCommand;
