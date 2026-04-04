import winston from 'winston';

const level = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'community-pulse-api' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'HH:mm:ss' }),
              winston.format.printf(
                ({ level: logLevel, message, timestamp, ...meta }) =>
                  `${timestamp} ${logLevel}: ${message}${
                    Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
                  }`
              )
            )
    })
  ]
});

export const stream = {
  write: (message) => logger.info(message.trim())
};

export default logger;
