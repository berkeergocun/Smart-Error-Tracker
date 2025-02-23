import { ErrorTrackerClient } from './client';
import type { SmartErrorTrackerConfig, Breadcrumb } from './types';

class BrowserErrorTracker extends ErrorTrackerClient {
  private initialized = false;

  constructor(config: SmartErrorTrackerConfig) {
    super(config);
  }

  init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.log('Initializing browser error tracker');

    // Global JavaScript hataları
    window.addEventListener('error', (event) => {
      this.handleWindowError(event);
    });

    // Yakalanmamış Promise red'leri
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });

    // Navigation breadcrumbs
    this.setupNavigationTracking();

    // Console hataları
    if (this.config.captureConsoleErrors) {
      this.setupConsoleTracking();
    }

    // Network hatası izleme
    if (this.config.captureNetworkErrors) {
      this.setupNetworkTracking();
    }

    // Tıklama breadcrumbs
    this.setupClickTracking();

    this.log('Browser error tracker initialized');
  }

  private handleWindowError(event: globalThis.ErrorEvent): void {
    if (!event.message) return;

    // Script yükleme hataları (kaynak hataları) için error null olabilir
    if (!event.error && !event.message) return;

    this.captureError({
      message: event.message || 'Unknown error',
      type: 'javascript',
      severity: 'high',
      stack: event.error?.stack,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason;
    const message = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unhandled Promise Rejection';

    this.captureError({
      message,
      type: 'promise',
      severity: 'high',
      stack: error instanceof Error ? error.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  private setupNavigationTracking(): void {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    const trackNavigation = (url: string): void => {
      this.addBreadcrumb({
        type: 'navigation',
        message: `Navigated to ${url}`,
        timestamp: new Date().toISOString(),
        data: { url },
      });
    };

    history.pushState = (...args) => {
      originalPushState(...args);
      trackNavigation(args[2]?.toString() || window.location.href);
    };

    history.replaceState = (...args) => {
      originalReplaceState(...args);
      trackNavigation(args[2]?.toString() || window.location.href);
    };

    window.addEventListener('popstate', () => {
      trackNavigation(window.location.href);
    });
  }

  private setupConsoleTracking(): void {
    const originalConsoleError = console.error.bind(console);
    const originalConsoleWarn = console.warn.bind(console);

    console.error = (...args: unknown[]) => {
      originalConsoleError(...args);
      this.addBreadcrumb({
        type: 'console',
        message: args.map(String).join(' ').slice(0, 200),
        timestamp: new Date().toISOString(),
        data: { level: 'error' },
      });
    };

    console.warn = (...args: unknown[]) => {
      originalConsoleWarn(...args);
      this.addBreadcrumb({
        type: 'console',
        message: args.map(String).join(' ').slice(0, 200),
        timestamp: new Date().toISOString(),
        data: { level: 'warn' },
      });
    };
  }

  private setupNetworkTracking(): void {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const url = args[0]?.toString() || '';
      const method = (args[1]?.method || 'GET').toUpperCase();
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          this.addBreadcrumb({
            type: 'fetch',
            message: `${method} ${url} → ${response.status}`,
            timestamp: new Date().toISOString(),
            data: { url, method, status: response.status, duration },
          });

          if (response.status >= 500) {
            this.captureError({
              message: `HTTP ${response.status}: ${method} ${url}`,
              type: 'network',
              severity: 'medium',
              url: window.location.href,
              userAgent: navigator.userAgent,
              metadata: { httpStatus: response.status, requestUrl: url, method },
            });
          }
        }

        return response;
      } catch (err) {
        const duration = Date.now() - startTime;
        this.captureError({
          message: `Network error: ${method} ${url} failed`,
          type: 'network',
          severity: 'high',
          stack: err instanceof Error ? err.stack : undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: { requestUrl: url, method, duration },
        });
        throw err;
      }
    };
  }

  private setupClickTracking(): void {
    document.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        const label =
          target.textContent?.trim().slice(0, 50) ||
          target.getAttribute('aria-label') ||
          target.tagName;

        this.addBreadcrumb({
          type: 'click',
          message: `Clicked: ${label}`,
          timestamp: new Date().toISOString(),
          data: {
            tag: target.tagName,
            id: target.id || undefined,
            class: target.className || undefined,
          },
        });
      },
      { passive: true }
    );
  }
}

// Singleton örnek
let instance: BrowserErrorTracker | null = null;

export function init(config: SmartErrorTrackerConfig): BrowserErrorTracker {
  instance = new BrowserErrorTracker(config);
  instance.init();
  return instance;
}

export function captureException(error: Error, extra?: Record<string, unknown>): void {
  instance?.captureException(error, extra);
}

export function captureMessage(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low'): void {
  instance?.captureMessage(message, severity);
}

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  instance?.addCustomBreadcrumb(breadcrumb.message, breadcrumb.data);
}

export { BrowserErrorTracker };
export type { SmartErrorTrackerConfig };

// Browser global'a bağla
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).SmartErrorTracker = {
    init,
    captureException,
    captureMessage,
    addBreadcrumb,
  };
}
