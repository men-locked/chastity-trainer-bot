import {
  CacheType,
  ChatInputCommandInteraction,
  Client, Collection,
  Events,
  GatewayIntentBits,
} from 'discord.js';

import {
  token, debug
} from '../config.json';
import logger from './lib/logger';

import { commands } from './commands';
import {DailyCheckin} from "./lib/sequelize";

(async () => {
  const client = new Client({intents: [GatewayIntentBits.Guilds]});
  client.commands = new Collection();
  client.commands.set('daily-checkin', commands.DailyCheckin);
  client.commands.set('calendar', commands.CalendarUrl);

  client.once(Events.ClientReady, async c => {
    await DailyCheckin.sync({ force: debug });
    logger.info(`${c.user.tag} has connected to Discord!`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction);
    }
  });

  async function handleChatInputCommand(interaction: ChatInputCommandInteraction<CacheType>) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.error(`No command matching ${interaction.commandName} was found.`);
    }

    try {
      await command?.execute(interaction);
    }
    catch (error) {
      logger.error(error);
      (interaction.replied || interaction.deferred)
        ? await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
        : await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }

  await client.login(token);
})();

