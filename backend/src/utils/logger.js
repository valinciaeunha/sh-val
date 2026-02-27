import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logDir = 'logs';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log stack trace
    winston.format.splat(),
    winston.format.json()
);

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, stack }) => {
                return `${timestamp} ${level}: ${message} ${stack || ''}`;
            })
        ),
    }),
    // Daily Rotate File transport for errors
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
    }),
    // Daily Rotate File transport for combined logs
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
    }),
];

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports,
});

// Stream for Morgan
export const stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

export default logger;
