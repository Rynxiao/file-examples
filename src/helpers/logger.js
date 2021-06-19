const log4js = require('log4js');
log4js.configure({
  appenders: {
    fileExample: { type: 'file', filename: 'logs/logs.log' },
    console: { type: 'console' },
  },
  categories: { default: { appenders: ['fileExample', 'console'], level: 'info' } },
});

const logger = log4js.getLogger('fileExample');
module.exports = logger;
