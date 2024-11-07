import {
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName('calendar')
  .setDescription('Get the calendar URL for Chastity Trainer')
  .setDescriptionLocalizations({
    "zh-TW": "取得 Chastity Trainer 的日曆連結",
  });

export async function execute(interaction: CommandInteraction) {
  await interaction.reply({
    content: `以下是你的 Chastity Trainer 日曆連結：\nThere's Chastity Trainer Calendar below:\nhttps://calendar.men-locked.app/#${interaction.user.id}`,
    ephemeral: true,
  })
}