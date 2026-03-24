.PHONY: help install install-frontend install-backend dev dev-frontend dev-backend build start stop clean logs db-migrate db-studio

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: install-backend install-frontend ## Install all dependencies (frontend + backend)

install-backend: ## Install backend dependencies
	cd backend && npm install

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

dev: dev-backend ## Start backend development server

dev-backend: ## Start backend development server
	cd backend && npm run dev

dev-frontend: ## Start frontend development server
	cd frontend && npm run dev

build: ## Build both frontend and backend for production
	cd backend && npm run build
	cd frontend && npm run build

start: ## Start all services with Docker Compose
	docker-compose up -d

restart: ## Restart all services
	docker-compose restart

stop: ## Stop all services
	docker-compose down

setup: ## First-time setup: start services and run migrations
	docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "🔄 Running database migrations..."
	cd backend && npm run prisma:migrate
	cd backend && npm run prisma:generate
	@echo "✅ Setup complete!"

clean: ## Stop services and remove volumes
	docker-compose down -v

logs: ## View backend logs
	docker-compose logs -f backend

db-migrate: ## Run database migrations
	cd backend && npm run prisma:migrate

db-studio: ## Open Prisma Studio
	cd backend && npm run prisma:studio

lint: ## Run ESLint on backend
	cd backend && npm run lint

lint-frontend: ## Run ESLint on frontend
	cd frontend && npm run lint

format: ## Format backend code with Prettier
	cd backend && npm run format

format-frontend: ## Format frontend code with Prettier
	cd frontend && npm run format
