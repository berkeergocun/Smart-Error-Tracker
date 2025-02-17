import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { connectDB } from './db';
import { domainsRouter } from './routes/domains';
import { errorsRouter } from './routes/errors';
import { groupsRouter } from './routes/groups';
import { statsRouter } from './routes/stats';

const PORT = parseInt(process.env.PORT || '3001');

// MongoDB bağlantısı
await connectDB();

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-domain-id'],
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Smart Error Tracker API',
          version: '1.0.0',
          description: 'Hata takip ve analiz sistemi API\'si',
        },
        tags: [
          { name: 'domains', description: 'Domain yönetimi' },
          { name: 'errors', description: 'Hata yönetimi' },
          { name: 'groups', description: 'Hata grupları' },
          { name: 'stats', description: 'İstatistikler' },
        ],
      },
    })
  )
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Smart Error Tracker API',
  }))
  // Browser SDK'yı sun
  .get('/sdk.js', async ({ set }) => {
    const sdkPath = new URL('../../../sdk/dist/browser.global.js', import.meta.url);
    try {
      const file = Bun.file(sdkPath);
      const exists = await file.exists();
      if (exists) {
        set.headers['Content-Type'] = 'application/javascript';
        set.headers['Cache-Control'] = 'public, max-age=3600';
        return file.text();
      }
    } catch {}
    // Fallback: minimal inline SDK
    set.headers['Content-Type'] = 'application/javascript';
    return `
(function() {
  var config = window.SmartErrorTrackerConfig || {};
  if (!config.apiUrl || !config.domainId) return;
  function send(payload) {
    fetch(config.apiUrl + '/api/errors/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-domain-id': config.domainId },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(){});
  }
  window.onerror = function(msg, src, line, col, error) {
    send({ message: msg, type: 'javascript', severity: 'high', stack: error && error.stack, source: src, lineno: line, colno: col, url: window.location.href, userAgent: navigator.userAgent });
  };
  window.addEventListener('unhandledrejection', function(e) {
    var err = e.reason;
    send({ message: err && err.message || String(err), type: 'promise', severity: 'high', stack: err && err.stack, url: window.location.href, userAgent: navigator.userAgent });
  });
  window.SmartErrorTracker = {
    captureException: function(e) { send({ message: e.message, type: 'javascript', severity: 'high', stack: e.stack, url: window.location.href }); },
    captureMessage: function(msg, sev) { send({ message: msg, type: 'custom', severity: sev || 'low', url: window.location.href }); }
  };
  console.log('[SmartErrorTracker] Initialized for domain: ' + config.domainId);
})();
  `;
  })
  .use(domainsRouter)
  .use(errorsRouter)
  .use(groupsRouter)
  .use(statsRouter)
  .onError(({ code, error, set }) => {
    console.error(`[${code}]`, error);

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        message: 'Geçersiz veri',
        details: error.message,
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { success: false, message: 'Kaynak bulunamadı' };
    }

    set.status = 500;
    return { success: false, message: 'Sunucu hatası' };
  })
  .listen(PORT);

console.log(`
╔══════════════════════════════════════════╗
║     Smart Error Tracker API              ║
╠══════════════════════════════════════════╣
║  URL: http://localhost:${PORT}              ║
║  Docs: http://localhost:${PORT}/swagger     ║
║  Health: http://localhost:${PORT}/health    ║
╚══════════════════════════════════════════╝
`);

export type App = typeof app;
