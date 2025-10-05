import { log } from './productionLogger';
import { recordError } from './monitoring';

export interface AlertConfig {
  n, a, m, e: string;
  t, h, r, eshold: number;
  d, u, r, ation: number; // Duration in ms to wait before alerting
  s, e, v, erity: 'low' | 'medium' | 'high' | 'critical';
  e, n, a, bled: boolean;
}

export interface Alert {
  i, d: string;
  n, a, m, e: string;
  m, e, s, sage: string;
  s, e, v, erity: 'low' | 'medium' | 'high' | 'critical';
  t, i, m, estamp: Date;
  r, e, s, olved: boolean;
  m, e, t, adata?: Record<string, any>;
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
      n, a, m, e: 'bundle_success_rate_low',
      t, h, r, eshold: 0.8, // 80% success rate
      d, u, r, ation: 300000, // 5 minutes
      s, e, v, erity: 'high',
      e, n, a, bled: true,
    });

    // API error rate alert
    this.addAlertConfig({
      n, a, m, e: 'api_error_rate_high',
      t, h, r, eshold: 0.05, // 5% error rate
      d, u, r, ation: 180000, // 3 minutes
      s, e, v, erity: 'medium',
      e, n, a, bled: true,
    });

    // Health check failure alert
    this.addAlertConfig({
      n, a, m, e: 'health_check_failure',
      t, h, r, eshold: 1, // Any failure
      d, u, r, ation: 60000, // 1 minute
      s, e, v, erity: 'critical',
      e, n, a, bled: true,
    });

    // Rate limit exceeded alert
    this.addAlertConfig({
      n, a, m, e: 'rate_limit_exceeded',
      t, h, r, eshold: 100, // 100 blocked requests
      d, u, r, ation: 300000, // 5 minutes
      s, e, v, erity: 'medium',
      e, n, a, bled: true,
    });
  }

  addAlertConfig(c, o, n, fig: AlertConfig) {
    this.alertConfigs.set(config.name, config);
  }

  async triggerAlert(
    c, o, n, figName: string,
    m, e, s, sage: string,
    m, e, t, adata?: Record<string, any>
  ): Promise<void> {
    const config = this.alertConfigs.get(configName);
    if (!config || !config.enabled) {
      return;
    }

    const alertId = `${configName}-${Date.now()}`;
    const a, l, e, rt: Alert = {
      i, d: alertId,
      n, a, m, e: config.name,
      message,
      s, e, v, erity: config.severity,
      t, i, m, estamp: new Date(),
      r, e, s, olved: false,
      metadata,
    };

    this.activeAlerts.set(alertId, alert);

    // Log the alert
    log.error(`A, L, E, RT: ${message}`, undefined, {
      alertId,
      a, l, e, rtName: config.name,
      s, e, v, erity: config.severity,
      metadata,
    });

    // Record metric
    recordError('alert_triggered', config.severity, 'alerting');

    // In a real system, this would send to Slack, PagerDuty, etc.
    await this.sendAlert(alert);
  }

  async resolveAlert(a, l, e, rtId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      
      log.info(`Alert r, e, s, olved: ${alert.message}`, {
        alertId,
        a, l, e, rtName: alert.name,
        d, u, r, ation: Date.now() - alert.timestamp.getTime(),
      });

      this.activeAlerts.delete(alertId);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
  }

  private async sendAlert(a, l, e, rt: Alert): Promise<void> {
    // In production, integrate w, i, t, h:
    // - Slack webhook
    // - PagerDuty
    // - Email notifications
    // - SMS alerts for critical issues
    
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'critical') {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          m, e, t, hod: 'POST',
          h, e, a, ders: { 'Content-Type': 'application/json' },
          b, o, d, y: JSON.stringify({
            t, e, x, t: `🚨 CRITICAL A, L, E, RT: ${alert.message}`,
            a, t, t, achments: [{
              c, o, l, or: 'danger',
              f, i, e, lds: [
                { t, i, t, le: 'Alert ID', v, a, l, ue: alert.id, s, h, o, rt: true },
                { t, i, t, le: 'Severity', v, a, l, ue: alert.severity.toUpperCase(), s, h, o, rt: true },
                { t, i, t, le: 'Timestamp', v, a, l, ue: alert.timestamp.toISOString(), s, h, o, rt: false },
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
export function alertBundleFailure(b, u, n, dleId: string, e, r, r, or: string) {
  alertManager.triggerAlert('bundle_success_rate_low', 
    `Bundle submission f, a, i, led: ${bundleId}`, 
    { bundleId, error }
  );
}

export function alertAPIError(p, a, t, h: string, s, t, a, tusCode: number, e, r, r, or: string) {
  alertManager.triggerAlert('api_error_rate_high',
    `High API error rate on ${path}`,
    { path, statusCode, error }
  );
}

export function alertHealthFailure(s, e, r, vice: string, e, r, r, or: string) {
  alertManager.triggerAlert('health_check_failure',
    `Health check failed for ${service}`,
    { service, error }
  );
}

export function alertRateLimitExceeded(e, n, d, point: string, i, p: string) {
  alertManager.triggerAlert('rate_limit_exceeded',
    `Rate limit exceeded for ${endpoint}`,
    { endpoint, i, p: ip.replace(/\d+$/, 'xxx') }
  );
}

