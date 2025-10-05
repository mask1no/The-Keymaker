import { log } from './productionLogger';
import { recordError } from './monitoring';

export interface AlertConfig {
  name: string;
  threshold: number;
  duration: number; // Duration in ms to wait before alerting
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

class AlertManager {
  private activeAlerts = new Map<string, Alert>();
  private alertConfigs = new Map<string, AlertConfig>();
  private thresholdTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.setupDefaultAlerts();
  }

  private setupDefaultAlerts() {
    // Bundle success rate alert
    this.addAlertConfig({
      name: 'bundle_success_rate_low',
      threshold: 0.8, // 80% success rate
      duration: 300000, // 5 minutes
      severity: 'high',
      enabled: true,
    });

    // API error rate alert
    this.addAlertConfig({
      name: 'api_error_rate_high',
      threshold: 0.05, // 5% error rate
      duration: 180000, // 3 minutes
      severity: 'medium',
      enabled: true,
    });

    // Health check failure alert
    this.addAlertConfig({
      name: 'health_check_failure',
      threshold: 1, // Any failure
      duration: 60000, // 1 minute
      severity: 'critical',
      enabled: true,
    });

    // Rate limit exceeded alert
    this.addAlertConfig({
      name: 'rate_limit_exceeded',
      threshold: 100, // 100 blocked requests
      duration: 300000, // 5 minutes
      severity: 'medium',
      enabled: true,
    });
  }

  addAlertConfig(config: AlertConfig) {
    this.alertConfigs.set(config.name, config);
  }

  async triggerAlert(
    configName: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const config = this.alertConfigs.get(configName);
    if (!config || !config.enabled) {
      return;
    }

    const alertId = `${configName}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      name: config.name,
      message,
      severity: config.severity,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.activeAlerts.set(alertId, alert);

    // Log the alert
    log.error(`ALERT: ${message}`, undefined, {
      alertId,
      alertName: config.name,
      severity: config.severity,
      metadata,
    });

    // Record metric
    recordError('alert_triggered', config.severity, 'alerting');

    // In a real system, this would send to Slack, PagerDuty, etc.
    await this.sendAlert(alert);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      
      log.info(`Alert resolved: ${alert.message}`, {
        alertId,
        alertName: alert.name,
        duration: Date.now() - alert.timestamp.getTime(),
      });

      this.activeAlerts.delete(alertId);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
  }

  private async sendAlert(alert: Alert): Promise<void> {
    // In production, integrate with:
    // - Slack webhook
    // - PagerDuty
    // - Email notifications
    // - SMS alerts for critical issues
    
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'critical') {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRITICAL ALERT: ${alert.message}`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Alert ID', value: alert.id, short: true },
                { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
                { title: 'Timestamp', value: alert.timestamp.toISOString(), short: false },
              ]
            }]
          })
        });
      } catch (error) {
        log.error('Failed to send Slack alert', error as Error);
      }
    }

    // Console alert for development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    }
  }
}

// Singleton alert manager
export const alertManager = new AlertManager();

// Convenience functions
export function alertBundleFailure(bundleId: string, error: string) {
  alertManager.triggerAlert('bundle_success_rate_low', 
    `Bundle submission failed: ${bundleId}`, 
    { bundleId, error }
  );
}

export function alertAPIError(path: string, statusCode: number, error: string) {
  alertManager.triggerAlert('api_error_rate_high',
    `High API error rate on ${path}`,
    { path, statusCode, error }
  );
}

export function alertHealthFailure(service: string, error: string) {
  alertManager.triggerAlert('health_check_failure',
    `Health check failed for ${service}`,
    { service, error }
  );
}

export function alertRateLimitExceeded(endpoint: string, ip: string) {
  alertManager.triggerAlert('rate_limit_exceeded',
    `Rate limit exceeded for ${endpoint}`,
    { endpoint, ip: ip.replace(/\d+$/, 'xxx') }
  );
}

