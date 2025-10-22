// Verifica si NO es un entorno de producción (como Render) Y dotenv NO está ya cargado
// Corregido: La condición !(...) asegura que solo se cargue dotenv si no estamos en producción o si el TOKEN no está definido.
// Render establece NODE_ENV a 'production' por defecto.
if (process.env.NODE_ENV !== 'production' && !process.env.TOKEN) {
    // Si la aplicación no tiene un token definido (estamos localmente sin variables de hosting),
    // carga el archivo .env localmente.
    require('dotenv').config();
}

const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
// Importar Express para crear un servidor web mínimo
const express = require('express');


// --- Variables de Entorno ---
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Render requiere que el puerto se obtenga del entorno (o use 10000 por defecto)
const PORT = process.env.PORT || 3000;


// --- 1. CONFIGURACIÓN DEL BOT DE DISCORD ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

// Verifica que el token exista antes de intentar iniciar sesión.
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("ERROR: Discord Token (TOKEN) not found in environment variables. Bot will not connect.");
}


// --- 2. SERVIDOR WEB MÍNIMO PARA RENDER ---
const app = express();

// Ruta principal simple para que Render sepa que el servicio está 'Vivo'
app.get('/', (req, res) => {
    // Muestra que el bot está activo pero no responde a peticiones web
    res.send('Discord Bot is running and connected.'); 
});

// Inicia el servidor Express en el puerto que Render le asigne
app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});


// --- 3. REGISTRO DE COMANDOS SLASH ---
// Register slash command
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    if (!CLIENT_ID || !GUILD_ID || !TOKEN) {
        console.error("ERROR: CLIENT_ID, GUILD_ID, or TOKEN is missing. Cannot register slash commands.");
        return;
    }
    
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Slash command registered!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();
