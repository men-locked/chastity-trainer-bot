const app = require('express')();
const cors = require('cors');
const logger = require('pino')();
const { Op } = require('sequelize');
require('module-alias/register');

const { DailyCheckin } = require('@lib/sequelize');
const { api_server_port: port } = require('../config');

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/daily-checkin', (req, res) => {
    res.json([]);
})

app.get('/daily-checkin/:user_id', async (req, res) => {
    const { user_id } = req.params;

    const user = await DailyCheckin.findAll({
        attributes: ['locked', 'cum', 'orgasm_type', 'createdAt'],
        where: { user_id },
    });

    res.json(user);
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});