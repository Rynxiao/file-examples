const { Sequelize } = require('sequelize');
const config = require('./config');
const { logger, Messages, actions, modules } = require('../helpers');

const sequelize = new Sequelize(config.DATABASE, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: 'mysql',
  logging: (msg) => logger.debug(Messages.info(modules.DB, actions.CONNECT, msg)),
});

module.exports = sequelize;
