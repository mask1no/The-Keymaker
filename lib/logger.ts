/**
 * Production-ready logger utility
 * Uses Sentry in production, console in development
 */
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) return;

    const timestamp = new Date().toISOString();

    if (context) {
      const redacted = { ...context } as any
      if (redacted.password) redacted.password = '[REDACTED]'
      if (redacted.secret) redacted.secret = '[REDACTED]'
      if (redacted.privateKey) redacted.privateKey = '[REDACTED]'
      context = redacted
    }

    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
      consoleMethod(`[${timestamp}] [${level.toUpperCase()}]`, message, context || '')
    }

    if (level === 'error') {
      Sentry.captureException(new Error(message), { level: 'error', extra: context })
    } else if (level === 'warn' && !this.isDevelopment) {
      Sentry.captureMessage(message, { level: 'warning', extra: context })
    }
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context) }
  info(message: string, context?: LogContext) { this.log('info', message, context) }
  warn(message: string, context?: LogContext) { this.log('warn', message, context) }
  error(message: string, context?: LogContext) { this.log('error', message, context) }

  apiError(service: string, error: any, context?: LogContext) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error'
    const statusCode = error?.response?.status
    this.error(`${service} API error: ${errorMessage}`, { service, statusCode, error: error?.response?.data || error, ...context })
  }

  transaction(action: string, details: LogContext) {
    this.info(`Transaction: ${action}`, { action, ...details, timestamp: Date.now() })
  }

  security(event: string, details: LogContext) {
    this.warn(`Security event: ${event}`, { event, ...details, timestamp: Date.now() })
  }
}

// Export singleton instance
export const logger = new Logger();
// Also export for testing
export { Logger };
