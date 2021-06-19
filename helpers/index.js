const { modules } = require('./constants');

const buildLoggerMessage = (moduleName, action, message, additional) => {
  const typeText = additional.type ? ` ${additional.type}` : '';
  const preText = additional.pre ? ` ${additional.pre}` : '';
  return `[${modules[moduleName]}] -${preText} ${action} ${message}${typeText}!`;
};

const Messages = {
  success: (moduleName, action, message) => buildLoggerMessage(moduleName, action, message, { type: 'successfully' }),
  fail: (moduleName, action, message) => buildLoggerMessage(moduleName, action, message, { type: 'failed' }),
  info: (moduleName, action, message, pre) => buildLoggerMessage(moduleName, action, message, { pre }),
};

module.exports = { Messages };
