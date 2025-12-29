/**
 * Configuración de Winston Logger
 * Logging profesional con rotación de archivos y niveles configurables
 *
 * Para instalar: npm install winston winston-daily-rotate-file
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Niveles de log: error, warn, info, http, verbose, debug, silly
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Nivel de log según entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack } = info;
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Formato JSON para producción
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transports (destinos de logs)
const transports = [];

// Console transport (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      ),
    })
  );
}

// File transport - Errores en archivo separado
transports.push(
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d', // Mantener 14 días
    format: process.env.NODE_ENV === 'production' ? jsonFormat : logFormat,
  })
);

// File transport - Todos los logs
transports.push(
  new DailyRotateFile({
    filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d', // Mantener 14 días
    format: process.env.NODE_ENV === 'production' ? jsonFormat : logFormat,
  })
);

// Crear logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Stream para Morgan (logging de requests HTTP)
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

// Helpers para logging
export const logInfo = (message, meta = {}) => logger.info(message, meta);
export const logError = (message, error = null) => {
  if (error) {
    logger.error(message, { error: error.message, stack: error.stack });
  } else {
    logger.error(message);
  }
};
export const logWarn = (message, meta = {}) => logger.warn(message, meta);
export const logDebug = (message, meta = {}) => logger.debug(message, meta);
export const logHttp = (message) => logger.http(message);

export default logger;
