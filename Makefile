.PHONY: help up down docker-up docker-down docker-build docker-logs \
        backend frontend seed build-sdk install dev

help:
	@echo ""
	@echo "Smart Error Tracker - Komutlar"
	@echo "================================"
	@echo ""
	@echo "  Docker (tek komut – tüm sistem):"
	@echo "    make docker-up      - Tüm servisleri build edip başlat"
	@echo "    make docker-down    - Tüm servisleri durdur"
	@echo "    make docker-build   - Image'ları yeniden build et"
	@echo "    make docker-logs    - Tüm container loglarını izle"
	@echo "    make docker-restart - Backend + Frontend container'ı yeniden başlat"
	@echo ""
	@echo "  Yerel geliştirme:"
	@echo "    make up        - Sadece MongoDB Docker container'larını başlat"
	@echo "    make down      - Docker container'larını durdur"
	@echo "    make install   - Tüm bağımlılıkları kur (bun install)"
	@echo "    make backend   - Backend geliştirici sunucusunu başlat"
	@echo "    make frontend  - Frontend geliştirici sunucusunu başlat"
	@echo "    make seed      - Örnek veriler oluştur"
	@echo "    make build-sdk - SDK'yı derle"
	@echo ""

# ─── Docker (tam stack) ────────────────────────────────────────────────────────
docker-up:
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up -d --build
	@echo ""
	@echo "✅ Tüm servisler başlatıldı:"
	@echo "   Dashboard  → http://localhost:3000"
	@echo "   API        → http://localhost:3001"
	@echo "   Swagger    → http://localhost:3001/swagger"
	@echo ""

docker-down:
	docker compose down

docker-build:
	docker compose build --no-cache

docker-logs:
	docker compose logs -f

docker-restart:
	docker compose restart backend frontend

# ─── Yerel geliştirme ──────────────────────────────────────────────────────────
up:
	@cp -n .env.example .env 2>/dev/null || true
	docker compose up -d mongodb
	@echo "✅ MongoDB başlatıldı (iç ağ: mongodb:27017)"

down:
	docker compose down

backend:
	@echo "Backend başlatılıyor..."
	@cp -n backend/.env.example backend/.env 2>/dev/null || true
	cd backend && bun run dev

frontend:
	@echo "Frontend başlatılıyor..."
	@cp -n frontend/.env.example frontend/.env 2>/dev/null || true
	cd frontend && bun run dev

seed:
	cd backend && bun run seed.ts

build-sdk:
	cd sdk && bun run build

install:
	cd backend && bun install
	cd sdk && bun install
	cd frontend && bun install

dev: up
	@echo "Geliştirme ortamı hazır!"
	@echo "Backend için: make backend"
	@echo "Frontend için: make frontend"
