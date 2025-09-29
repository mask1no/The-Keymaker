import winston from 'winston';
import { format } from 'date-fns';

// Production logging configuration
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      service: 'keymaker',
      version: '1.5.2',
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'keymaker' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: `logs/error-${format(new Date(), 'yyyy-MM-dd')}.log`,
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30, // Keep 30 days
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: `logs/combined-${format(new Date(), 'yyyy-MM-dd')}.log`,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 7, // Keep 1 week
    }),
    
    // Console for development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : []),
  ],
});

// Structured logging helpers
export const log = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },
  
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },
  
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  },
  
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },
  
  // Business logic logging
  bundleSubmission: (bundleId: string, mode: string, region: string, success: boolean, meta?: Record<string, any>) => {
    logger.info('Bundle submission', {
      bundleId,
      mode,
      region,
      success,
      type: 'bundle_submission',
      ...meta,
    });
  },
  
  securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: Record<string, any>) => {
    const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 
                     severity === 'medium' ? 'warn' : 'info';
    
    logger[logLevel](`Security event: ${event}`, {
      type: 'security_event',
      severity,
      ...meta,
    });
  },
  
  performanceEvent: (operation: string, duration: number, success: boolean, meta?: Record<string, any>) => {
    logger.info('Performance event', {
      operation,
      duration,
      success,
      type: 'performance_event',
      ...meta,
    });
  },
  
  apiAccess: (method: string, path: string, statusCode: number, duration: number, ip: string, meta?: Record<string, any>) => {
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('API access', {
      method,
      path,
      statusCode,
      duration,
      ip: ip.replace(/\d+$/, 'xxx'), // Partially redact IP
      type: 'api_access',
      ...meta,
    });
  },
};

// Graceful shutdown
export async function closeLogger(): Promise<void> {
  return new Promise((resolve) => {
    logger.end(() => {
      resolve();
    });
  });
}

// Setup graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await closeLogger();
  });
  
  process.on('SIGINT', async () => {
    await closeLogger();
  });
}
