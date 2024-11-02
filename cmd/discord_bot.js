const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const logger = require('pino')();
require('module-alias/register');

const { debug, token } = require('../config.json');
const { DailyCheckin } = require('@lib/sequelize');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Create a new command collection
client.commands = new Collection();

const foldersPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	DailyCheckin.sync({ force: debug });
    logger.info(`${readyClient.user.tag} has connected to Discord`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		await handleCommandInteraction(interaction);
		return;
	}
})

async function handleCommandInteraction(interaction) {
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		(interaction.replied || interaction.deffered)
			? await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
			: await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}

// Log in to Discord with your client's token
client.login(token);