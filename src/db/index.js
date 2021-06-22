const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const { logger, Messages, actions, modules } = require('../helpers');

module.exports = db = {};

const env = process.env.NODE_ENV;
const configPath = env ? `./config/${env}` : './config/local';
const config = require(configPath);

const initialize = async () => {
  // create db if it doesn't already exist
  const { DATABASE, USER, PASSWORD, HOST } = config;
  const connection = await mysql.createConnection({ host: HOST, user: USER, password: PASSWORD });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DATABASE};`);
  } catch (err) {
    logger.error(Messages.fail(modules.DB, actions.CONNECT, `create database ${DATABASE}`));
    throw err;
  }

  // connect to db
  const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
    host: HOST,
    dialect: 'mysql',
    // logging: (msg) => logger.debug(Messages.info(modules.DB, actions.CONNECT, msg)),
    logging: console.log,
  });

  // init models and add them to the exported db object
  db.Upload = require('./models/upload')(sequelize);
  db.Chunk = require('./models/chunk')(sequelize);

  // sync all models with database
  await sequelize.sync({ alter: true });
};

initialize().then(() => {
  logger.info(Messages.info(modules.DB, actions.CONNECT, 'database connect successfully!'));
});
