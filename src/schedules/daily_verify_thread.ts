import {
  Client, roleMention, TextChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import { CronJob } from 'cron';
import moment from 'moment';

import { daily_verify_channel, daily_verify_role } from '../../config.json';
import logger from '../lib/logger';

export const createDailyVerifyThread = (client: Client) => new CronJob(
  '0 6 * * *',
  async () => {
    // @ts-ignore
    const channel: TextChannel = await client.channels.fetch(daily_verify_channel);
    if (!channel) {
      logger.error(`daily-verify channel not found.`);
    }

    const thread = await channel.threads.create({
      name: `${moment().format('MM-DD')} 每日驗證 Daily Verify`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
    });
    if (!thread) {
      logger.error(`Failed to create daily-verify thread.`);
    }

    logger.info(`Created daily-verify thread "${thread.name}"(${thread.id}) in "${channel.name}"(${channel.id}).`);

    const code = Math.random().toString().substring(2, 8);
    await thread.send(`${roleMention(daily_verify_role)}\n\n今天的驗證碼是 \`${code}\`\nToday's verification code is \`${code}\`\n\n---\n\n打卡規則：上傳一張圖片，圖片內需要有上鎖的照片與驗證碼（可以寫在身上、紙上或用手機/平板等顯示）\nCheck-in rules: Upload a photo with a caged photo and the verification code (can be written on the body, paper, or displayed on a phone/tablet, etc.)`);
  },
  null,
  true,
  'Asia/Taipei',
);

export const notifyDailyVerify = (client: Client) => new CronJob(
  '0 23 * * *',
  async () => {
    // @ts-ignore
    const channel: TextChannel = await client.channels.fetch(daily_verify_channel);
    if (!channel) {
      logger.error(`daily-verify channel not found.`);
    }

    const thread = channel.threads.cache.find(thread => thread.name === `${moment().format('MM-DD')} 每日驗證 Daily Verify`);
    if (!thread) {
      logger.error(`daily-verify thread not found.`);
    }

    await thread?.send(`${roleMention(daily_verify_role)}，你今天有驗證了嗎？`);
  },
  null,
  true,
  'Asia/Taipei',
)