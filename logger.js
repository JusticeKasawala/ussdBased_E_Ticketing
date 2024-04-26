// logger.js
const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' }) // Log to a file
  ],
  format: format.combine(
    format.timestamp(),
    format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
  )
});

module.exports = logger;
