const log4js = require('log4js');
log4js.configure({
  appenders: { fileExample: { type: 'file', filename: 'logs/logs.log' } },
  categories: { default: { appenders: ['fileExample'], level: 'info' } },
});

const logger = log4js.getLogger('fileExample');
logger.level = 'info';
module.exports = logger;
