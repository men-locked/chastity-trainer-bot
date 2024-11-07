import {
  ActionRowBuilder,
  ButtonBuilder, ButtonInteraction, ButtonStyle, CollectorFilter,
  CommandInteraction,
  SlashCommandBuilder
} from "discord.js";

import logger from "../lib/logger";
import { DailyCheckin } from "../lib/sequelize";


class Option {
  public readonly customId: string
  private readonly label: string;
  private readonly emoji: string;
  private readonly style: ButtonStyle;
  public readonly finish: boolean;

  constructor(customId: string, label: string, emoji: string, style: ButtonStyle, finish = false) {
    this.customId = customId;
    this.label = label;
    this.emoji = emoji;
    this.style = style;
    this.finish = finish;
  }

  toButton(): ButtonBuilder {
    return new ButtonBuilder()
      .setCustomId(this.customId)
      .setLabel(this.label)
      .setEmoji(this.emoji)
      .setStyle(this.style);
  }

  toAnswer(): string {
    return `${this.emoji} ${this.label}`;
  }
}

class Message {
  public readonly content: string;
  public readonly options: Option[];
  answer: Option | undefined;

  constructor(content: string, options: Option[]) {
    this.content = content;
    this.options = options;
  }

  getComponents(): ActionRowBuilder<any> {
    const row = new ActionRowBuilder();
    row.addComponents(this.options.map(option => option.toButton()));

    return row;
  }

  setAnswer(answerId: string) {
    this.answer = this.options.find(option => option.customId === answerId);
  }
}

class MessageHistory {
  private readonly messages: Message[] = [];

  push(message: Message) {
    this.messages.push(message);
  }

  getContent(): string {
    return this.messages.map(message => `${message.content}: **${message.answer?.toAnswer()}**`).join('\n');
  }

  async save(interaction: CommandInteraction) {
    await DailyCheckin.create({
      user_id: interaction.user.id,
      status: this.messages[0]?.answer?.customId,
      cummed: this.messages[1]?.answer?.customId,
      orgasm_type: this.messages[2]?.answer?.customId,
    })
  }
}

class MessagePipeline {
  public history: MessageHistory = new MessageHistory();
  private readonly messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  async dispatch(interaction: CommandInteraction) {
    const filter: CollectorFilter<any> = (i: ButtonInteraction) => i.user.id === interaction.user.id;

    let resp = await interaction.reply({content: this.messages[0].content, components: [this.messages[0].getComponents()], ephemeral: true});
    let inter = await resp.awaitMessageComponent({ filter, time: 60_000 });
    messages[0].setAnswer(inter.customId);
    this.history.push(messages[0]);

    for (let i = 1; i < this.messages.length; i++) {
      resp = await inter.update({content: `${this.history.getContent()}\n${this.messages[i].content}`, components: [this.messages[i].getComponents()]});
      inter = await resp.awaitMessageComponent({ filter, time: 60_000 });
      this.messages[i].setAnswer(inter.customId);
      this.history.push(this.messages[i]);
      if (this.messages[i].answer?.finish) {
        await inter.update({content: `${this.history.getContent()}\n好棒！你已經完成今日打卡！Great! You're all set!`, components: []});
        break;
      }
    }
  }
}

const messages: Message[] = [
  new Message('有鎖著嗎？Did you lock today?', [
    new Option('status-locked', '鎖著 Locked', '🔒', ButtonStyle.Primary),
    new Option('status-unlocked', '沒鎖 Unlocked', '🔓', ButtonStyle.Secondary),
  ]),
  new Message('今天有射嗎？Did you cum today?', [
    new Option('cummed-yes', '有 Yes', '🥛', ButtonStyle.Primary),
    new Option('cummed-no', '沒有 No', '😣', ButtonStyle.Secondary, true),
  ]),
  new Message('是怎麼射的呢？What type of orgasm did you have?', [
    new Option('orgasm-full', '完整高潮 Full', '💦', ButtonStyle.Primary, true),
    new Option('orgasm-ruined', '破壞性高潮 Ruined', '💧', ButtonStyle.Primary, true),
    new Option('orgasm-wetdream', '夢遺 Wet Dream', '💭', ButtonStyle.Primary, true),
    new Option('orgasm-other', '其它 Other', '🤔', ButtonStyle.Secondary, true),
  ]),
];

export const data = new SlashCommandBuilder()
  .setName('daily-checkin')
  .setDescription('Good users should check in everyday!')
  .setDescriptionLocalizations({
    "zh-TW": "優秀的用戶不會忘記打卡！"
  });

export async function execute(interaction: CommandInteraction) {
  try {
    const pipeline = new MessagePipeline(messages);
    await pipeline.dispatch(interaction);
    await pipeline.history.save(interaction);
  } catch (e) {
    logger.error(e);
    await interaction.editReply({ content: 'Lock status not received within 1 minute, cancelling.', components: [] });
  }
}