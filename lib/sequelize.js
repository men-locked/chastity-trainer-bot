const Sequelize = require('sequelize');
const logger = require('pino')();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: msg => logger.info(msg),
    storage: 'main.db',
});

module.exports = {
    sequelize,

    DailyCheckin: sequelize.define('daily_checkin', {
        user_id: Sequelize.INTEGER,
        locked: Sequelize.BOOLEAN,
        cum: Sequelize.BOOLEAN,
        orgasm_type: Sequelize.TEXT,
    }, {
        indexes: [{
            using: 'BTREE',
            fields: [
                'user_id',
                {
                    name: 'createdAt',
                    order: 'DESC',
                }
            ],
        }]
    }),    
};