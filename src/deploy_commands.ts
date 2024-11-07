import { REST, Routes } from 'discord.js';

import logger from './lib/logger';
import { token, clientId, guildId } from '../config.json';
import { commands } from './commands';

const cmds = Object.values(commands).map((command) => command.data.toJSON());

const rest = new REST().setToken(token);

(async () => {
  try {
    logger.info(`Started refreshing ${cmds.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: cmds },
    );

    // @ts-ignore
    logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (e) {
    logger.error(e);
  }
})();