import {
  Sequelize,
  INTEGER,
  TEXT,
  JSON,
} from "sequelize";
import logger from "./logger";

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'main.db',
  logging: msg => logger.debug(msg),
});

export const DailyCheckin = sequelize.define('daily_checkin', {
  user_id: INTEGER,
  status: TEXT,
  cummed: TEXT,
  orgasm_type: TEXT,
}, {
  indexes: [{ using: 'BTREE', fields: ['user_id'] }],
});

export const Tooltip = sequelize.define('tooltips', {
  content: TEXT,
  author: TEXT,
  tags: JSON,
});