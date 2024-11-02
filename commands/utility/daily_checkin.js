const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('pino')();
const { DailyCheckin } = require('@lib/sequelize');

const questions = {
    'status': () => {
        const statusLocked = new ButtonBuilder()
        .setCustomId('status-locked-btn')
        .setLabel('鎖著 Locked')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Primary);

        const statusUnlocked = new ButtonBuilder()
            .setCustomId('status-unlocked-btn')
            .setLabel('沒鎖 Unlocked')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Secondary);

        return new ActionRowBuilder().addComponents(statusLocked, statusUnlocked);
    },
    'cum': () => {
        const orgasmYes = new ButtonBuilder()
            .setCustomId('cum-yes-btn')
            .setLabel('有 Yes')
            .setEmoji('🥛')
            .setStyle(ButtonStyle.Primary);

        const orgasmNo = new ButtonBuilder()
            .setCustomId('cum-no-btn')
            .setLabel('沒有 No')
            .setEmoji('😣')
            .setStyle(ButtonStyle.Primary);

        return new ActionRowBuilder().addComponents(orgasmYes, orgasmNo);
    },
    'orgasmType': () => {
        const orgasmFull = new ButtonBuilder()
            .setCustomId('orgasm-full-btn')
            .setLabel('完整高潮 Full')
            .setEmoji('💦')
            .setStyle(ButtonStyle.Primary);
        
        const orgasmRuined = new ButtonBuilder()
            .setCustomId('orgasm-ruined-btn')
            .setLabel('破壞性高潮 Ruined')
            .setEmoji('💧')
            .setStyle(ButtonStyle.Primary);
        
        const orgasmWetDream = new ButtonBuilder()
            .setCustomId('orgasm-wetdream-btn')
            .setLabel('夢遺 Wet Dream')
            .setEmoji('💭')
            .setStyle(ButtonStyle.Primary);
        
        const orgasmOther = new ButtonBuilder()
            .setCustomId('orgasm-other-btn')
            .setLabel('其它 Other')
            .setEmoji('🤔')
            .setStyle(ButtonStyle.Secondary);
        
        return new ActionRowBuilder().addComponents(orgasmFull, orgasmRuined, orgasmWetDream, orgasmOther);
    }
};

async function handleInteraction(interaction, content, components, prevMsg = '') {
    const filter = i => i.user.id === interaction.user.id;

    const resp = !prevMsg
        ? await interaction.reply({ content, components, ephemeral: true })
        : await interaction.update({ content: `${prevMsg}\n${content}`, components });

    return resp.awaitMessageComponent({ filter, time: 60_000 });
}

async function ratelimit(interaction) {
    const lastCheckin = await DailyCheckin.findOne({
        where: {
            user_id: interaction.user.id,
        },
        order: [['createdAt', 'DESC']],
    });

    if (lastCheckin && lastCheckin.createdAt > new Date(Date.now() - 23 * 60 * 60 * 1000)) {
        const nextAvailable = new Date(lastCheckin.createdAt.getTime() + 23 * 60 * 60 * 1000);
        throw new Error(`你已經打卡過了！Already checked in today!\n下次可以打卡的時間是：${nextAvailable.toLocaleString()}`);
    }
}

async function postHook(prev, answer) {
    await prev.interaction.update({
        content: `${prev.message}\n好棒！你已經完成今日打卡！Great! You're all set!`,
        components: [],
    });

    await DailyCheckin.create({
        user_id: prev.interaction.user.id,
        locked: answer.locked,
        cum: answer.cum,
        orgasm_type: answer.orgasmType,
    })
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily-checkin')
		.setDescription('Good users should check in everyday!')
        .setDescriptionLocalizations({
            "zh-TW": "優秀的用戶不會忘記打卡！"
        }),
	async execute(interaction) {
        try {
            await ratelimit(interaction);
        } catch(e) {
            await interaction.reply({ content: e.message, ephemeral: true });
            return;
        }

        const prev = {interaction, message: ''};
        const answer = {locked: null, cum: null, orgasmType: null, reason: ''};

        try {
            prev.interaction = await handleInteraction(prev.interaction, '有鎖著嗎？Did you lock today?', [questions.status()], prev.message);
            prev.message += '有鎖著嗎？Did you lock today?';
            switch (prev.interaction.customId) {
                case 'status-locked-btn':
                    prev.message += '**🔒 鎖著 Locked**';
                    answer.locked = true;
                    break;
                case 'status-unlocked-btn':
                    prev.message += '**🔓 沒鎖 Unlocked**';
                    answer.locked = false;
                    break;
            }

            prev.interaction = await handleInteraction(prev.interaction, '今天有射嗎？Did you cum today?', [questions.cum()], prev.message);
            prev.message += '\n今天有射嗎？Did you cum today?';
            switch (prev.interaction.customId) {
                case 'cum-yes-btn':
                    prev.message += '**🥛 有 Yes**';
                    answer.cum = true;
                    break;
                case 'cum-no-btn':
                    prev.message += '**😣 沒有 No**';
                    answer.cum = false;

                    postHook(prev, answer);
                    return; // end
            }

            prev.interaction = await handleInteraction(prev.interaction, '是怎麼射的呢？What type of orgasm did you have?', [questions.orgasmType()], prev.message);
            prev.message += '\n是怎麼射的呢？What type of orgasm did you have?';
            switch (prev.interaction.customId) {
                case 'orgasm-full-btn':
                    prev.message += '**💦 完整高潮 Full**';
                    answer.orgasmType = 'full';
                    break;
                case 'orgasm-ruined-btn':
                    prev.message += '**💧 破壞性高潮 Ruined**';
                    answer.orgasmType = 'ruined';
                    break;
                case 'orgasm-wetdream-btn':
                    prev.message += '**💭 夢遺 Wet Dream**';
                    answer.orgasmType = 'wetdream';
                    break;
                case 'orgasm-other-btn':
                    prev.message += '**🤔 其它 Other**';
                    answer.orgasmType = 'other';
                    break;
            }

            postHook(prev, answer);
        } catch (e) {
            logger.error(e);
            await interaction.editReply({ content: 'Lock status not received within 1 minute, cancelling.', components: [] });
        }
	},
};