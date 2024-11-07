import express, { Request, Response } from 'express';
import cors from 'cors';
import logger from './lib/logger';

import { DailyCheckin } from './lib/sequelize';
import { api_server_port as port } from '../config.json';

const app = express();
app.use(cors<Request>());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello, world!' });
});

app.get('/daily-checkin/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const user = await DailyCheckin.findAll({
    attributes: ['status', 'cummed', 'orgasm_type', 'createdAt'],
    where: { user_id },
  });

  res.json(user);
});

app.listen(port, () => {
  logger.info(`Server is listening on port ${port}`);
});