import crypto from 'crypto';

interface ErrorData {
  message: string;
  type?: string;
  source?: string;
  stack?: string;
  lineno?: number;
  colno?: number;
}

/**
 * Error olayı için deterministik bir fingerprint üretir.
 * Aynı hata farklı kullanıcılarda aynı fingerprint'e sahip olur.
 */
export function generateFingerprint(error: ErrorData, domainId: string): string {
  const parts: string[] = [domainId, error.type || 'javascript'];

  // Stack trace varsa ilk birkaç satırı kullan
  if (error.stack) {
    const stackLines = error.stack
      .split('\n')
      .slice(0, 5)
      .map((line) => line.trim().replace(/\?v=[\w.]+/g, '').replace(/:\d+:\d+/g, ''))
      .join('|');
    parts.push(stackLines);
  } else {
    // Stack yoksa mesaj + kaynak + satır kullan
    const normalizedMessage = error.message
      .replace(/['"`].*?['"`]/g, 'STRING')
      .replace(/\d+/g, 'NUM')
      .trim();
    parts.push(normalizedMessage);

    if (error.source) {
      parts.push(error.source.replace(/\?.*/, '').replace(/:\d+/g, ''));
    }
  }

  const raw = parts.join('::');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Hata mesajından kısa bir başlık üretir
 */
export function generateTitle(message: string): string {
  const maxLength = 120;
  const cleaned = message
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + '...';
}
