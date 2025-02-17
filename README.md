# Smart Error Tracker

Full-stack hata takip sistemi. Frontend ve backend hatalarını toplar, gruplar ve AI ile olası nedenlerini açıklar.

## Mimari

```
smart-error-tracker/
├── backend/          # Bun.js + Elysia.js API sunucusu
├── frontend/         # Nuxt.js 4 + Shadcn UI Dashboard
├── sdk/              # NPM paketi (browser + Node.js SDK)
└── docker-compose.yml
```

## Hızlı Başlangıç

### 1. MongoDB'yi başlat
```bash
docker-compose up -d
```

### 2. Backend'i başlat
```bash
cd backend
bun install
bun run dev
```

### 3. Frontend'i başlat
```bash
cd frontend
bun install
bun run dev
```

## SDK Kullanımı

### Browser (HTML içine göm)
```html
<script>
  window.SmartErrorTracker = {
    apiUrl: 'http://localhost:3001',
    domainId: 'your-domain-uuid'
  };
</script>
<script src="https://cdn.smarterrortracker.io/sdk.js"></script>
```

### Node.js / Backend
```bash
npm install @smart-error-tracker/sdk
```

```javascript
import { SmartErrorTracker } from '@smart-error-tracker/sdk';

const tracker = new SmartErrorTracker({
  apiUrl: 'http://localhost:3001',
  domainId: 'your-domain-uuid'
});

tracker.init();
```

## Ortam Değişkenleri

### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://root:smarterror123@localhost:27017/smart_error_tracker?authSource=admin
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:3001
```

## API Dokümantasyonu

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/domains | Yeni domain kaydet |
| GET | /api/domains | Domain listesi |
| GET | /api/domains/:uuid | Domain detayı |
| POST | /api/errors | Hata gönder (SDK kullanır) |
| GET | /api/errors | Hata listesi |
| GET | /api/errors/:id | Hata detayı |
| GET | /api/groups | Hata grupları |
| GET | /api/groups/:id | Grup detayı |
| POST | /api/ai/analyze | AI analizi |
| GET | /api/stats | İstatistikler |
