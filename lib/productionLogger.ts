// Simple production logger without winston dependency
import { format } from 'date-fns';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  version: string;
  [key: string]: any;
}

// Simple console-based logger for now (can be enhanced with winston later)
class SimpleLogger {
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta: Record<string, any> = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'keymaker',
      version: '1.5.2',
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, log as JSON
      console.log(JSON.stringify(entry));
    } else {
      // In development, log human-readable
      console.log(`[${level.toUpperCase()}] ${message}`, meta);
    }
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  end(callback: () => void) {
    callback();
  }
}

export const logger = new SimpleLogger();

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
