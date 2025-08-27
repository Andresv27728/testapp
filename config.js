/*
* Este es el archivo de configuración principal del bot.
* Modifica los valores según tus necesidades.
*/

const config = {
  // El nombre que mostrará el bot en los menús y mensajes.
  botName: "BOT DE YO SOY YO",

  // El nombre del propietario del bot.
  ownerName: "YO SOY YO",

  // Números de los propietarios del bot (en formato de WhatsApp, ej: '5211234567890').
  // El bot puede tener funcionalidades exclusivas para estos números.
  // Se añade el LID del propietario para asegurar el reconocimiento.
  ownerNumbers: ["573133374132", "176742836768966"],

  // APIs (si las tienes, si no, déjalas como están)
  // No es necesario modificar estas si usas las APIs públicas de Adonix.
  api: {
    ytmp3: "https://myapiadonix.vercel.app/api/ytmp3",
    ytmp4: "https://myapiadonix.vercel.app/api/ytmp4",
    gemini: "AIzaSyDEww4IKqba9tgfb8ndMDBOoLkl-nSy4tw" // Tu API Key de Gemini
  }
};

export default config;
