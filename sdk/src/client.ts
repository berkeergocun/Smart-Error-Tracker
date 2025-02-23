import type { SmartErrorTrackerConfig, ErrorPayload, Breadcrumb, TrackerResponse } from './types';

export class ErrorTrackerClient {
  protected config: Required<SmartErrorTrackerConfig>;
  protected breadcrumbs: Breadcrumb[] = [];

  constructor(config: SmartErrorTrackerConfig) {
    this.config = {
      sampleRate: 1,
      maxBreadcrumbs: 20,
      beforeSend: (e) => e,
      metadata: {},
      debug: false,
      captureConsoleErrors: true,
      captureNetworkErrors: true,
      ...config,
    };
  }

  protected log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[SmartErrorTracker]', ...args);
    }
  }

  protected addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  async captureError(payload: Omit<ErrorPayload, 'domainId'>): Promise<TrackerResponse | null> {
    // Örnekleme oranı kontrolü
    if (Math.random() > this.config.sampleRate) {
      this.log('Error skipped due to sample rate');
      return null;
    }

    const fullPayload: ErrorPayload = {
      ...payload,
      domainId: this.config.domainId,
      metadata: { ...this.config.metadata, ...payload.metadata },
      breadcrumbs: [...this.breadcrumbs],
    };

    // beforeSend filtresi
    if (this.config.beforeSend) {
      const result = this.config.beforeSend(fullPayload as unknown as globalThis.ErrorEvent);
      if (!result) {
        this.log('Error dropped by beforeSend');
        return null;
      }
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/errors/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-domain-id': this.config.domainId,
        },
        body: JSON.stringify(fullPayload),
        keepalive: true,
      });

      const data: TrackerResponse = await response.json();
      this.log('Error captured:', data);
      return data;
    } catch (err) {
      this.log('Failed to send error:', err);
      return null;
    }
  }

  captureMessage(message: string, severity: ErrorPayload['severity'] = 'low'): Promise<TrackerResponse | null> {
    return this.captureError({
      message,
      type: 'custom',
      severity,
    });
  }

  captureException(error: Error, extra?: Record<string, unknown>): Promise<TrackerResponse | null> {
    return this.captureError({
      message: error.message,
      type: 'javascript',
      severity: 'high',
      stack: error.stack,
      metadata: extra,
    });
  }

  addCustomBreadcrumb(message: string, data?: Record<string, unknown>): void {
    this.addBreadcrumb({
      type: 'custom',
      message,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}
