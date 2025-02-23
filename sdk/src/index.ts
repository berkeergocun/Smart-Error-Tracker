/**
 * Smart Error Tracker SDK
 *
 * Browser ve Node.js uygulamalarında hata yakalama için unified SDK.
 *
 * @example Browser:
 * ```html
 * <script src="https://cdn.smarterrortracker.io/sdk.js"></script>
 * <script>
 *   SmartErrorTracker.init({
 *     apiUrl: 'https://your-api.com',
 *     domainId: 'your-domain-uuid'
 *   });
 * </script>
 * ```
 *
 * @example Node.js:
 * ```typescript
 * import * as SmartErrorTracker from '@smart-error-tracker/sdk';
 *
 * SmartErrorTracker.init({
 *   apiUrl: 'https://your-api.com',
 *   domainId: 'your-domain-uuid'
 * });
 * ```
 */

export { ErrorTrackerClient } from './client';
export type { SmartErrorTrackerConfig, ErrorPayload, Breadcrumb, TrackerResponse } from './types';

// Runtime detection - isomorphic export
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let _init: (config: import('./types').SmartErrorTrackerConfig) => unknown;
let _captureException: (error: Error, extra?: Record<string, unknown>) => unknown;
let _captureMessage: (message: string, severity?: 'low' | 'medium' | 'high' | 'critical') => unknown;
let _addBreadcrumb: (breadcrumb: import('./types').Breadcrumb) => void;

if (isBrowser) {
  const m = await import('./browser');
  _init = m.init;
  _captureException = m.captureException;
  _captureMessage = m.captureMessage;
  _addBreadcrumb = (b) => m.addBreadcrumb(b);
} else {
  const m = await import('./node');
  _init = m.init;
  _captureException = m.captureException;
  _captureMessage = m.captureMessage;
  _addBreadcrumb = () => {};
}

export const init = _init!;
export const captureException = _captureException!;
export const captureMessage = _captureMessage!;
export const addBreadcrumb = _addBreadcrumb!;
