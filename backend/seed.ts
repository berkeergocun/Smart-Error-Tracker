#!/usr/bin/env bun
/**
 * Seed script – gerçekçi örnek veriler oluşturur
 * Kullanım: bun run seed.ts
 *           API_URL=http://localhost:3001 bun run seed.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

// ─── Domain tanımları ────────────────────────────────────────────────────────
const domains = [
  {
    name: 'E-Ticaret Sitesi',
    domain: 'shop.sirketim.com',
    description: 'Ana alışveriş platformu',
  },
  {
    name: 'Admin Paneli',
    domain: 'admin.sirketim.com',
    description: 'Dahili yönetim arayüzü',
  },
  {
    name: 'Mobil API',
    domain: 'api.sirketim.com',
    description: 'iOS ve Android uygulamaları için REST API',
  },
];

// ─── Gerçekçi hata senaryoları ───────────────────────────────────────────────
const errorScenarios = [
  // — JavaScript runtime hataları —
  {
    message: "Cannot read properties of undefined (reading 'map')",
    type: 'javascript',
    severity: 'high',
    stack: `TypeError: Cannot read properties of undefined (reading 'map')
    at ProductList (src/components/ProductList.vue:58:23)
    at renderComponentRoot (node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:887:12)
    at mountComponent (node_modules/@vue/runtime-core/dist/runtime-core.cjs.js:1120:5)`,
    source: 'src/components/ProductList.vue',
    lineno: 58,
    colno: 23,
    weight: 18,
  },
  {
    message: "Cannot read properties of null (reading 'querySelector')",
    type: 'javascript',
    severity: 'medium',
    stack: `TypeError: Cannot read properties of null (reading 'querySelector')
    at initSlider (src/utils/slider.ts:22:14)
    at mounted (src/components/HeroBanner.vue:91:5)`,
    source: 'src/utils/slider.ts',
    lineno: 22,
    colno: 14,
    weight: 9,
  },
  {
    message: 'Maximum call stack size exceeded',
    type: 'javascript',
    severity: 'critical',
    stack: `RangeError: Maximum call stack size exceeded
    at watch (src/composables/useCart.ts:34:17)
    at watch (src/composables/useCart.ts:34:17)
    at watch (src/composables/useCart.ts:34:17)`,
    source: 'src/composables/useCart.ts',
    lineno: 34,
    colno: 17,
    weight: 5,
  },
  {
    message: "Uncaught SyntaxError: Unexpected token '<' (JSON parse error)",
    type: 'javascript',
    severity: 'high',
    stack: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
    at JSON.parse (<anonymous>)
    at parseResponse (src/api/client.ts:47:20)
    at async fetchProducts (src/api/products.ts:23:14)`,
    source: 'src/api/client.ts',
    lineno: 47,
    colno: 20,
    weight: 12,
  },
  {
    message: "ReferenceError: __NUXT__ is not defined",
    type: 'javascript',
    severity: 'medium',
    stack: `ReferenceError: __NUXT__ is not defined
    at Object.<anonymous> (/_nuxt/entry.js:1:45)`,
    source: '/_nuxt/entry.js',
    lineno: 1,
    colno: 45,
    weight: 6,
  },

  // — Promise / async hataları —
  {
    message: 'Unhandled Promise Rejection: Network request failed',
    type: 'promise',
    severity: 'high',
    stack: `Error: Network request failed
    at fetchUser (src/services/userService.ts:67:12)
    at async ProfilePage.setup (src/pages/profile.vue:134:5)`,
    source: 'src/services/userService.ts',
    lineno: 67,
    colno: 12,
    weight: 14,
  },
  {
    message: 'Unhandled Promise Rejection: JWT expired',
    type: 'promise',
    severity: 'medium',
    stack: `Error: JWT expired
    at verifyToken (src/middleware/auth.ts:28:11)
    at async authGuard (src/router/guards.ts:15:5)`,
    source: 'src/middleware/auth.ts',
    lineno: 28,
    colno: 11,
    weight: 10,
  },
  {
    message: 'Unhandled Promise Rejection: Request timeout after 10000ms',
    type: 'promise',
    severity: 'medium',
    stack: `Error: Request timeout after 10000ms
    at createTimeout (src/api/client.ts:89:11)
    at Promise.race (src/api/client.ts:103:12)`,
    source: 'src/api/client.ts',
    lineno: 89,
    colno: 11,
    weight: 8,
  },

  // — Network hataları —
  {
    message: 'Failed to fetch: ERR_CONNECTION_REFUSED',
    type: 'network',
    severity: 'critical',
    stack: `TypeError: Failed to fetch
    at checkout (src/pages/checkout.vue:203:16)
    at async submitOrder (src/pages/checkout.vue:188:5)`,
    source: 'src/pages/checkout.vue',
    lineno: 203,
    colno: 16,
    weight: 7,
  },
  {
    message: 'CORS policy: No Access-Control-Allow-Origin header',
    type: 'network',
    severity: 'high',
    stack: `Error: Access to fetch at 'https://api.sirketim.com/v2/products' from origin 'https://shop.sirketim.com' has been blocked by CORS policy`,
    source: 'src/api/products.ts',
    lineno: 15,
    colno: 5,
    weight: 4,
  },

  // — Resource hataları —
  {
    message: "Failed to load resource: 404 Not Found (/assets/hero-banner.webp)",
    type: 'resource',
    severity: 'low',
    stack: `GET https://shop.sirketim.com/assets/hero-banner.webp 404`,
    source: '/assets/hero-banner.webp',
    lineno: 0,
    colno: 0,
    weight: 20,
  },
  {
    message: "Failed to load resource: 500 Internal Server Error (/api/cart/sync)",
    type: 'resource',
    severity: 'high',
    stack: `POST https://shop.sirketim.com/api/cart/sync 500 Internal Server Error`,
    source: '/api/cart/sync',
    lineno: 0,
    colno: 0,
    weight: 11,
  },
];

// ─── Örnek breadcrumb setleri ────────────────────────────────────────────────
const breadcrumbSets = [
  [
    { category: 'navigation', message: 'Anasayfa → Ürünler', level: 'info', timestamp: new Date(Date.now() - 30000) },
    { category: 'ui', message: 'Filtre: "Elektronik" seçildi', level: 'info', timestamp: new Date(Date.now() - 20000) },
    { category: 'http', message: 'GET /api/products?category=electronics', level: 'info', timestamp: new Date(Date.now() - 10000) },
  ],
  [
    { category: 'navigation', message: 'Sepet sayfasına gidildi', level: 'info', timestamp: new Date(Date.now() - 45000) },
    { category: 'ui', message: '"Satın Al" butonuna tıklandı', level: 'info', timestamp: new Date(Date.now() - 30000) },
    { category: 'http', message: 'POST /api/orders — 500 Internal Server Error', level: 'error', timestamp: new Date(Date.now() - 15000) },
  ],
  [
    { category: 'navigation', message: 'Giriş sayfasından yönlendirildi', level: 'info', timestamp: new Date(Date.now() - 60000) },
    { category: 'http', message: 'GET /api/user/profile', level: 'info', timestamp: new Date(Date.now() - 50000) },
    { category: 'console', message: 'Uyarı: token süresi dolmak üzere', level: 'warning', timestamp: new Date(Date.now() - 20000) },
  ],
];

// ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Ağırlıklı rastgele seçim – weight değeri yüksek olanlar daha sık seçilir */
function weightedRandom(scenarios: typeof errorScenarios) {
  const total = scenarios.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const s of scenarios) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return scenarios[scenarios.length - 1];
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
];

const pages = [
  '/urunler', '/urunler/12/detay', '/sepet', '/odeme', '/profil',
  '/siparislerim', '/favoriler', '/giris', '/kayit', '/hakkimizda',
];

// ─── API çağrıları ───────────────────────────────────────────────────────────
async function createDomain(domain: { name: string; domain: string; description: string }) {
  const res = await fetch(`${API_URL}/api/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(domain),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.data;
}

async function sendError(domainId: string, scenario: typeof errorScenarios[0], daysAgo = 0) {
  // Geçmiş tarihler için timestamp manipülasyonu (trend verisini doldurmak için)
  const timestamp = new Date(Date.now() - daysAgo * 86_400_000 - randomInt(0, 3_600_000));

  await fetch(`${API_URL}/api/errors/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-domain-id': domainId,
    },
    body: JSON.stringify({
      message: scenario.message,
      type: scenario.type,
      severity: scenario.severity,
      stack: scenario.stack,
      source: scenario.source,
      lineno: scenario.lineno,
      colno: scenario.colno,
      url: `https://shop.sirketim.com${randomFrom(pages)}`,
      userAgent: randomFrom(userAgents),
      breadcrumbs: randomFrom(breadcrumbSets),
      metadata: {
        sessionId: `sess_${Math.random().toString(36).slice(2, 10)}`,
        userId: Math.random() > 0.4 ? `user_${randomInt(1000, 9999)}` : undefined,
        appVersion: '2.4.1',
        timestamp: timestamp.toISOString(),
      },
    }),
  });
}

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  Smart Error Tracker – Seed başlatılıyor...\n');
  console.log(`📡  API: ${API_URL}\n`);

  // 1) Domain'leri oluştur ya da mevcut olanları getir
  const createdDomains: Array<{ uuid: string; name: string }> = [];

  for (const domain of domains) {
    try {
      const d = await createDomain(domain);
      createdDomains.push(d);
      console.log(`✅  Domain oluşturuldu: ${domain.name}  (${d.uuid})`);
    } catch {
      // Domain zaten varsa listeden al
    }
  }

  // Hiç domain oluşturulamadıysa mevcut domain'leri API'den çek
  if (createdDomains.length === 0) {
    console.log('ℹ️   Domain\'ler zaten mevcut, veritabanındakiler kullanılacak...\n');
    const res = await fetch(`${API_URL}/api/domains`);
    if (!res.ok) {
      console.log('\n❌  Backend\'e ulaşılamıyor. Backend çalışıyor mu?');
      process.exit(1);
    }
    const data = await res.json();
    const existing = (data.data || []) as Array<{ uuid: string; name: string }>;
    createdDomains.push(...existing);

    if (createdDomains.length === 0) {
      console.log('\n❌  Hiç domain bulunamadı.');
      process.exit(1);
    }

    for (const d of createdDomains) {
      console.log(`📋  Mevcut domain: ${d.name}  (${d.uuid})`);
    }
    console.log('');
  }

  // 2) Her domain için son 7 güne yayılmış hatalar gönder
  let totalErrors = 0;

  for (const domain of createdDomains) {
    console.log(`\n📦  ${domain.name} için hatalar oluşturuluyor...`);

    for (let day = 6; day >= 0; day--) {
      // Her gün için rastgele 8-25 hata
      const dailyCount = randomInt(8, 25);

      for (let i = 0; i < dailyCount; i++) {
        try {
          const scenario = weightedRandom(errorScenarios);
          await sendError(domain.uuid, scenario, day);
          totalErrors++;
        } catch {
          // sessiz geç
        }
      }

      process.stdout.write(`  Gün -${day}: ${dailyCount} hata gönderildi\n`);

      // Rate limit'i önlemek için kısa bekleme
      await Bun.sleep(120);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`✨  Seed tamamlandı!`);
  console.log(`📊  Toplam gönderilen: ~${totalErrors} hata olayı`);
  console.log(`🌐  ${createdDomains.length} domain`);
  console.log(`📈  7 günlük trend verisi oluşturuldu`);
  console.log('\n🔗  Dashboard: http://localhost:3000');
  console.log(`🔗  Swagger:   ${API_URL}/swagger`);
  console.log('─'.repeat(50) + '\n');
}

main().catch((err) => {
  console.error('\n❌  Seed başarısız:', err.message);
  process.exit(1);
});

