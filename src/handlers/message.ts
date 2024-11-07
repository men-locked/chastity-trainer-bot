import { Message } from "discord.js";

import { daily_verify_channel } from '../../config.json';
import { sequelize, Tooltip } from "../lib/sequelize";

export class MessageHandler {
  private readonly message: Message

  constructor(message: Message) {
    this.message = message
  }

  isMaybeDailyVerification(): boolean {
    if (!this.message.channel.isThread()) {
      return false;
    }
    if (this.message.channel.parent?.id !== daily_verify_channel) {
      return false;
    }

    return this.message.attachments.size === 1;
  }

  async replyCageTooltip() {
    const tooltip = await Tooltip.findOne({ order: sequelize.random() });

    // @ts-ignore
    await this.message.reply(`《戴鎖小提示》：${tooltip.content}`);
  }
}