.PHONY: dev build start stop seed help

help:
	@echo "Smart Error Tracker - Komutlar:"
	@echo ""
	@echo "  make up        - MongoDB Docker container'larını başlat"
	@echo "  make down      - Docker container'larını durdur"
	@echo "  make backend   - Backend geliştirici sunucusunu başlat"
	@echo "  make frontend  - Frontend geliştirici sunucusunu başlat"
	@echo "  make seed      - Örnek veriler oluştur"
	@echo "  make build-sdk - SDK'yı derle"
	@echo "  make install   - Tüm bağımlılıkları kur"

up:
	docker-compose up -d
	@echo "✅ MongoDB başlatıldı: mongodb://localhost:27017"
	@echo "✅ Mongo Express: http://localhost:8081 (admin/admin123)"

down:
	docker-compose down

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
