import {
  Collection,
  SlashCommandBuilder,
  CommandInteraction,
} from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
  }

  export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
  }
 }