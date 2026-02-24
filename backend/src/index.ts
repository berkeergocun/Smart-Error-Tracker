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
  // ─── Analytic Script (/analytic/index.js?uuid=<domain-uuid>) ───────────────
  // Kullanım: <script src="https://host:3001/analytic/index.js?uuid=xxx"></script>
  // UUID script URL'inden otomatik okunur, ekstra konfigürasyon gerekmez.
  .get('/analytic/index.js', async ({ query, set, request }) => {
    const uuid = query.uuid as string | undefined;

    set.headers['Content-Type'] = 'application/javascript; charset=utf-8';
    set.headers['Cache-Control'] = 'public, max-age=86400'; // 24 saat cache

    if (!uuid) {
      set.status = 400;
      set.headers['Content-Type'] = 'application/javascript; charset=utf-8';
      return `console.error('[SmartErrorTracker] uuid parametresi eksik. Örnek: /analytic/index.js?uuid=<domain-uuid>');`;
    }

    // Domain doğrula
    const { Domain } = await import('./models/Domain');
    const domain = await Domain.findOne({ uuid }).lean();
    if (!domain) {
      set.status = 404;
      return `console.error('[SmartErrorTracker] Geçersiz domain uuid: ${uuid}');`;
    }

    // Origin: script src URL'inden API base URL'ini çıkar
    // (script aynı sunucudan servis edildiği için origin = bu backend'in URL'i)
    const origin = new URL(request.url).origin;

    return buildAnalyticScript(uuid, origin);
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

/**
 * Domain UUID'si script URL'sine embed edilmiş,
 * tek <script> tag'iyle çalışan analitik script üretici.
 */
function buildAnalyticScript(uuid: string, apiUrl: string): string {
  return `/* Smart Error Tracker | domain: ${uuid} */
(function () {
  'use strict';

  var API_URL = '${apiUrl}';
  var DOMAIN_ID = '${uuid}';
  var MAX_BREADCRUMBS = 30;
  var breadcrumbs = [];

  function addCrumb(type, message, data) {
    breadcrumbs.push({ type: type, message: message, timestamp: new Date().toISOString(), data: data });
    if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
  }

  function send(payload) {
    var body = JSON.stringify(Object.assign({
      url: window.location.href,
      userAgent: navigator.userAgent,
      breadcrumbs: breadcrumbs.slice()
    }, payload));

    // sendBeacon tercihli (sayfa kapanırken kaybolmaz)
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(API_URL + '/api/errors/ingest?uuid=' + DOMAIN_ID, blob);
    } else {
      fetch(API_URL + '/api/errors/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-domain-id': DOMAIN_ID },
        body: body,
        keepalive: true
      }).catch(function () {});
    }
  }

  // ── Global JS hataları ─────────────────────────────────────────────────────
  window.addEventListener('error', function (e) {
    if (!e.message) return;
    addCrumb('error', e.message, { source: e.filename, lineno: e.lineno });
    send({
      message: e.message,
      type: 'javascript',
      severity: 'high',
      stack: e.error && e.error.stack,
      source: e.filename,
      lineno: e.lineno,
      colno: e.colno
    });
  });

  // ── Yakalanmamış Promise red'leri ─────────────────────────────────────────
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var message = (reason && reason.message) ? reason.message : String(reason);
    addCrumb('error', 'Unhandled rejection: ' + message.slice(0, 100));
    send({
      message: message,
      type: 'promise',
      severity: 'high',
      stack: reason && reason.stack
    });
  });

  // ── Fetch interceptor (ağ hatalarını yakala) ───────────────────────────────
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    var reqUrl = typeof input === 'string' ? input : (input && input.url) || '';
    var method = (init && init.method) || 'GET';
    var t0 = Date.now();

    // Kendi ingest isteğini izleme (sonsuz döngü önlemi)
    if (reqUrl.indexOf('/analytic/') !== -1 || reqUrl.indexOf('/api/errors/ingest') !== -1) {
      return _fetch.apply(window, arguments);
    }

    return _fetch.apply(window, arguments).then(function (res) {
      var ms = Date.now() - t0;
      if (!res.ok) {
        addCrumb('fetch', method + ' ' + reqUrl + ' → ' + res.status, { ms: ms });
        if (res.status >= 500) {
          send({
            message: 'HTTP ' + res.status + ': ' + method + ' ' + reqUrl,
            type: 'network',
            severity: 'medium',
            metadata: { httpStatus: res.status, requestUrl: reqUrl, method: method, ms: ms }
          });
        }
      } else {
        addCrumb('fetch', method + ' ' + reqUrl + ' → ' + res.status, { ms: ms });
      }
      return res;
    }).catch(function (err) {
      var ms = Date.now() - t0;
      addCrumb('fetch', method + ' ' + reqUrl + ' failed', { ms: ms });
      send({
        message: 'Network error: ' + method + ' ' + reqUrl,
        type: 'network',
        severity: 'high',
        stack: err && err.stack,
        metadata: { requestUrl: reqUrl, method: method, ms: ms }
      });
      throw err;
    });
  };

  // ── Tıklama breadcrumbs ────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el) return;
    var label = (el.textContent || '').trim().slice(0, 60)
      || el.getAttribute('aria-label')
      || el.tagName;
    addCrumb('click', 'Click: ' + label, { tag: el.tagName, id: el.id || undefined });
  }, { passive: true });

  // ── Navigation breadcrumbs ─────────────────────────────────────────────────
  var _push = history.pushState;
  history.pushState = function () {
    _push.apply(history, arguments);
    addCrumb('navigation', 'Navigate: ' + (arguments[2] || location.href));
  };
  window.addEventListener('popstate', function () {
    addCrumb('navigation', 'Popstate: ' + location.href);
  });

  // ── Public API ────────────────────────────────────────────────────────────
  window.SmartErrorTracker = {
    captureException: function (err, extra) {
      send({ message: err.message, type: 'javascript', severity: 'high', stack: err.stack, metadata: extra });
    },
    captureMessage: function (msg, severity) {
      send({ message: msg, type: 'custom', severity: severity || 'low' });
    },
    addBreadcrumb: function (type, message, data) {
      addCrumb(type || 'custom', message, data);
    }
  };

  console.debug('[SmartErrorTracker] Initialized ✓ domain=' + DOMAIN_ID);
})();
`;
}
