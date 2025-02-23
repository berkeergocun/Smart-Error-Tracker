import { ErrorTrackerClient } from './client';
import type { SmartErrorTrackerConfig } from './types';

class NodeErrorTracker extends ErrorTrackerClient {
  private initialized = false;

  constructor(config: SmartErrorTrackerConfig) {
    super(config);
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.log('Initializing Node.js error tracker');

    // Yakalanmamış istisnalar
    process.on('uncaughtException', (error: Error) => {
      this.log('Uncaught exception:', error.message);
      this.captureError({
        message: error.message,
        type: 'javascript',
        severity: 'critical',
        stack: error.stack,
        metadata: {
          processId: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
        },
      }).finally(() => {
        process.exit(1);
      });
    });

    // Yakalanmamış Promise red'leri
    process.on('unhandledRejection', (reason: unknown) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.log('Unhandled rejection:', error.message);

      this.captureError({
        message: error.message,
        type: 'promise',
        severity: 'high',
        stack: error.stack,
        metadata: {
          processId: process.pid,
          platform: process.platform,
          nodeVersion: process.version,
        },
      });
    });

    // Bellek uyarısı
    process.on('warning', (warning) => {
      this.addBreadcrumb({
        type: 'custom',
        message: `Node.js warning: ${warning.message}`,
        timestamp: new Date().toISOString(),
        data: { name: warning.name, code: (warning as NodeJS.ErrnoException).code },
      });
    });

    this.log('Node.js error tracker initialized');
  }

  /**
   * Express/Koa/Elysia gibi framework'ler için middleware
   */
  expressMiddleware() {
    return (err: Error, req: unknown, res: unknown, next: (err: Error) => void) => {
      this.captureError({
        message: err.message,
        type: 'server',
        severity: 'high',
        stack: err.stack,
        metadata: {
          method: (req as { method?: string }).method,
          url: (req as { url?: string }).url,
          headers: (req as { headers?: Record<string, string> }).headers,
        },
      });
      next(err);
    };
  }
}

// Singleton örnek
let instance: NodeErrorTracker | null = null;

export function init(config: SmartErrorTrackerConfig): NodeErrorTracker {
  instance = new NodeErrorTracker(config);
  instance.init();
  return instance;
}

export function captureException(error: Error, extra?: Record<string, unknown>): Promise<unknown> | void {
  return instance?.captureException(error, extra);
}

export function captureMessage(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low'): Promise<unknown> | void {
  return instance?.captureMessage(message, severity);
}

export { NodeErrorTracker };
export type { SmartErrorTrackerConfig };
