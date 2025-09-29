import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';

export interface AuditEvent {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure' | 'error';
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private logStream: WriteStream | null = null;
  private currentDate: string = '';

  constructor(private logDir: string = 'logs') {}

  private ensureLogStream(): WriteStream {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (this.currentDate !== today || !this.logStream) {
      // Close existing stream if date changed
      if (this.logStream) {
        this.logStream.end();
      }
      
      // Create new stream for today
      const logFile = join(this.logDir, `audit-${today}.ndjson`);
      this.logStream = createWriteStream(logFile, { flags: 'a' });
      this.currentDate = today;
    }
    
    return this.logStream;
  }

  async log(event: AuditEvent): Promise<void> {
    try {
      const logEntry = {
        timestamp: event.timestamp.toISOString(),
        userId: event.userId || 'anonymous',
        sessionId: event.sessionId || 'none',
        action: event.action,
        resource: event.resource,
        ip: this.redactSensitiveData(event.ip),
        userAgent: this.redactSensitiveData(event.userAgent),
        result: event.result,
        severity: event.severity,
        metadata: this.redactSensitiveData(event.metadata || {}),
      };

      const stream = this.ensureLogStream();
      const logLine = JSON.stringify(logEntry) + '\n';
      
      return new Promise((resolve, reject) => {
        stream.write(logLine, (error) => {
          if (error) {
            console.error('Failed to write audit log:', error);
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Audit logging error:', error);
      throw error;
    }
  }

  private redactSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // Redact potential sensitive patterns
      return data.replace(/(key|token|secret|pass|auth)/gi, '[REDACTED]');
    }
    
    if (typeof data === 'object' && data !== null) {
      const redacted = { ...data };
      for (const [key, value] of Object.entries(redacted)) {
        if (/(key|token|secret|pass|auth)/i.test(key)) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'string' && value.length > 100) {
          // Truncate very long strings
          redacted[key] = value.substring(0, 100) + '...[TRUNCATED]';
        }
      }
      return redacted;
    }
    
    return data;
  }

  // Convenience methods for common audit events
  async logAuthentication(userId: string, ip: string, userAgent: string, success: boolean) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'authentication',
      resource: '/login',
      ip,
      userAgent,
      result: success ? 'success' : 'failure',
      severity: success ? 'low' : 'medium',
    });
  }

  async logBundleSubmission(
    userId: string | undefined,
    bundleId: string,
    mode: string,
    region: string,
    ip: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: 'bundle_submission',
      resource: `/api/bundles/submit`,
      ip,
      userAgent: 'api-client',
      result: success ? 'success' : 'failure',
      severity: success ? 'low' : 'high',
      metadata: {
        bundleId,
        mode,
        region,
        ...metadata,
      },
    });
  }

  async logSecurityEvent(
    action: string,
    resource: string,
    ip: string,
    userAgent: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ) {
    await this.log({
      timestamp: new Date(),
      action,
      resource,
      ip,
      userAgent,
      result: 'error',
      severity,
      metadata,
    });
  }

  async logAPIAccess(
    method: string,
    path: string,
    statusCode: number,
    ip: string,
    userAgent: string,
    duration: number,
    userId?: string
  ) {
    await this.log({
      timestamp: new Date(),
      userId,
      action: `${method} ${path}`,
      resource: path,
      ip,
      userAgent,
      result: statusCode < 400 ? 'success' : statusCode < 500 ? 'failure' : 'error',
      severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
      metadata: {
        method,
        statusCode,
        duration,
      },
    });
  }

  // Graceful shutdown
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.logStream) {
        this.logStream.end(() => {
          this.logStream = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton audit logger instance
export const auditLogger = new AuditLogger();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await auditLogger.close();
  });
  
  process.on('SIGINT', async () => {
    await auditLogger.close();
  });
}
