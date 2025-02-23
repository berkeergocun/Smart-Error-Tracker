export interface SmartErrorTrackerConfig {
  /** Backend API URL */
  apiUrl: string;
  /** Domain UUID (Smart Error Tracker'dan alınır) */
  domainId: string;
  /** Yakalama oranı 0-1 arası (default: 1) */
  sampleRate?: number;
  /** Maksimum breadcrumb sayısı (default: 20) */
  maxBreadcrumbs?: number;
  /** Hata göndermeden önce filtre fonksiyonu */
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null | false;
  /** Ek meta veri */
  metadata?: Record<string, unknown>;
  /** Debug modu */
  debug?: boolean;
  /** Otomatik console hatalarını yakala */
  captureConsoleErrors?: boolean;
  /** Ağ isteklerini izle */
  captureNetworkErrors?: boolean;
}

export interface ErrorPayload {
  message: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  breadcrumbs?: Breadcrumb[];
  domainId?: string;
}

export interface Breadcrumb {
  type: 'navigation' | 'click' | 'xhr' | 'fetch' | 'console' | 'error' | 'custom';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface TrackerResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    groupId: string;
    fingerprint: string;
  };
}
