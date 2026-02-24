<div align="center">

# 🔍 Smart Error Tracker

**Full-stack, açık kaynaklı hata takip ve analiz sistemi.**  
Frontend ve backend hatalarını otomatik olarak toplar, parmak izi ile gruplar ve GPT-4o-mini ile olası nedenlerini Türkçe açıklar.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Runtime-Bun.js-black?logo=bun)](https://bun.sh)
[![Elysia](https://img.shields.io/badge/Framework-Elysia.js-violet)](https://elysiajs.com)
[![Nuxt](https://img.shields.io/badge/Frontend-Nuxt%204-00DC82?logo=nuxt.js)](https://nuxt.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%207-green?logo=mongodb)](https://mongodb.com)

</div>

---

## 📸 Ekran Görüntüleri

### Dashboard – Genel Bakış
<!-- Dashboard ekran görüntüsünü docs/screenshots/dashboard.png olarak ekleyin -->
> 📷 `docs/screenshots/dashboard.png` dosyasını buraya ekleyin
> ```md
> ![Dashboard](docs/screenshots/dashboard.png)
> ```

---

### Hata Listesi
<!-- Hata listesi ekran görüntüsünü docs/screenshots/errors.png olarak ekleyin -->
> 📷 `docs/screenshots/errors.png` dosyasını buraya ekleyin
> ```md
> ![Hata Listesi](docs/screenshots/errors.png)
> ```

---

### Hata Detayı & AI Analizi
<!-- Hata detay sayfası ekran görüntüsünü docs/screenshots/error-detail.png olarak ekleyin -->
> 📷 `docs/screenshots/error-detail.png` dosyasını buraya ekleyin
> ```md
> ![Hata Detayı](docs/screenshots/error-detail.png)
> ```

---

### Hata Grupları
<!-- Grup listesi ekran görüntüsünü docs/screenshots/groups.png olarak ekleyin -->
> 📷 `docs/screenshots/groups.png` dosyasını buraya ekleyin
> ```md
> ![Hata Grupları](docs/screenshots/groups.png)
> ```

---

### Domain Yönetimi & Entegrasyon Kodu
<!-- Domain detay sayfası ekran görüntüsünü docs/screenshots/domain-detail.png olarak ekleyin -->
> 📷 `docs/screenshots/domain-detail.png` dosyasını buraya ekleyin
> ```md
> ![Domain Yönetimi](docs/screenshots/domain-detail.png)
> ```

---

## ✨ Özellikler

- **Tek satır entegrasyon** – HTML sayfanıza bir `<script>` etiketi yeterli
- **Otomatik hata yakalama** – `window.onerror`, `unhandledrejection`, fetch hataları
- **Parmak izi tabanlı gruplama** – SHA-256 ile aynı hataları tek grupta toplar
- **AI destekli analiz** – GPT-4o-mini ile Türkçe hata açıklaması ve çözüm önerileri
- **Fallback analiz** – OpenAI API anahtarı olmadan da çalışır (pattern matching)
- **Breadcrumb takibi** – Hataya giden adımlar (navigation, click, console)
- **Severity sınıflandırması** – `low`, `medium`, `high`, `critical`
- **Multi-domain desteği** – Birden fazla proje/site tek dashboarddan yönetilir
- **sendBeacon desteği** – Sayfa kapanırken bile hata kaybolmaz
- **Node.js SDK** – Express middleware ile sunucu tarafı hatalar
- **Swagger UI** – `/swagger` adresinde interaktif API dokümantasyonu
- **Mongo Express** – Veritabanını görsel arayüzle yönet

---

## 🏗️ Mimari

```
smart-error-tracker/
├── backend/               # Bun.js + Elysia.js REST API
│   └── src/
│       ├── models/        # Mongoose modelleri (Domain, Error, ErrorGroup)
│       ├── routes/        # API endpoint'leri (domains, errors, groups, stats)
│       ├── services/      # AI analizi ve parmak izi servisleri
│       ├── db.ts          # MongoDB bağlantısı
│       └── index.ts       # Uygulama giriş noktası + /analytic/index.js servisi
├── frontend/              # Nuxt 4 + Shadcn UI Dashboard
│   └── pages/
│       ├── index.vue      # Dashboard
│       ├── errors/        # Hata listesi ve detay
│       ├── groups/        # Hata grupları
│       └── domains/       # Domain yönetimi
├── sdk/                   # @smart-error-tracker/sdk npm paketi
│   └── src/
│       ├── browser.ts     # Browser SDK
│       ├── node.ts        # Node.js SDK
│       ├── client.ts      # Base istemci
│       └── types.ts       # TypeScript tip tanımları
├── docs/
│   └── screenshots/       # Ekran görüntüleri buraya eklenir
├── docker-compose.yml     # MongoDB + Mongo Express
├── mongo-init.js          # DB başlangıç scriptleri ve indexler
└── Makefile               # Kısayol komutlar
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

| Araç | Versiyon |
|------|----------|
| [Bun.js](https://bun.sh) | ≥ 1.3 |
| [Docker](https://docker.com) | ≥ 24 |
| [Docker Compose](https://docs.docker.com/compose/) | ≥ 2.x |

### 1. Repoyu klonla

```bash
git clone https://github.com/KULLANICI_ADI/smart-error-tracker.git
cd smart-error-tracker
```

### 2. Bağımlılıkları kur

```bash
make install
# veya manuel:
cd backend && bun install
cd ../sdk && bun install
cd ../frontend && bun install
```

### 3. Ortam değişkenlerini yapılandır

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` dosyasını düzenleyin:

```env
PORT=3001
MONGODB_URI=mongodb://root:smarterror123@localhost:27017/smart_error_tracker?authSource=admin
OPENAI_API_KEY=sk-...          # İsteğe bağlı – yoksa fallback analiz kullanılır
JWT_SECRET=gizli_bir_deger
FRONTEND_URL=http://localhost:3000
```

`frontend/.env` dosyasını düzenleyin:

```env
NUXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. MongoDB'yi başlat

```bash
make up
# veya: docker-compose up -d
```

| Servis | URL |
|--------|-----|
| MongoDB | `mongodb://localhost:27017` |
| Mongo Express (DB GUI) | [http://localhost:8081](http://localhost:8081) — `admin` / `admin123` |

### 5. Backend'i başlat

```bash
make backend
# veya: cd backend && bun run dev
```

Backend çalıştığında: [http://localhost:3001](http://localhost:3001)  
Swagger UI: [http://localhost:3001/swagger](http://localhost:3001/swagger)

### 6. Frontend'i başlat

```bash
make frontend
# veya: cd frontend && bun run dev
```

Dashboard: [http://localhost:3000](http://localhost:3000)

### 7. (İsteğe bağlı) Örnek veriler yükle

```bash
make seed
```

---

## 📦 SDK Kullanımı

### Browser — Tek Satır Entegrasyon

Domain oluşturduktan sonra size verilen UUID'yi kullanarak sitenizin `<head>` ya da `<body>` bölümüne tek satır ekleyin:

```html
<script src="http://localhost:3001/analytic/index.js?uuid=DOMAIN_UUID_BURAYA"></script>
```

> Script yüklendiği anda hata yakalamaya başlar. Başka bir konfigürasyon gerekmez.

**Script'in otomatik olarak yakaladıkları:**
- JavaScript runtime hataları (`window.onerror`)
- Yakalanmamış Promise redleri (`unhandledrejection`)
- Başarısız `fetch` istekleri
- Sayfa navigasyon geçmişi
- Kullanıcı tıklamalarına ait breadcrumb'lar

**Manuel hata gönderimi:**

```javascript
// Bir hatayı manuel yakala
window.SmartErrorTracker.captureException(new Error('Bir şeyler ters gitti'));

// Mesaj gönder
window.SmartErrorTracker.captureMessage('Kullanıcı ödeme adımında takıldı', 'warning');

// Breadcrumb ekle
window.SmartErrorTracker.addBreadcrumb({
  category: 'ui',
  message: 'Sepete ürün eklendi',
  level: 'info',
});
```

---

### Node.js / Backend Entegrasyonu

```bash
npm install @smart-error-tracker/sdk
# veya
bun add @smart-error-tracker/sdk
```

```typescript
import SmartErrorTracker from '@smart-error-tracker/sdk';

SmartErrorTracker.init({
  apiUrl: 'http://localhost:3001',
  domainId: 'DOMAIN_UUID_BURAYA',
  debug: false,          // Konsol logları açmak için true yapın
  sampleRate: 1.0,       // 1.0 = tüm hataları gönder, 0.5 = %50'sini gönder
});
```

**Express middleware:**

```typescript
import express from 'express';
import SmartErrorTracker from '@smart-error-tracker/sdk';

const app = express();

SmartErrorTracker.init({ apiUrl: '...', domainId: '...' });

// Diğer route'lardan SONRA ekleyin
app.use(SmartErrorTracker.expressMiddleware());
```

**Manuel hata yakalama (Node.js):**

```typescript
try {
  await riskliIslem();
} catch (err) {
  SmartErrorTracker.captureException(err);
}
```

---

## 🗂️ API Referansı

Tüm endpoint'ler interaktif olarak Swagger UI üzerinden test edilebilir: [http://localhost:3001/swagger](http://localhost:3001/swagger)

### Domain Yönetimi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/domains` | Tüm domainleri listele |
| `POST` | `/api/domains` | Yeni domain oluştur (UUID otomatik üretilir) |
| `GET` | `/api/domains/:uuid` | Domain detayı |
| `PATCH` | `/api/domains/:uuid` | Domain güncelle |
| `DELETE` | `/api/domains/:uuid` | Domain sil |

### Hata İşlemleri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/api/errors/ingest` | SDK'dan hata gönder (header veya `?uuid=` query) |
| `GET` | `/api/errors` | Hataları filtrele (severity, type, resolved, search) |
| `GET` | `/api/errors/:id` | Hata detayı |
| `PATCH` | `/api/errors/:id/resolve` | Hatayı çözüldü olarak işaretle |

### Hata Grupları

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/groups` | Hata gruplarını listele |
| `GET` | `/api/groups/:id` | Grup detayı + örnek hatalar |
| `POST` | `/api/groups/:id/analyze` | AI analizi başlat |
| `PATCH` | `/api/groups/:id/resolve` | Grubu çözüldü olarak işaretle |

### İstatistikler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/stats` | Genel istatistikler (özet kartlar) |
| `GET` | `/api/stats/trend` | 7 günlük hata trendi (grafik verisi) |
| `GET` | `/api/stats/by-type` | Türe göre dağılım |
| `GET` | `/api/stats/by-severity` | Ciddiyete göre dağılım |
| `GET` | `/api/stats/recent` | Son hatalar |
| `GET` | `/api/stats/top-groups` | En sık tekrarlayan hatalar |

### Browser Script Servisi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/analytic/index.js?uuid=<uuid>` | UUID'ye göre konfigüre edilmiş IIFE script döner |
| `GET` | `/health` | Servis sağlık kontrolü |
| `GET` | `/swagger` | Swagger UI |

---

## 🧠 AI Analizi Nasıl Çalışır?

Bir hata ilk kez yakalandığında (veya grubu tetiklendiğinde) sistem şu adımları izler:

1. **Fingerprint** – Stack trace SHA-256 ile hashlenerek benzersiz bir parmak izi üretilir  
2. **Gruplama** – Aynı parmak izine sahip hatalar tek grupta toplanır  
3. **AI Analizi** – GPT-4o-mini, hata mesajı + stack trace + kaynak bilgisini analiz eder  
4. **Türkçe rapor** – Özet, olası nedenler ve düzeltme önerileri dashboard'da gösterilir  

OpenAI API anahtarı tanımlanmamışsa, yerleşik pattern matching motoru devreye girer ve bilinen hata kalıplarına göre statik analiz üretir — sistem anahtarsız da eksiksiz çalışır.

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz!

1. Bu repoyu **fork** edin  
2. Yeni bir dal oluşturun: `git checkout -b feature/ozellik-adi`  
3. Değişikliklerinizi commit edin: `git commit -m 'feat: yeni özellik'`  
4. Dalı gönderin: `git push origin feature/ozellik-adi`  
5. **Pull Request** açın  

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında dağıtılmaktadır.

---

<div align="center">

**Smart Error Tracker** — Açık kaynak ile daha güvenilir yazılımlar 🚀

</div>
