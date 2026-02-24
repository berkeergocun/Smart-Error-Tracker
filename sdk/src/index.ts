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

// Node.js'den import et - Bun/Node.js ortamında bu dosya kullanılır
// Browser için browser.ts kullanılır (package.json "browser" field)
export {
  init,
  captureException,
  captureMessage,
} from './node';

export type { SmartErrorTrackerConfig as Config } from './types';
