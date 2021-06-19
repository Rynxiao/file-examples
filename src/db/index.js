const mysql = require('mysql');
const config = require('./config');
const { logger, Messages, actions, modules } = require('../helpers');

// Create a connection to the database
const connection = mysql.createConnection({
  host: config.HOST,
  user: config.USER,
  password: config.PASSWORD,
  database: config.DATABASE,
});

// open the MySQL connection
connection.connect((error) => {
  if (error) throw error;
  logger.info(Messages.success(modules.DB, actions.CONNECT, 'database'));
});

module.exports = connection;
