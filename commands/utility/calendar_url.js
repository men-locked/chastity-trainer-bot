const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Get the calendar URL for Chastity Trainer')
        .setDescriptionLocalizations({
            "zh-TW": "取得 Chastity Trainer 的日曆連結",
        }),
    async execute(interaction) {
        await interaction.reply({
            content: `以下是你的 Chastity Trainer 日曆連結：\nThere's Chastity Trainer Calendar below:\nhttps://calendar.men-locked.app/#${interaction.user.id}`,
            ephemeral: true,
        });
    },
}